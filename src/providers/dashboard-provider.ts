/**
 * DashboardProvider — 에디터 탭 WebviewPanel 관리
 * "Open Dashboard" 커맨드로 에디터 영역에 전체 크기 패널을 연다.
 * 화면 분할(Split Editor)로 Claude Code 확장과 나란히 사용 가능.
 */

import * as vscode from 'vscode';
import * as crypto from 'node:crypto';
import { getDashboardHtml } from '../views/dashboard-html.js';
import { WatcherService, toSnapshotPayload } from '../services/watcher-service.js';
import { I18nService } from '../services/i18n-service.js';
import { SessionParserService } from '../services/session-parser.js';
import { detectThemeMode, themeToVscodeKind } from '../utils/theme-detector.js';
import type { ExtToWebMessage, WebToExtMessage, SnapshotPayload } from '../types/messages.js';

export class DashboardProvider implements vscode.Disposable {
  private panel?: vscode.WebviewPanel;
  private messageQueue: ExtToWebMessage[] = [];
  private isReady = false;
  private disposables: vscode.Disposable[] = [];

  constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly watcherService: WatcherService,
    private readonly i18nService: I18nService,
    private readonly sessionParser: SessionParserService,
  ) {
    // 스냅샷 업데이트 구독
    this.disposables.push(
      watcherService.onUpdate(({ teamName, snapshot }) => {
        const payload = toSnapshotPayload(teamName, snapshot);
        this.postMessage({ type: 'snapshotUpdate', teamName, data: payload });
      }),
    );

    // 언어 변경 구독
    this.disposables.push(
      i18nService.onLocaleChanged(() => {
        this.postMessage({
          type: 'translationsUpdate',
          translations: i18nService.getWebViewTranslations(),
          locale: i18nService.locale,
        });
      }),
    );

    // 세션 활동 구독
    this.disposables.push(
      sessionParser.onActivity((items) => {
        this.postMessage({ type: 'activityUpdate', items });
      }),
    );

    // 테마 변경 구독
    this.disposables.push(
      vscode.window.onDidChangeActiveColorTheme(() => {
        this.postMessage({
          type: 'themeChanged',
          themeKind: themeToVscodeKind(detectThemeMode()),
        });
      }),
    );
  }

  /** 대시보드 패널 열기 (이미 열려있으면 포커스) */
  show(viewColumn?: vscode.ViewColumn): void {
    if (this.panel) {
      this.panel.reveal(viewColumn || vscode.ViewColumn.Beside);
      return;
    }

    this.panel = vscode.window.createWebviewPanel(
      'claudeFlowMonitor.dashboard',
      'Claude Flow Monitor',
      viewColumn || vscode.ViewColumn.Beside,
      {
        enableScripts: true,
        localResourceRoots: [],
        retainContextWhenHidden: true,
      },
    );

    this.panel.iconPath = vscode.Uri.joinPath(this.extensionUri, 'images', 'sidebar-icon.svg');
    this.isReady = false;

    const nonce = crypto.randomBytes(16).toString('hex');
    this.panel.webview.html = getDashboardHtml(nonce);

    // WebView → Extension 메시지 수신
    this.panel.webview.onDidReceiveMessage(
      (msg: WebToExtMessage) => this.handleWebViewMessage(msg),
      undefined,
      this.disposables,
    );

    // 패널 닫힘 처리
    this.panel.onDidDispose(() => {
      this.panel = undefined;
      this.isReady = false;
    }, undefined, this.disposables);
  }

  /** 메시지 큐 상한 (메모리 누수 방지) */
  private static readonly MAX_QUEUE = 100;

  /** WebView에 메시지 전송 (큐 지원, 상한 100개) */
  private postMessage(msg: ExtToWebMessage): void {
    if (!this.isReady || !this.panel) {
      this.messageQueue.push(msg);
      if (this.messageQueue.length > DashboardProvider.MAX_QUEUE) {
        this.messageQueue.shift();
      }
      return;
    }
    this.panel.webview.postMessage(msg);
  }

  /** 큐에 쌓인 메시지 전송 */
  private flushQueue(): void {
    if (!this.panel) return;
    while (this.messageQueue.length > 0) {
      const msg = this.messageQueue.shift()!;
      this.panel.webview.postMessage(msg);
    }
  }

  /** WebView 메시지 핸들러 */
  private async handleWebViewMessage(msg: WebToExtMessage): Promise<void> {
    switch (msg.type) {
      case 'ready':
        this.isReady = true;
        await this.sendInit();
        this.flushQueue();
        break;

      case 'changeLanguage':
        this.i18nService.cycleLocale();
        break;

      case 'refresh':
        await this.sendInit();
        break;

      case 'selectTeam': {
        // 팀 이름 검증 (경로 순회 방지)
        const teamName = msg.teamName;
        if (typeof teamName !== 'string' || teamName.length === 0 || teamName.length > 100) break;
        if (/[/\\.\x00]/.test(teamName)) break;
        const snapshot = await this.watcherService.getTeamSnapshot(teamName);
        if (snapshot) {
          const payload = toSnapshotPayload(teamName, snapshot);
          this.postMessage({ type: 'snapshotUpdate', teamName, data: payload });
        }
        break;
      }
    }
  }

  /** 초기 데이터 전송 */
  private async sendInit(): Promise<void> {
    const snapshots = await this.watcherService.getAllSnapshots();
    const teams: Record<string, SnapshotPayload> = {};
    let currentTeam: string | null = null;

    for (const [name, snap] of snapshots) {
      teams[name] = toSnapshotPayload(name, snap);
      if (!currentTeam) currentTeam = name;
    }

    this.postMessage({
      type: 'init',
      data: { teams, currentTeam },
      translations: this.i18nService.getWebViewTranslations(),
      locale: this.i18nService.locale,
    });
  }

  dispose(): void {
    this.panel?.dispose();
    for (const d of this.disposables) d.dispose();
  }
}
