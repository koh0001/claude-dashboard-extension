/**
 * Claude Flow Monitor — VS Code 확장 진입점
 */

import * as vscode from 'vscode';
import { WatcherService, toSnapshotPayload } from './services/watcher-service.js';
import { I18nService } from './services/i18n-service.js';
import { WorkspaceMatcherService } from './services/workspace-matcher.js';
import { SessionParserService } from './services/session-parser.js';
import { DashboardProvider } from './providers/dashboard-provider.js';
import { TeamTreeProvider } from './providers/tree-provider.js';
import { ActivityFeedProvider } from './providers/activity-feed-provider.js';
import { AiFileDecorationProvider } from './providers/file-decoration-provider.js';
import { SidebarDashboardProvider } from './providers/sidebar-dashboard-provider.js';
import { GitService } from './services/git-service.js';
import { ExportService } from './services/export-service.js';
import { WebhookService } from './services/webhook-service.js';
import { McpService } from './services/mcp-service.js';

/** 출력 채널 */
let outputChannel: vscode.OutputChannel;

/** 상태 바 아이템 */
let statusBarItem: vscode.StatusBarItem;


export function activate(context: vscode.ExtensionContext): void {
  outputChannel = vscode.window.createOutputChannel('Claude Flow Monitor');
  outputChannel.appendLine('[INFO] Claude Flow Monitor 활성화 시작');

  // 1. 서비스 초기화 (설정 → 환경변수 → 기본 ~/.claude 순서로 경로 결정)
  const claudeDir = vscode.workspace.getConfiguration('ccFlowMonitor').get<string>('claudeDir')
    || process.env.CC_TEAM_VIEWER_CLAUDE_DIR
    || undefined;
  outputChannel.appendLine(`[INFO] claudeDir: ${claudeDir || '~/.claude (기본)'}`);
  const watcherService = new WatcherService(claudeDir ? { claudeDir } : undefined);
  const i18nService = new I18nService();
  const workspaceMatcher = new WorkspaceMatcherService(claudeDir);
  const sessionParser = new SessionParserService();
  const gitService = new GitService();
  const activityFeed = new ActivityFeedProvider(watcherService, sessionParser);
  const exportService = new ExportService();
  const webhookService = new WebhookService();
  const mcpService = new McpService();

  // AI 파일 뱃지 프로바이더
  const fileDecoProvider = new AiFileDecorationProvider(sessionParser, gitService);

  // VS Code API 등록만 context.subscriptions에 (필수)
  const fileDecoReg = vscode.window.registerFileDecorationProvider(fileDecoProvider);
  context.subscriptions.push(fileDecoReg, outputChannel);

  // 2. 대시보드 프로바이더 (에디터 탭 WebviewPanel)
  const dashboardProvider = new DashboardProvider(
    context.extensionUri, watcherService, i18nService, sessionParser,
  );

  const treeProvider = new TeamTreeProvider(watcherService, i18nService, sessionParser);
  const sidebarDashboard = new SidebarDashboardProvider(watcherService, i18nService, activityFeed);
  const treeReg = vscode.window.registerTreeDataProvider('claudeFlowMonitor.teamTree', treeProvider);
  const sidebarReg = vscode.window.registerWebviewViewProvider(SidebarDashboardProvider.viewType, sidebarDashboard);
  context.subscriptions.push(treeReg, sidebarReg);

  // 서비스는 프로세스 종료 시 자동 해제 (context.subscriptions 불필요)

  // 3. 상태 바 + 미니 대시보드 (Markdown tooltip)
  statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 50);
  statusBarItem.command = 'claudeFlowMonitor.openDashboard';
  statusBarItem.text = '$(pulse) CFM';
  statusBarItem.tooltip = new vscode.MarkdownString(
    `**Claude Flow Monitor**\n\n$(info) ${i18nService.t('statusBar.noTeams')}\n\n[${i18nService.t('mini.openDashboard')}](command:claudeFlowMonitor.openDashboard)`,
    true,
  );
  (statusBarItem.tooltip as vscode.MarkdownString).isTrusted = true;
  statusBarItem.show();
  context.subscriptions.push(statusBarItem);

  // 미니 대시보드 상태 추적
  const miniEditedFiles = new Set<string>();
  let miniStats = { sessions: 1, files: 0, tasks: 0, totalTasks: 0, rate: 0, lastActivity: '' };

  // 상태 바 업데이트 (미니 대시보드 tooltip 포함)
  watcherService.onUpdate(({ snapshot }) => {
    const stats = snapshot.stats;
    const rate = stats.completionRate;
    miniStats.tasks = stats.completedTasks;
    miniStats.totalTasks = stats.totalTasks;
    miniStats.rate = rate;
    statusBarItem.text = `$(pulse) CFM: ${rate}%`;

    const md = new vscode.MarkdownString('', true);
    md.isTrusted = true;
    md.appendMarkdown(`**Claude Flow Monitor**\n\n`);
    md.appendMarkdown(`$(pulse) ${i18nService.t('mini.activeSessions')}: **${miniStats.sessions || 1}**\n\n`);
    md.appendMarkdown(`$(file) ${i18nService.t('mini.modifiedFiles')}: **${miniStats.files}**\n\n`);
    md.appendMarkdown(`$(checklist) ${i18nService.t('mini.tasks')}: **${miniStats.tasks}/${miniStats.totalTasks} (${rate}%)**\n\n`);
    if (miniStats.lastActivity) {
      md.appendMarkdown(`$(history) ${i18nService.t('mini.lastActivity')}: **${miniStats.lastActivity}**\n\n`);
    }
    md.appendMarkdown(`---\n\n[$(link-external) ${i18nService.t('mini.openDashboard')}](command:claudeFlowMonitor.openDashboard)`);
    statusBarItem.tooltip = md;
  });

  // 세션 활동으로 미니 대시보드 파일/시간 업데이트
  sessionParser.onActivity((items) => {
    if (items.length > 0) {
      const latest = items[items.length - 1];
      const ago = Math.round((Date.now() - latest.timestamp) / 60000);
      miniStats.lastActivity = ago <= 0 ? i18nService.t('mini.justNow') : `${ago}${i18nService.t('duration.minutes')}`;
      // 고유 파일 수 추적
      items.forEach((item) => {
        if (item.type === 'file_edit' && item.detail) {
          miniEditedFiles.add(item.detail);
        }
      });
      miniStats.files = miniEditedFiles.size;
    }
  });

  // 4. 커맨드 등록
  context.subscriptions.push(
    vscode.commands.registerCommand('claudeFlowMonitor.openDashboard', () => {
      dashboardProvider.show();
    }),

    vscode.commands.registerCommand('claudeFlowMonitor.refresh', async () => {
      await treeProvider.refresh();
      outputChannel.appendLine('[INFO] 데이터 새로고침 완료');
    }),

    vscode.commands.registerCommand('claudeFlowMonitor.selectTeam', async () => {
      const teams = await watcherService.getActiveTeams();
      if (teams.length === 0) {
        vscode.window.showInformationMessage(i18nService.t('statusBar.noTeams'));
        return;
      }
      const selected = await vscode.window.showQuickPick(teams, {
        placeHolder: i18nService.t('ext.title'),
      });
      if (selected) {
        outputChannel.appendLine(`[INFO] 팀 선택: ${selected}`);
      }
    }),

    vscode.commands.registerCommand('claudeFlowMonitor.changeLanguage', () => {
      i18nService.showLocalePicker();
    }),

    // Phase 3: Export 커맨드
    vscode.commands.registerCommand('claudeFlowMonitor.exportCsv', async () => {
      const items = activityFeed.getItems();
      if (items.length === 0) {
        vscode.window.showInformationMessage(i18nService.t('summary.noData'));
        return;
      }
      await exportService.exportCsv(items);
      vscode.window.showInformationMessage(i18nService.t('export.success'));
    }),

    vscode.commands.registerCommand('claudeFlowMonitor.exportReport', async () => {
      const snapshots = await watcherService.getAllSnapshots();
      let snapshot = null;
      for (const [name, snap] of snapshots) {
        snapshot = toSnapshotPayload(name, snap);
        break;
      }
      await exportService.showReport(snapshot, activityFeed.getItems());
    }),

    // Phase 3: MCP 서버 토글 커맨드
    vscode.commands.registerCommand('claudeFlowMonitor.toggleMcpServer', async () => {
      if (mcpService.isRunning()) {
        mcpService.stopServer();
        vscode.window.showInformationMessage(i18nService.t('mcp.serverStopped'));
      } else {
        const port = vscode.workspace.getConfiguration('ccFlowMonitor').get<number>('mcpServerPort', 0);
        const actualPort = await mcpService.startServer(port);
        vscode.window.showInformationMessage(i18nService.t('mcp.serverRunning', { port: actualPort }));
      }
    }),
  );

  // 5. 알림 처리
  const notificationsEnabled = () =>
    vscode.workspace.getConfiguration('ccFlowMonitor').get<boolean>('notifications', true);

  watcherService.onNotification((notif) => {
    if (!notificationsEnabled()) return;
    const msg = i18nService.t(`notification.${notif.type}`, {
      task: notif.message,
      agent: notif.message,
      team: notif.teamName,
    });
    vscode.window.showInformationMessage(`Claude Flow Monitor: ${msg}`);

    // Webhook 알림 전달
    if (notif.type === 'taskCompleted') {
      webhookService.sendTaskCompleted(notif.teamName, notif.message).catch(() => {});
    } else if (notif.type === 'agentJoined') {
      webhookService.sendAgentJoined(notif.teamName, notif.message).catch(() => {});
    }
  });

  // 6. 워크스페이스 매칭 → 세션 감시 시작
  workspaceMatcher.refreshMatch().then((match) => {
    if (match) {
      outputChannel.appendLine(`[INFO] 워크스페이스 매칭 성공: ${match.claudeProjectDir}`);
      outputChannel.appendLine(`[INFO] 세션 디렉토리: ${match.sessionsDir}`);
      // 활동/토큰 수신 로깅 (watchDirectory 전에 등록해야 초기 이벤트 수신)
      sessionParser.onActivity((items) => {
        outputChannel.appendLine(`[INFO] 활동 수신: ${items.length}개`);
      });
      sessionParser.onTokenUpdate((usage) => {
        outputChannel.appendLine(`[INFO] 토큰 수신: input=${usage.inputTokens} output=${usage.outputTokens} total=${usage.totalTokens}`);
      });
      try {
        sessionParser.watchDirectory(match.sessionsDir);
        outputChannel.appendLine(`[INFO] 세션 파서 시작 완료 — 현재 활동: ${activityFeed.getItems().length}개`);
      } catch (err) {
        outputChannel.appendLine(`[ERROR] 세션 파서 시작 실패: ${err}`);
      }
    } else {
      outputChannel.appendLine('[INFO] 워크스페이스 매칭 실패 — 세션 감시 미시작');
    }
    // Git 스캔 (워크스페이스 매칭 결과와 무관하게 실행)
    gitService.scanWorkspace();
  });

  workspaceMatcher.onMatchChanged((match) => {
    if (match) {
      sessionParser.watchDirectory(match.sessionsDir);
    }
  });

  // 7. 감시 시작
  watcherService.start().then(() => {
    outputChannel.appendLine('[INFO] TeamWatcher 시작 완료');
    treeProvider.refresh();
  }).catch((err) => {
    outputChannel.appendLine(`[ERROR] TeamWatcher 시작 실패: ${err}`);
  });

  outputChannel.appendLine('[INFO] Claude Flow Monitor 활성화 완료');
}

export function deactivate(): void {
  // 즉시 반환 — 모든 리소스는 프로세스 종료 시 자동 해제됨
  // (fs.watch, HTTP 서버, 타이머, 자식 프로세스 등)
  // 수동 dispose가 오히려 VS Code의 확장 호스트 중지를 지연시킴
}
