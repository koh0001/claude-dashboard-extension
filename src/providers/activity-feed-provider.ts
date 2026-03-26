/**
 * ActivityFeedProvider — Activity Feed 데이터 관리
 * 파일 편집, 커맨드 실행, 태스크 변경, 메시지를 통합 피드로 제공
 */

import * as vscode from 'vscode';
import type { ActivityItem } from '../types/messages.js';
import { WatcherService } from '../services/watcher-service.js';
import { SessionParserService } from '../services/session-parser.js';

/** 최대 활동 항목 수 */
const MAX_ITEMS = 200;

export class ActivityFeedProvider implements vscode.Disposable {
  private items: ActivityItem[] = [];
  private disposables: vscode.Disposable[] = [];
  private idCounter = 0;

  private readonly _onDidUpdate = new vscode.EventEmitter<ActivityItem[]>();
  readonly onDidUpdate = this._onDidUpdate.event;

  constructor(
    watcherService: WatcherService,
    sessionParser: SessionParserService,
  ) {
    // 세션 파서 활동 수집
    this.disposables.push(
      sessionParser.onActivity((newItems) => {
        this.addItems(newItems);
      }),
    );

    // 태스크 완료 알림을 활동으로 변환
    this.disposables.push(
      watcherService.onNotification((notif) => {
        this.addItems([{
          id: `notif-${++this.idCounter}`,
          timestamp: Date.now(),
          type: notif.type === 'taskCompleted' ? 'task_change' : 'message',
          summary: notif.message,
          source: notif.teamName,
        }]);
      }),
    );

    this.disposables.push(this._onDidUpdate);
  }

  /** 활동 항목 추가 */
  private addItems(newItems: ActivityItem[]): void {
    this.items = this.items.concat(newItems).slice(-MAX_ITEMS);
    this._onDidUpdate.fire(newItems);
  }

  /** 전체 활동 목록 */
  getItems(): ActivityItem[] {
    return this.items;
  }

  /** 최근 N개 활동 */
  getRecent(count: number): ActivityItem[] {
    return this.items.slice(-count);
  }

  dispose(): void {
    for (const d of this.disposables) d.dispose();
  }
}
