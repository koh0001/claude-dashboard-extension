/**
 * SessionParserService — Claude Code 세션 JSONL 파일 파싱
 *
 * ~/.claude/projects/{hash}/sessions/*.jsonl 을 파싱하여
 * 도구 호출, 파일 편집, 커맨드 실행 등을 구조화한다.
 */

import * as vscode from 'vscode';
import * as fs from 'node:fs';
import * as path from 'node:path';
import type { ActivityItem, TokenUsage } from '../types/messages.js';

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

export class SessionParserService implements vscode.Disposable {
  private watchers: fs.FSWatcher[] = [];
  private knownLines = new Map<string, number>(); // 파일별 읽은 줄 수
  private disposables: vscode.Disposable[] = [];

  /** 누적 토큰 사용량 */
  private tokenUsage: TokenUsage = {
    inputTokens: 0, outputTokens: 0,
    cacheCreationTokens: 0, cacheReadTokens: 0, totalTokens: 0,
  };

  private readonly _onActivity = new vscode.EventEmitter<ActivityItem[]>();
  readonly onActivity = this._onActivity.event;

  private readonly _onTokenUpdate = new vscode.EventEmitter<TokenUsage>();
  readonly onTokenUpdate = this._onTokenUpdate.event;

  constructor() {
    this.disposables.push(this._onActivity, this._onTokenUpdate);
  }

  /** 현재 누적 토큰 사용량 */
  getTokenUsage(): TokenUsage {
    return { ...this.tokenUsage };
  }

  /** 세션 디렉토리 감시 시작 */
  watchDirectory(sessionsDir: string): void {
    if (!fs.existsSync(sessionsDir)) return;

    // 기존 파일 초기 스캔 (파일만 필터, 디렉토리 제외)
    try {
      const entries = fs.readdirSync(sessionsDir, { withFileTypes: true });
      const files = entries
        .filter((e) => e.isFile() && e.name.endsWith('.jsonl'))
        .map((e) => e.name)
        .sort();
      // 최근 파일만 파싱 (최대 3개)
      const recent = files.slice(-3);
      for (const file of recent) {
        const fullPath = path.join(sessionsDir, file);
        const items = this.parseFile(fullPath);
        if (items.length > 0) {
          this._onActivity.fire(items.slice(-50)); // 최근 50개
        }
      }
    } catch {
      // 디렉토리 읽기 실패 무시
    }

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

      // tool_use (도구 호출)
      if (entry.type === 'tool_use' || entry.tool_name) {
        const toolName = entry.tool_name || 'unknown';
        const input = entry.tool_input || {};

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
      this._onActivity.fire(items);
    }
  }

  dispose(): void {
    for (const w of this.watchers) {
      try { w.close(); } catch { /* ignore */ }
    }
    for (const d of this.disposables) d.dispose();
  }
}
