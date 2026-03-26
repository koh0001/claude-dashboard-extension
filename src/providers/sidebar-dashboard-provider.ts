/**
 * SidebarDashboardProvider — 사이드바 미니 대시보드 WebviewView
 *
 * 핵심 메트릭, 최근 활동, 빠른 액션을 사이드바에 표시한다.
 * HTML 전체 교체 대신 postMessage로 부분 업데이트하여 깜빡임 방지.
 */

import * as vscode from 'vscode';
import * as crypto from 'node:crypto';
import { WatcherService } from '../services/watcher-service.js';
import { I18nService } from '../services/i18n-service.js';
import { ActivityFeedProvider } from './activity-feed-provider.js';
import type { ActivityItem } from '../types/messages.js';

export class SidebarDashboardProvider implements vscode.WebviewViewProvider, vscode.Disposable {
  public static readonly viewType = 'claudeFlowMonitor.miniDashboard';
  private view?: vscode.WebviewView;
  private disposables: vscode.Disposable[] = [];
  private isReady = false;

  /** 미니 대시보드 상태 */
  private stats = {
    sessions: 1,
    files: 0,
    tasks: 0,
    totalTasks: 0,
    rate: 0,
    activeAgents: 0,
    totalAgents: 0,
    messages: 0,
  };
  private recentActivities: ActivityItem[] = [];
  private editedFiles = new Set<string>();

  /** 업데이트 debounce 타이머 */
  private updateTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly watcherService: WatcherService,
    private readonly i18nService: I18nService,
    private readonly activityFeed: ActivityFeedProvider,
  ) {
    // 스냅샷 업데이트 구독
    this.disposables.push(
      watcherService.onUpdate(({ snapshot }) => {
        this.stats.tasks = snapshot.stats.completedTasks;
        this.stats.totalTasks = snapshot.stats.totalTasks;
        this.stats.rate = snapshot.stats.completionRate;
        this.stats.activeAgents = snapshot.stats.activeAgents;
        this.stats.totalAgents = snapshot.stats.totalAgents;
        this.stats.messages = snapshot.stats.totalMessages;
        this.scheduleUpdate();
      }),
    );

    // 활동 피드 구독
    this.disposables.push(
      activityFeed.onDidUpdate((items) => {
        for (const item of items) {
          if (item.type === 'file_edit' && item.detail) {
            this.editedFiles.add(item.detail);
          }
        }
        this.stats.files = this.editedFiles.size;
        this.recentActivities = activityFeed.getRecent(5);
        this.scheduleUpdate();
      }),
    );
  }

  resolveWebviewView(view: vscode.WebviewView): void {
    this.view = view;
    this.isReady = false;
    view.webview.options = { enableScripts: true, localResourceRoots: [] };

    const nonce = crypto.randomBytes(16).toString('hex');
    view.webview.html = this.getHtml(nonce);

    view.webview.onDidReceiveMessage((msg) => {
      switch (msg.type) {
        case 'ready':
          this.isReady = true;
          this.sendUpdate();
          break;
        case 'openDashboard':
          vscode.commands.executeCommand('claudeFlowMonitor.openDashboard');
          break;
        case 'exportReport':
          vscode.commands.executeCommand('claudeFlowMonitor.exportReport');
          break;
        case 'exportCsv':
          vscode.commands.executeCommand('claudeFlowMonitor.exportCsv');
          break;
      }
    }, undefined, this.disposables);

    view.onDidDispose(() => {
      this.view = undefined;
      this.isReady = false;
    }, undefined, this.disposables);
  }

  /** debounce로 빈번한 업데이트 병합 (200ms) */
  private scheduleUpdate(): void {
    if (this.updateTimer) clearTimeout(this.updateTimer);
    this.updateTimer = setTimeout(() => {
      this.updateTimer = null;
      this.sendUpdate();
    }, 200);
  }

  /** postMessage로 데이터만 전송 (HTML 교체 없음) */
  private sendUpdate(): void {
    if (!this.view || !this.isReady) return;

    const icons: Record<string, string> = {
      file_edit: '\u{1F4DD}', command: '\u26A1', task_change: '\u2705',
      message: '\u{1F4AC}', error: '\u274C',
    };

    const activities = this.recentActivities.map((item) => {
      const time = new Date(item.timestamp);
      return {
        time: String(time.getHours()).padStart(2, '0') + ':' + String(time.getMinutes()).padStart(2, '0'),
        icon: icons[item.type] || '\u2022',
        summary: item.summary.slice(0, 50),
      };
    });

    this.view.webview.postMessage({
      type: 'update',
      stats: { ...this.stats },
      activities,
    });
  }

  private getHtml(nonce: string): string {
    return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'nonce-${nonce}'; script-src 'nonce-${nonce}';">
<style nonce="${nonce}">
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:var(--vscode-font-family);font-size:12px;color:var(--vscode-foreground);background:var(--vscode-sideBar-background);padding:8px}
.section{margin-bottom:12px}
.section-title{font-size:11px;color:var(--vscode-descriptionForeground);text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px;font-weight:500}
.metrics{display:grid;grid-template-columns:1fr 1fr;gap:6px}
.metric{padding:8px;background:var(--vscode-editorWidget-background);border-radius:4px;text-align:center;border:1px solid var(--vscode-panel-border,transparent)}
.metric-value{font-size:18px;font-weight:700;line-height:1.2;transition:color .3s}
.metric-label{font-size:10px;color:var(--vscode-descriptionForeground);margin-top:2px}
.blue{color:#2196f3}.green{color:#4caf50}.orange{color:#ff9800}.gray{color:var(--vscode-foreground)}
.progress-wrap{margin-top:8px}
.progress-bar{height:6px;background:var(--vscode-editorWidget-background);border-radius:3px;overflow:hidden}
.progress-fill{height:100%;background:#4caf50;border-radius:3px;transition:width .3s}
.progress-label{display:flex;justify-content:space-between;font-size:10px;color:var(--vscode-descriptionForeground);margin-top:3px}
.activity-list{min-height:20px}
.activity-row{display:flex;align-items:center;gap:6px;padding:3px 0;font-size:11px}
.act-time{color:var(--vscode-descriptionForeground);min-width:36px;font-family:var(--vscode-editor-font-family)}
.act-text{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1}
.actions{display:flex;flex-direction:column;gap:4px}
.btn{padding:6px 10px;border:none;border-radius:4px;cursor:pointer;font-size:11px;font-family:var(--vscode-font-family);text-align:center}
.btn-primary{background:var(--vscode-button-background);color:var(--vscode-button-foreground)}
.btn-primary:hover{background:var(--vscode-button-hoverBackground)}
.btn-secondary{background:var(--vscode-button-secondaryBackground);color:var(--vscode-button-secondaryForeground)}
.btn-secondary:hover{opacity:.9}
.empty{color:var(--vscode-disabledForeground);font-size:11px;text-align:center;padding:8px}
</style>
</head>
<body>
  <div class="section">
    <div class="section-title">Overview</div>
    <div class="metrics">
      <div class="metric"><div class="metric-value blue" id="v-files">0</div><div class="metric-label">Files</div></div>
      <div class="metric"><div class="metric-value orange" id="v-messages">0</div><div class="metric-label">Messages</div></div>
      <div class="metric"><div class="metric-value green" id="v-tasks">0</div><div class="metric-label">Done</div></div>
      <div class="metric"><div class="metric-value gray" id="v-agents">0</div><div class="metric-label">Agents</div></div>
    </div>
    <div class="progress-wrap">
      <div class="progress-bar"><div class="progress-fill" id="v-progress" style="width:0%"></div></div>
      <div class="progress-label"><span id="v-task-label">Tasks 0/0</span><span id="v-rate">0%</span></div>
    </div>
  </div>
  <div class="section">
    <div class="section-title">Recent Activity</div>
    <div class="activity-list" id="v-activities"><div class="empty">활동 대기 중...</div></div>
  </div>
  <div class="section">
    <div class="actions">
      <button class="btn btn-primary" id="btn-dashboard">&#x1F4CA; Open Dashboard</button>
      <button class="btn btn-secondary" id="btn-export">&#x1F4C4; Export Report</button>
    </div>
  </div>
  <script nonce="${nonce}">
  (function(){
    var vscode = acquireVsCodeApi();
    document.getElementById('btn-dashboard').addEventListener('click', function(){
      vscode.postMessage({type:'openDashboard'});
    });
    document.getElementById('btn-export').addEventListener('click', function(){
      vscode.postMessage({type:'exportReport'});
    });

    function esc(t){ return t ? t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') : ''; }

    window.addEventListener('message', function(e){
      var msg = e.data;
      if (msg.type !== 'update') return;
      var s = msg.stats;

      document.getElementById('v-files').textContent = s.files;
      document.getElementById('v-messages').textContent = s.messages;
      document.getElementById('v-tasks').textContent = s.tasks;
      document.getElementById('v-agents').textContent = s.totalAgents;
      document.getElementById('v-progress').style.width = s.rate + '%';
      document.getElementById('v-task-label').textContent = 'Tasks ' + s.tasks + '/' + s.totalTasks;
      document.getElementById('v-rate').textContent = s.rate + '%';

      var list = document.getElementById('v-activities');
      list.textContent = '';
      if (msg.activities.length === 0) {
        var empty = document.createElement('div');
        empty.className = 'empty';
        empty.textContent = '활동 대기 중...';
        list.appendChild(empty);
      } else {
        msg.activities.forEach(function(a) {
          var row = document.createElement('div');
          row.className = 'activity-row';
          var time = document.createElement('span');
          time.className = 'act-time';
          time.textContent = a.time;
          var icon = document.createElement('span');
          icon.textContent = a.icon;
          var text = document.createElement('span');
          text.className = 'act-text';
          text.textContent = a.summary;
          row.appendChild(time);
          row.appendChild(icon);
          row.appendChild(text);
          list.appendChild(row);
        });
      }
    });

    vscode.postMessage({type:'ready'});
  })();
  </script>
</body>
</html>`;
  }

  dispose(): void {
    if (this.updateTimer) clearTimeout(this.updateTimer);
    for (const d of this.disposables) d.dispose();
  }
}
