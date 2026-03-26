/**
 * WorkspaceMatcherService — 워크스페이스 ↔ ~/.claude/projects/ 해시 매칭
 *
 * Claude Code는 프로젝트 경로를 해시하여 ~/.claude/projects/{hash}/ 에 저장한다.
 * 이 서비스는 현재 VS Code 워크스페이스의 절대 경로로 해당 해시 디렉토리를 찾는다.
 */

import * as vscode from 'vscode';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as crypto from 'node:crypto';

export interface ProjectMatch {
  /** VS Code 워크스페이스 경로 */
  workspacePath: string;
  /** ~/.claude/projects/{hash} 절대 경로 */
  claudeProjectDir: string;
  /** sessions/ 하위 경로 */
  sessionsDir: string;
}

export class WorkspaceMatcherService implements vscode.Disposable {
  private claudeDir: string;
  private match: ProjectMatch | null = null;
  private disposables: vscode.Disposable[] = [];

  private readonly _onMatchChanged = new vscode.EventEmitter<ProjectMatch | null>();
  readonly onMatchChanged = this._onMatchChanged.event;

  constructor(claudeDir?: string) {
    this.claudeDir = claudeDir
      || process.env.CC_TEAM_VIEWER_CLAUDE_DIR
      || path.join(process.env.HOME || process.env.USERPROFILE || '', '.claude');

    this.disposables.push(this._onMatchChanged);

    // 워크스페이스 변경 감시
    const wsWatcher = vscode.workspace.onDidChangeWorkspaceFolders(() => {
      this.refreshMatch();
    });
    this.disposables.push(wsWatcher);
  }

  /** 현재 매칭 결과 */
  getMatch(): ProjectMatch | null {
    return this.match;
  }

  /** Claude 디렉토리 경로 */
  getClaudeDir(): string {
    return this.claudeDir;
  }

  /** 매칭 초기화/갱신 */
  async refreshMatch(): Promise<ProjectMatch | null> {
    const folders = vscode.workspace.workspaceFolders;
    if (!folders || folders.length === 0) {
      this.match = null;
      this._onMatchChanged.fire(null);
      return null;
    }

    const workspacePath = folders[0].uri.fsPath;
    const projectsDir = path.join(this.claudeDir, 'projects');

    if (!fs.existsSync(projectsDir)) {
      this.match = null;
      this._onMatchChanged.fire(null);
      return null;
    }

    // 방법 1: 해시 기반 직접 매칭
    const hash = this.hashPath(workspacePath);
    const directMatch = path.join(projectsDir, hash);
    if (fs.existsSync(directMatch)) {
      this.match = this.buildMatch(workspacePath, directMatch);
      this._onMatchChanged.fire(this.match);
      return this.match;
    }

    // 방법 2: 디렉토리 순회하며 매칭 시도 (해시 알고리즘 변경 대비)
    try {
      const entries = fs.readdirSync(projectsDir, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        const candidateDir = path.join(projectsDir, entry.name);
        // .project 파일에 원본 경로가 저장되어 있을 수 있음
        const projectFile = path.join(candidateDir, '.project');
        if (fs.existsSync(projectFile)) {
          try {
            const content = fs.readFileSync(projectFile, 'utf-8').trim();
            if (content === workspacePath || content === workspacePath + '/') {
              this.match = this.buildMatch(workspacePath, candidateDir);
              this._onMatchChanged.fire(this.match);
              return this.match;
            }
          } catch {
            // skip
          }
        }
      }
    } catch {
      // projectsDir 읽기 실패
    }

    this.match = null;
    this._onMatchChanged.fire(null);
    return null;
  }

  /** 경로 해시 (Claude Code 방식) */
  private hashPath(absPath: string): string {
    // Claude Code는 절대 경로를 직접 해시하여 디렉토리명으로 사용
    return crypto.createHash('sha256').update(absPath).digest('hex').slice(0, 16);
  }

  /** ProjectMatch 객체 생성 */
  private buildMatch(workspacePath: string, claudeProjectDir: string): ProjectMatch {
    return {
      workspacePath,
      claudeProjectDir,
      sessionsDir: path.join(claudeProjectDir, 'sessions'),
    };
  }

  dispose(): void {
    for (const d of this.disposables) d.dispose();
  }
}
