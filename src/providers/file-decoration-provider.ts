/**
 * AiFileDecorationProvider — AI가 수정한 파일에 뱃지를 표시
 *
 * SessionParser의 file_edit 활동과 GitService의 Co-Authored-By 커밋에서
 * AI 수정 파일을 추적하여 Explorer에 "AI" 뱃지를 표시한다.
 */

import * as vscode from 'vscode';
import type { SessionParserService } from '../services/session-parser.js';
import type { GitService } from '../services/git-service.js';

export class AiFileDecorationProvider implements vscode.FileDecorationProvider, vscode.Disposable {
  private disposables: vscode.Disposable[] = [];

  /** AI 수정 파일 → 편집 횟수 */
  private editCounts = new Map<string, number>();

  private readonly _onDidChangeFileDecorations = new vscode.EventEmitter<vscode.Uri | vscode.Uri[] | undefined>();
  readonly onDidChangeFileDecorations = this._onDidChangeFileDecorations.event;

  constructor(
    sessionParser: SessionParserService,
    gitService?: GitService,
  ) {
    this.disposables.push(this._onDidChangeFileDecorations);

    // 세션 파서 활동에서 file_edit 추적
    this.disposables.push(
      sessionParser.onActivity((items) => {
        const changedUris: vscode.Uri[] = [];
        for (const item of items) {
          if (item.type === 'file_edit' && item.detail) {
            const count = (this.editCounts.get(item.detail) || 0) + 1;
            this.editCounts.set(item.detail, count);
            changedUris.push(vscode.Uri.file(item.detail));
          }
        }
        if (changedUris.length > 0) {
          this._onDidChangeFileDecorations.fire(changedUris);
        }
      }),
    );

    // Git 서비스에서 AI 커밋 파일 추적
    if (gitService) {
      this.disposables.push(
        gitService.onCommits((commits) => {
          const changedUris: vscode.Uri[] = [];
          for (const commit of commits) {
            for (const file of commit.files) {
              const count = (this.editCounts.get(file) || 0) + 1;
              this.editCounts.set(file, count);
              changedUris.push(vscode.Uri.file(file));
            }
          }
          if (changedUris.length > 0) {
            this._onDidChangeFileDecorations.fire(changedUris);
          }
        }),
      );
    }
  }

  /** FileDecorationProvider 구현 */
  provideFileDecoration(uri: vscode.Uri): vscode.FileDecoration | undefined {
    const filePath = uri.fsPath;
    const count = this.editCounts.get(filePath);
    if (!count) return undefined;

    return {
      badge: 'AI',
      tooltip: `Claude Code에서 수정됨 (${count}회)`,
      color: new vscode.ThemeColor('charts.green'),
    };
  }

  /** 파일별 편집 횟수 맵 반환 (히트맵 데이터) */
  getHeatmapData(): Map<string, number> {
    return new Map(this.editCounts);
  }

  dispose(): void {
    for (const d of this.disposables) d.dispose();
  }
}
