/**
 * GitService — Co-Authored-By 커밋(Claude AI 커밋)을 파싱하여 AI 기여도를 추적
 *
 * git log 명령어로 커밋 히스토리를 스캔하고,
 * "Co-Authored-By" 트레일러에 "claude" 또는 "anthropic"이 포함된 커밋을 식별한다.
 */

import * as vscode from 'vscode';
import { execFile, type ChildProcess } from 'node:child_process';
import type { ActivityItem } from '../types/messages.js';

/** execFile를 Promise로 래핑하면서 ChildProcess 참조를 추적 */
function execFileTracked(
  cmd: string,
  args: string[],
  opts: Record<string, unknown>,
  activeProcesses: Set<ChildProcess>,
): Promise<{ stdout: string }> {
  return new Promise((resolve, reject) => {
    const proc = execFile(cmd, args, opts as Parameters<typeof execFile>[2], (err, stdout) => {
      activeProcesses.delete(proc);
      if (err) reject(err);
      else resolve({ stdout: stdout as string });
    });
    activeProcesses.add(proc);
  });
}

/** AI 커밋 여부를 포함한 커밋 정보 */
export interface GitCommitInfo {
  /** 커밋 해시 (40자 SHA) */
  hash: string;
  /** 커밋 메시지 */
  message: string;
  /** 작성자 (이름 <이메일>) */
  author: string;
  /** 커밋 타임스탬프 (Unix ms) */
  timestamp: number;
  /** 변경된 파일 목록 */
  files: string[];
  /** Claude/Anthropic Co-Authored-By 커밋 여부 */
  isAiCommit: boolean;
}

/** debounce 딜레이 (ms) */
const POLL_DEBOUNCE_MS = 500;

/** 최대 스캔 커밋 수 */
const MAX_LOG_COUNT = 200;

/** Co-Authored-By에서 AI 여부를 판별하는 정규식 */
const AI_COAUTHOR_RE = /co-authored-by:.*?(claude|anthropic)/i;

export class GitService implements vscode.Disposable {
  private disposables: vscode.Disposable[] = [];
  /** 활성 자식 프로세스 추적 (dispose 시 종료) */
  private activeProcesses = new Set<ChildProcess>();

  /** 새 AI 커밋 감지 시 발생 */
  private readonly _onCommits = new vscode.EventEmitter<GitCommitInfo[]>();
  readonly onCommits = this._onCommits.event;

  /** 스캔한 AI 커밋 캐시 (hash → GitCommitInfo) */
  private commitCache = new Map<string, GitCommitInfo>();

  /** AI가 수정한 파일 집합 */
  private aiModifiedFiles = new Set<string>();

  /** debounce 타이머 */
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  /** 현재 워크스페이스 루트 경로 */
  private workspaceRoot: string | null = null;

  constructor() {
    this.disposables.push(this._onCommits);
  }

  /**
   * 현재 VS Code 워크스페이스를 스캔하여 AI 커밋을 탐색한다.
   * debounce 처리로 연속 호출을 방지한다.
   */
  scanWorkspace(): void {
    if (this.debounceTimer !== null) {
      clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = setTimeout(() => {
      this.debounceTimer = null;
      this._runScan().catch(() => {
        // 스캔 실패 graceful skip
      });
    }, POLL_DEBOUNCE_MS);
  }

  /**
   * AI가 수정한 파일 경로의 집합을 반환한다.
   */
  getAiModifiedFiles(): Set<string> {
    return new Set(this.aiModifiedFiles);
  }

  /**
   * 최근 AI 커밋을 반환한다.
   * @param count 반환할 최대 커밋 수
   */
  getRecentAiCommits(count: number): GitCommitInfo[] {
    const all = Array.from(this.commitCache.values())
      .filter((c) => c.isAiCommit)
      .sort((a, b) => b.timestamp - a.timestamp);
    return all.slice(0, count);
  }

  /**
   * AI 커밋을 ActivityItem 배열로 변환한다.
   * activity-feed-provider 등과 연계할 때 사용한다.
   */
  toActivityItems(commits: GitCommitInfo[]): ActivityItem[] {
    return commits.map((c) => ({
      id: `git-${c.hash}`,
      timestamp: c.timestamp,
      type: 'file_edit' as const,
      summary: `AI 커밋: ${c.message.split('\n')[0].slice(0, 80)}`,
      detail: c.files.join(', '),
      source: 'git',
    }));
  }

  /** 실제 git log 스캔 실행 */
  private async _runScan(): Promise<void> {
    if (this.disposed) return;
    const root = this._resolveWorkspaceRoot();
    if (!root) return;
    this.workspaceRoot = root;

    // git이 사용 가능한지, git 저장소인지 확인
    const isGitRepo = await this._checkIsGitRepo(root);
    if (!isGitRepo) return;

    const commits = await this._fetchCommits(root);
    if (commits.length === 0) return;

    // 새로 발견된 AI 커밋만 필터링
    const newAiCommits: GitCommitInfo[] = [];
    for (const commit of commits) {
      if (!this.commitCache.has(commit.hash)) {
        this.commitCache.set(commit.hash, commit);
        if (commit.isAiCommit) {
          newAiCommits.push(commit);
          // AI 수정 파일 집합 업데이트
          for (const file of commit.files) {
            this.aiModifiedFiles.add(file);
          }
        }
      }
    }

    if (newAiCommits.length > 0) {
      this._onCommits.fire(newAiCommits);
    }
  }

  /** VS Code 워크스페이스 루트 경로 해석 */
  private _resolveWorkspaceRoot(): string | null {
    const folders = vscode.workspace.workspaceFolders;
    if (!folders || folders.length === 0) return null;
    return folders[0].uri.fsPath;
  }

  /** git 저장소 여부 확인 */
  private async _checkIsGitRepo(cwd: string): Promise<boolean> {
    try {
      await execFileTracked('git', ['rev-parse', '--git-dir'], { cwd }, this.activeProcesses);
      return true;
    } catch {
      // git 미설치 또는 git 저장소 아님
      return false;
    }
  }

  /**
   * git log 실행 후 커밋 목록을 파싱한다.
   * --format에 구분자를 사용하여 멀티라인 파싱을 단순화한다.
   */
  private async _fetchCommits(cwd: string): Promise<GitCommitInfo[]> {
    // 레코드 구분자: ASCII 0x1E (Record Separator)
    const RECORD_SEP = '\x1e';
    // 필드 구분자: ASCII 0x1F (Unit Separator)
    const FIELD_SEP = '\x1f';

    // %H=해시, %s=제목, %aN=작성자명, %aE=이메일, %at=Unix타임스탬프, %b=본문(트레일러 포함)
    const formatStr = `${RECORD_SEP}%H${FIELD_SEP}%s${FIELD_SEP}%aN <%aE>${FIELD_SEP}%at${FIELD_SEP}%b`;

    let logOutput = '';
    try {
      const { stdout } = await execFileTracked(
        'git',
        ['log', `--format=${formatStr}`, `--max-count=${MAX_LOG_COUNT}`],
        { cwd, maxBuffer: 10 * 1024 * 1024 },
        this.activeProcesses,
      );
      logOutput = stdout;
    } catch {
      // git log 실패 graceful skip
      return [];
    }

    const records = logOutput.split(RECORD_SEP).filter(Boolean);
    const commits: GitCommitInfo[] = [];

    for (const record of records) {
      const commit = await this._parseRecord(record, FIELD_SEP, cwd);
      if (commit) commits.push(commit);
    }

    return commits;
  }

  /** 레코드 문자열 파싱 → GitCommitInfo */
  private async _parseRecord(
    record: string,
    fieldSep: string,
    cwd: string,
  ): Promise<GitCommitInfo | null> {
    try {
      const parts = record.split(fieldSep);
      if (parts.length < 4) return null;

      const [hash, message, author, atStr, ...bodyParts] = parts;
      const body = bodyParts.join(fieldSep); // 본문에 구분자가 있을 수 있으므로 재결합

      const trimmedHash = hash.trim();
      if (!trimmedHash || trimmedHash.length < 7) return null;

      const timestamp = (parseInt(atStr.trim(), 10) || 0) * 1000;
      const isAiCommit = AI_COAUTHOR_RE.test(body);

      // 변경 파일 목록 조회 (AI 커밋인 경우에만)
      const files = isAiCommit
        ? await this._fetchCommitFiles(trimmedHash, cwd)
        : [];

      return {
        hash: trimmedHash,
        message: (message || '').trim(),
        author: (author || '').trim(),
        timestamp,
        files,
        isAiCommit,
      };
    } catch {
      return null;
    }
  }

  /** 특정 커밋에서 변경된 파일 목록 조회 */
  private async _fetchCommitFiles(hash: string, cwd: string): Promise<string[]> {
    try {
      const { stdout } = await execFileTracked(
        'git',
        ['diff-tree', '--no-commit-id', '-r', '--name-only', hash],
        { cwd },
        this.activeProcesses,
      );
      return stdout
        .split('\n')
        .map((f) => f.trim())
        .filter(Boolean);
    } catch {
      return [];
    }
  }

  /** dispose 호출 여부 (진행 중인 스캔 즉시 중단) */
  private disposed = false;

  dispose(): void {
    this.disposed = true;
    if (this.debounceTimer !== null) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    // 활성 git 프로세스 즉시 종료
    for (const proc of this.activeProcesses) {
      try { proc.kill(); } catch { /* ignore */ }
    }
    this.activeProcesses.clear();
    for (const d of this.disposables) d.dispose();
  }
}
