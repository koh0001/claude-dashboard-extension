/**
 * 확장 번역 키 타입 정의
 * core TranslationMap을 확장하여 Claude Flow Monitor 전용 키를 추가
 */

import type { TranslationMap } from '../core/index.js';

export type Locale = 'ko' | 'en' | 'ja' | 'zh';

export const LOCALE_ORDER: Locale[] = ['ko', 'en', 'ja', 'zh'];

export const LOCALE_LABELS: Record<Locale, string> = {
  ko: '한국어',
  en: 'English',
  ja: '日本語',
  zh: '中文',
};

/**
 * 확장 번역 맵
 * core TranslationMap + Claude Flow Monitor 전용 키
 */
export type ExtendedTranslationMap = TranslationMap & {
  // 확장 제목
  'ext.title': string;
  'ext.description': string;

  // 상태 (core에 없는 것)
  'status.blocked': string;

  // 상태 바
  'statusBar.noTeams': string;
  'statusBar.completion': string;

  // 태스크 확장
  'task.headerAssignee': string;
  'task.viewKanban': string;
  'task.viewTable': string;

  // 메시지 필터
  'message.filterAll': string;
  'message.filterConversation': string;
  'message.filterSystem': string;

  // 의존성 확장
  'deps.noTasks': string;

  // 알림
  'notification.taskCompleted': string;
  'notification.agentJoined': string;
  'notification.agentLeft': string;

  // Activity Feed
  'activity.title': string;
  'activity.fileEdit': string;
  'activity.command': string;
  'activity.taskChange': string;
  'activity.message': string;
  'activity.error': string;
  'activity.noActivity': string;
  'activity.noActivityHint': string;

  // 세션
  'session.active': string;
  'session.ended': string;
  'session.filesModified': string;
  'session.commandsRun': string;

  // 검색
  'search.placeholder': string;
  'search.noResults': string;

  // 설정
  'settings.theme': string;
  'settings.language': string;
  'settings.notifications': string;
  'settings.notifOn': string;
  'settings.notifOff': string;

  // 접근성
  'a11y.skipToContent': string;
  'a11y.expandAgent': string;
  'a11y.collapseAgent': string;
  'a11y.expandTask': string;
  'a11y.collapseTask': string;
  'a11y.progressBar': string;

  // 에러
  'error.dirNotFound': string;
  'error.parseError': string;
  'error.connectionLost': string;
  'error.retrying': string;
  'error.retry': string;

  // 빈 상태
  'empty.noTeams': string;
  'empty.noTeamsHint': string;
  'empty.noTasks': string;
  'empty.noMessages': string;
  'empty.noMessagesHint': string;
  'empty.noDeps': string;
  'empty.noDepsHint': string;

  // 미니 대시보드
  'mini.activeSessions': string;
  'mini.modifiedFiles': string;
  'mini.tasks': string;
  'mini.lastActivity': string;
  'mini.openDashboard': string;
  'mini.justNow': string;

  // 타임라인
  'timeline.title': string;
  'timeline.noEvents': string;
  'timeline.noEventsHint': string;
  'timeline.today': string;
  'timeline.earlier': string;

  // 성능 메트릭
  'metrics.title': string;
  'metrics.completionRate': string;
  'metrics.agentUtilization': string;
  'metrics.taskVelocity': string;
  'metrics.totalSessions': string;
  'metrics.avgDuration': string;
  'metrics.filesChanged': string;
  'metrics.noData': string;
  'metrics.noDataHint': string;

  // Git 연동
  'git.aiCommit': string;
  'git.coAuthored': string;
  'git.noCommits': string;
  'git.filesChanged': string;

  // TODO 연동
  'todo.title': string;
  'todo.completed': string;
  'todo.pending': string;
  'todo.inProgress': string;

  // 검색 확장
  'search.globalPlaceholder': string;

  // 내보내기
  'export.title': string;
  'export.csv': string;
  'export.report': string;
  'export.success': string;

  // 알림 확장
  'webhook.title': string;
  'webhook.sent': string;
  'webhook.error': string;
  'webhook.notConfigured': string;

  // MCP 서버
  'mcp.title': string;
  'mcp.servers': string;
  'mcp.noServers': string;
  'mcp.serverRunning': string;
  'mcp.serverStopped': string;
  'mcp.port': string;

  // AI 요약 리포트
  'summary.title': string;
  'summary.generated': string;
  'summary.noData': string;

  // 태스크 시간/토큰
  'task.headerDuration': string;
  'task.headerTokens': string;
  'task.estimated': string;

  // 서브에이전트
  'subagent.title': string;
  'subagent.noAgents': string;
  'subagent.active': string;
  'subagent.completed': string;
  'subagent.lines': string;

  // 언어 변경
  'lang.change': string;

  // 토큰 사용량
  'token.title': string;
  'token.input': string;
  'token.output': string;
  'token.cacheCreate': string;
  'token.cacheRead': string;
  'token.total': string;
};

/** WebView로 전달할 번역 키 목록 */
export const WEBVIEW_TRANSLATION_KEYS: (keyof ExtendedTranslationMap)[] = [
  // 탭
  'view.overview', 'view.tasks', 'view.messages', 'view.deps',
  // 통계
  'stats.tasks', 'stats.active', 'stats.messages', 'stats.elapsed',
  // 상태
  'status.completed', 'status.inProgress', 'status.pending', 'status.blocked',
  // 에이전트
  'agent.sectionTitle', 'agent.taskProgress', 'agent.noAgents',
  // 태스크
  'task.headerId', 'task.headerTask', 'task.headerAssignee', 'task.headerStatus',
  'task.viewKanban', 'task.viewTable',
  // 메시지
  'message.filterAll', 'message.filterConversation', 'message.filterSystem',
  // 의존성
  'deps.sectionTitle', 'deps.noTasks',
  // 알림
  'notification.taskCompleted', 'notification.agentJoined', 'notification.agentLeft',
  // 시간
  'duration.seconds', 'duration.minutes', 'duration.hours',
  'timeAgo.seconds', 'timeAgo.minutes', 'timeAgo.hours',
  // 확장 키
  'ext.title', 'ext.description',
  'activity.title', 'activity.fileEdit', 'activity.command',
  'activity.taskChange', 'activity.message', 'activity.error',
  'activity.noActivity', 'activity.noActivityHint',
  'session.active', 'session.ended', 'session.filesModified', 'session.commandsRun',
  'search.placeholder', 'search.noResults',
  'settings.language', 'settings.notifications', 'settings.notifOn', 'settings.notifOff',
  'a11y.skipToContent', 'a11y.expandAgent', 'a11y.collapseAgent',
  'a11y.expandTask', 'a11y.collapseTask', 'a11y.progressBar',
  'error.dirNotFound', 'error.parseError', 'error.connectionLost',
  'error.retrying', 'error.retry',
  'empty.noTeams', 'empty.noTeamsHint', 'empty.noTasks',
  'empty.noMessages', 'empty.noMessagesHint',
  'empty.noDeps', 'empty.noDepsHint',
  'mini.activeSessions', 'mini.modifiedFiles', 'mini.tasks', 'mini.lastActivity', 'mini.openDashboard', 'mini.justNow',
  'statusBar.noTeams', 'statusBar.completion',
  // Phase 2 키
  'timeline.title', 'timeline.noEvents', 'timeline.noEventsHint', 'timeline.today', 'timeline.earlier',
  'metrics.title', 'metrics.completionRate', 'metrics.agentUtilization', 'metrics.taskVelocity',
  'metrics.totalSessions', 'metrics.avgDuration', 'metrics.filesChanged', 'metrics.noData', 'metrics.noDataHint',
  'git.aiCommit', 'git.coAuthored', 'git.noCommits', 'git.filesChanged',
  'todo.title', 'todo.completed', 'todo.pending', 'todo.inProgress',
  'search.globalPlaceholder',
  'export.title', 'export.csv', 'export.report', 'export.success',
  'webhook.title', 'webhook.sent', 'webhook.error', 'webhook.notConfigured',
  'mcp.title', 'mcp.servers', 'mcp.noServers', 'mcp.serverRunning', 'mcp.serverStopped', 'mcp.port',
  'summary.title', 'summary.generated', 'summary.noData',
  'task.headerDuration', 'task.headerTokens', 'task.estimated',
  'subagent.title', 'subagent.noAgents', 'subagent.active', 'subagent.completed', 'subagent.lines',
  'lang.change',
  'token.title', 'token.input', 'token.output', 'token.cacheCreate', 'token.cacheRead', 'token.total',
];
