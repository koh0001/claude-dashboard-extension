/**
 * SessionParserService — Claude Code 세션 JSONL 파일 파싱
 *
 * ~/.claude/projects/{hash}/sessions/*.jsonl 을 파싱하여
 * 도구 호출, 파일 편집, 커맨드 실행 등을 구조화한다.
 */

import * as vscode from 'vscode';
import * as fs from 'node:fs';
import * as path from 'node:path';
import type { ActivityItem, TokenUsage, SubagentInfo } from '../types/messages.js';

/** JSONL 라인의 파싱 결과 */
interface SessionEntry {
  type?: string;
  timestamp?: string;
  message?: {
    role?: string;
    content?: unknown;
    usage?: {
      input_tokens?: number;
      output_tokens?: number;
      cache_creation_input_tokens?: number;
      cache_read_input_tokens?: number;
    };
  };
  // tool_use 관련
  tool_name?: string;
  tool_input?: Record<string, unknown>;
  // tool_result 관련
  tool_use_id?: string;
  content?: unknown;
}

/** 히스토리 통계 (JSON 저장용) */
interface ProjectStats {
  totalTokens: TokenUsage;
  totalActivities: number;
  totalFileEdits: number;
  totalCommands: number;
  parsedFiles: string[];
  lastUpdated: number;
}

export class SessionParserService implements vscode.Disposable {
  private watchers: fs.FSWatcher[] = [];
  private knownLines = new Map<string, number>(); // 파일별 읽은 줄 수
  private disposables: vscode.Disposable[] = [];
  private statsPath: string | null = null;

  /** 누적 토큰 사용량 */
  private tokenUsage: TokenUsage = {
    inputTokens: 0, outputTokens: 0,
    cacheCreationTokens: 0, cacheReadTokens: 0, totalTokens: 0,
  };

  /** 누적 활동 통계 */
  private activityStats = { total: 0, fileEdits: 0, commands: 0 };

  private readonly _onActivity = new vscode.EventEmitter<ActivityItem[]>();
  readonly onActivity = this._onActivity.event;

  private readonly _onTokenUpdate = new vscode.EventEmitter<TokenUsage>();
  readonly onTokenUpdate = this._onTokenUpdate.event;

  private readonly _onSubagentUpdate = new vscode.EventEmitter<SubagentInfo[]>();
  readonly onSubagentUpdate = this._onSubagentUpdate.event;

  /** 서브에이전트 캐시 */
  private subagents: SubagentInfo[] = [];

  constructor() {
    this.disposables.push(this._onActivity, this._onTokenUpdate, this._onSubagentUpdate);
  }

  /** 현재 서브에이전트 목록 */
  getSubagents(): SubagentInfo[] {
    return [...this.subagents];
  }

  /** 현재 누적 토큰 사용량 */
  getTokenUsage(): TokenUsage {
    return { ...this.tokenUsage };
  }

  /** 히스토리 통계 로드 */
  private loadStats(sessionsDir: string): void {
    this.statsPath = path.join(sessionsDir, 'cfm-stats.json');
    try {
      if (fs.existsSync(this.statsPath)) {
        const raw = fs.readFileSync(this.statsPath, 'utf-8');
        const saved: ProjectStats = JSON.parse(raw);
        this.tokenUsage = { ...saved.totalTokens };
        this.activityStats = {
          total: saved.totalActivities || 0,
          fileEdits: saved.totalFileEdits || 0,
          commands: saved.totalCommands || 0,
        };
        // 이미 파싱한 파일 기록 복원
        for (const f of (saved.parsedFiles || [])) {
          this.knownLines.set(f, -1);
        }
      }
    } catch {
      // 로드 실패 무시 — 처음부터 시작
    }
  }

  /** 히스토리 통계 저장 (debounce) */
  private saveTimer: ReturnType<typeof setTimeout> | null = null;
  private saveStats(): void {
    if (!this.statsPath) return;
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => {
      this.saveTimer = null;
      try {
        const stats: ProjectStats = {
          totalTokens: { ...this.tokenUsage },
          totalActivities: this.activityStats.total,
          totalFileEdits: this.activityStats.fileEdits,
          totalCommands: this.activityStats.commands,
          parsedFiles: Array.from(this.knownLines.keys()),
          lastUpdated: Date.now(),
        };
        fs.writeFileSync(this.statsPath!, JSON.stringify(stats), 'utf-8');
      } catch {
        // 저장 실패 무시
      }
    }, 2000);
  }

  /** 세션 디렉토리 감시 시작 */
  watchDirectory(sessionsDir: string): void {
    if (!fs.existsSync(sessionsDir)) return;

    // 히스토리 로드
    this.loadStats(sessionsDir);
    // 저장된 토큰이 있으면 즉시 전달
    if (this.tokenUsage.totalTokens > 0) {
      this._onTokenUpdate.fire({ ...this.tokenUsage });
    }

    // 기존 파일 초기 스캔 (파일만 필터, 디렉토리 제외)
    try {
      const entries = fs.readdirSync(sessionsDir, { withFileTypes: true });
      const files = entries
        .filter((e) => e.isFile() && e.name.endsWith('.jsonl'))
        .map((e) => ({ name: e.name, mtime: fs.statSync(path.join(sessionsDir, e.name)).mtimeMs }))
        .sort((a, b) => a.mtime - b.mtime)
        .map((e) => e.name);
      // 최근 파일만 파싱 (최대 3개)
      const recent = files.slice(-3);
      for (const file of recent) {
        const fullPath = path.join(sessionsDir, file);
        const items = this.parseFile(fullPath);
        if (items.length > 0) {
          // 활동 통계 누적
          for (const item of items) {
            this.activityStats.total++;
            if (item.type === 'file_edit') this.activityStats.fileEdits++;
            if (item.type === 'command') this.activityStats.commands++;
          }
          this._onActivity.fire(items.slice(-50)); // 최근 50개
        }
      }
      this.saveStats();
    } catch {
      // 디렉토리 읽기 실패 무시
    }

    // 서브에이전트 스캔 (sessionsDir 하위 디렉토리들)
    this.scanSubagents(sessionsDir);

    // 디렉토리 감시
    try {
      const watcher = fs.watch(sessionsDir, (eventType, filename) => {
        if (!filename || !filename.endsWith('.jsonl')) return;
        const fullPath = path.join(sessionsDir, filename);
        this.handleFileChange(fullPath);
      });
      this.watchers.push(watcher);
    } catch {
      // watch 실패 시 폴링으로 폴백하지 않음 (MVP)
    }
  }

  /** JSONL 파일 파싱 (대용량 파일은 끝부분만 읽기) */
  parseFile(filePath: string): ActivityItem[] {
    const items: ActivityItem[] = [];
    try {
      const stat = fs.statSync(filePath);
      const MAX_READ_BYTES = 512 * 1024; // 최대 512KB만 읽기

      let content: string;
      if (stat.size > MAX_READ_BYTES) {
        // 대용량: 파일 끝 512KB만 읽기
        const fd = fs.openSync(filePath, 'r');
        const buf = Buffer.alloc(MAX_READ_BYTES);
        fs.readSync(fd, buf, 0, MAX_READ_BYTES, stat.size - MAX_READ_BYTES);
        fs.closeSync(fd);
        content = buf.toString('utf-8');
        // 첫 줄은 잘렸을 수 있으므로 제거
        const firstNewline = content.indexOf('\n');
        if (firstNewline > 0) content = content.slice(firstNewline + 1);
        // 이 파일은 이미 부분 읽기 완료로 표시
        this.knownLines.set(filePath, -1);
      } else {
        content = fs.readFileSync(filePath, 'utf-8');
      }

      const lines = content.split('\n').filter(Boolean);
      const startLine = this.knownLines.get(filePath) || 0;
      const actualStart = startLine === -1 ? 0 : startLine;
      if (startLine !== -1) {
        this.knownLines.set(filePath, lines.length);
      }

      for (let i = actualStart; i < lines.length; i++) {
        const item = this.parseLine(lines[i], filePath, i);
        if (item) items.push(item);
      }
    } catch {
      // 파싱 실패 graceful skip
    }
    return items;
  }

  /** 개별 JSONL 라인 파싱 */
  private parseLine(line: string, filePath: string, lineNum: number): ActivityItem | null {
    try {
      const entry: SessionEntry = JSON.parse(line);
      const timestamp = entry.timestamp
        ? new Date(entry.timestamp).getTime()
        : Date.now();
      const id = `${path.basename(filePath)}-${lineNum}`;

      // tool_use (도구 호출) — 두 가지 구조 지원:
      // 1) 레거시: { type: "tool_use", tool_name: "Bash", tool_input: {...} }
      // 2) 실제: { type: "assistant", message: { content: [{ type: "tool_use", name: "Bash", input: {...} }] } }
      let toolName: string | null = null;
      let input: Record<string, unknown> = {};

      if (entry.type === 'tool_use' || entry.tool_name) {
        toolName = entry.tool_name || 'unknown';
        input = entry.tool_input || {};
      } else if (entry.type === 'assistant' && Array.isArray(entry.message?.content)) {
        const toolBlock = (entry.message!.content as Array<Record<string, unknown>>)
          .find((b) => b.type === 'tool_use');
        if (toolBlock) {
          toolName = (toolBlock.name as string) || 'unknown';
          input = (toolBlock.input as Record<string, unknown>) || {};
        }
      }

      if (toolName) {
        // 파일 편집 감지
        if (toolName === 'Edit' || toolName === 'Write') {
          const file = (input.file_path as string) || (input.path as string) || '';
          return {
            id, timestamp,
            type: 'file_edit',
            summary: path.basename(file) + ' 수정',
            detail: file,
          };
        }

        // 커맨드 실행 감지
        if (toolName === 'Bash') {
          const cmd = String(input.command || '').slice(0, 80);
          return {
            id, timestamp,
            type: 'command',
            summary: cmd,
          };
        }

        return null; // 기타 도구는 무시
      }

      // assistant 메시지에서 토큰 사용량 추출
      if (entry.type === 'assistant' && entry.message?.usage) {
        const u = entry.message.usage;
        const input = u.input_tokens || 0;
        const output = u.output_tokens || 0;
        const cacheCreate = u.cache_creation_input_tokens || 0;
        const cacheRead = u.cache_read_input_tokens || 0;
        if (input > 0 || output > 0) {
          this.tokenUsage.inputTokens += input;
          this.tokenUsage.outputTokens += output;
          this.tokenUsage.cacheCreationTokens += cacheCreate;
          this.tokenUsage.cacheReadTokens += cacheRead;
          this.tokenUsage.totalTokens += input + output + cacheCreate;
          this._onTokenUpdate.fire({ ...this.tokenUsage });
          this.saveStats();
        }
      }

      return null;
    } catch {
      return null; // 파싱 실패 graceful skip
    }
  }

  /** 파일 변경 처리 (새 줄만 파싱) */
  private handleFileChange(filePath: string): void {
    const items = this.parseFile(filePath);
    if (items.length > 0) {
      for (const item of items) {
        this.activityStats.total++;
        if (item.type === 'file_edit') this.activityStats.fileEdits++;
        if (item.type === 'command') this.activityStats.commands++;
      }
      this._onActivity.fire(items);
      this.saveStats();
    }
  }

  /** 서브에이전트 meta.json 스캔 */
  private scanSubagents(sessionsDir: string): void {
    try {
      // sessionsDir 하위의 세션 디렉토리들을 탐색
      const entries = fs.readdirSync(sessionsDir, { withFileTypes: true });
      const agents: SubagentInfo[] = [];

      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        const subagentsDir = path.join(sessionsDir, entry.name, 'subagents');
        if (!fs.existsSync(subagentsDir)) continue;

        const subEntries = fs.readdirSync(subagentsDir, { withFileTypes: true });
        for (const sub of subEntries) {
          if (!sub.isFile() || !sub.name.endsWith('.meta.json')) continue;

          const metaPath = path.join(subagentsDir, sub.name);
          const jsonlName = sub.name.replace('.meta.json', '.jsonl');
          const jsonlPath = path.join(subagentsDir, jsonlName);

          try {
            const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
            const agentId = sub.name.replace('.meta.json', '');
            let lineCount = 0;
            let status: 'active' | 'completed' = 'completed';

            let prompt: string | undefined;

            if (fs.existsSync(jsonlPath)) {
              const stat = fs.statSync(jsonlPath);
              // 대략적 줄 수 추정 (평균 줄 길이 ~500바이트)
              lineCount = Math.max(1, Math.round(stat.size / 500));
              // 최근 30초 이내 수정 → active
              if (Date.now() - stat.mtimeMs < 30000) {
                status = 'active';
              }
              // 첫 user 메시지 추출 (프롬프트, 최대 4KB만 읽기)
              try {
                const fd = fs.openSync(jsonlPath, 'r');
                const buf = Buffer.alloc(4096);
                fs.readSync(fd, buf, 0, 4096, 0);
                fs.closeSync(fd);
                const head = buf.toString('utf-8');
                for (const line of head.split('\n')) {
                  if (!line) continue;
                  const entry = JSON.parse(line);
                  if (entry.type === 'user') {
                    const c = entry.message?.content;
                    if (typeof c === 'string') { prompt = c.slice(0, 200); }
                    else if (Array.isArray(c)) {
                      const textBlock = c.find((b: Record<string, unknown>) => b.type === 'text');
                      if (textBlock) prompt = String(textBlock.text || '').slice(0, 200);
                    }
                    break;
                  }
                }
              } catch { /* 프롬프트 추출 실패 무시 */ }
            }

            agents.push({
              id: agentId,
              agentType: meta.agentType || 'unknown',
              description: meta.description || agentId,
              status,
              sessionId: entry.name,
              lineCount,
              prompt,
            });
          } catch {
            // 개별 meta.json 파싱 실패 무시
          }
        }
      }

      if (agents.length > 0) {
        this.subagents = agents;
        this._onSubagentUpdate.fire(agents);
      }
    } catch {
      // 스캔 실패 무시
    }
  }

  dispose(): void {
    if (this.saveTimer) clearTimeout(this.saveTimer);
    for (const w of this.watchers) {
      try { w.close(); } catch { /* ignore */ }
    }
    for (const d of this.disposables) d.dispose();
  }
}
