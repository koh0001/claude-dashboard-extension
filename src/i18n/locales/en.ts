/**
 * 영어 번역
 */

export const en = {
  'ext.title': 'Claude Flow Monitor',
  'ext.description': 'Real-time Claude Code workflow visualization',

  'status.blocked': 'Blocked',

  'statusBar.noTeams': 'No active teams',
  'statusBar.completion': '{name}: {rate}% complete',

  'task.headerAssignee': 'Assignee',
  'task.viewKanban': 'Kanban',
  'task.viewTable': 'Table',

  'message.filterAll': 'All',
  'message.filterConversation': 'Conversation',
  'message.filterSystem': 'System',

  'deps.noTasks': 'No dependencies to display',

  'notification.taskCompleted': 'Task completed: {task}',
  'notification.agentJoined': '{agent} joined {team}',
  'notification.agentLeft': '{agent} left {team}',

  'activity.title': 'Activity Feed',
  'activity.fileEdit': '{file} modified ({lines} lines)',
  'activity.command': 'Ran {command}',
  'activity.taskChange': 'Task {task} — {status}',
  'activity.message': '{from} → {to}',
  'activity.error': 'Error: {message}',
  'activity.noActivity': 'No activity',
  'activity.noActivityHint': 'Activity will appear here when Claude Code starts working',

  'session.active': 'Active session',
  'session.ended': 'Ended session',
  'session.filesModified': '{count} files modified',
  'session.commandsRun': '{count} commands run',

  'search.placeholder': 'Search tasks...',
  'search.noResults': 'No results found',

  'settings.theme': 'Theme',
  'settings.language': 'Language',
  'settings.notifications': 'Notifications',
  'settings.notifOn': 'On',
  'settings.notifOff': 'Off',

  'a11y.skipToContent': 'Skip to content',
  'a11y.expandAgent': 'Expand agent details',
  'a11y.collapseAgent': 'Collapse agent details',
  'a11y.expandTask': 'Expand task details',
  'a11y.collapseTask': 'Collapse task details',
  'a11y.progressBar': 'Progress: {percent}%',

  'error.dirNotFound': 'Cannot find ~/.claude directory',
  'error.parseError': 'Error reading data',
  'error.connectionLost': 'File watch disconnected',
  'error.retrying': 'Reconnecting...',
  'error.retry': 'Retry',

  'empty.noTeams': 'No active teams',
  'empty.noTeamsHint': 'Start Agent Teams to see status here',
  'empty.noTasks': 'No tasks registered',
  'empty.noMessages': 'No messages',
  'empty.noMessagesHint': 'Messages will appear when agents communicate',
  'empty.noDeps': 'No dependencies to display',
  'empty.noDepsHint': 'Dependencies appear when tasks have blockedBy settings',

  'mini.activeSessions': 'Active Sessions',
  'mini.modifiedFiles': 'Modified Files',
  'mini.tasks': 'Tasks',
  'mini.lastActivity': 'Last Activity',
  'mini.openDashboard': 'Open Dashboard',
  'mini.justNow': 'just now',

  'timeline.title': 'Timeline',
  'timeline.noEvents': 'No events',
  'timeline.noEventsHint': 'Events will appear on the timeline when activity starts',
  'timeline.today': 'Today',
  'timeline.earlier': 'Earlier',

  'metrics.title': 'Metrics',
  'metrics.completionRate': 'Completion Rate',
  'metrics.agentUtilization': 'Agent Utilization',
  'metrics.taskVelocity': 'Task Velocity',
  'metrics.totalSessions': 'Total Sessions',
  'metrics.avgDuration': 'Avg Duration',
  'metrics.filesChanged': 'Files Changed',
  'metrics.noData': 'No metrics data',
  'metrics.noDataHint': 'Metrics will appear when activities are tracked',

  'git.aiCommit': 'AI Commit',
  'git.coAuthored': 'Co-authored with Claude',
  'git.noCommits': 'No AI commits found',
  'git.filesChanged': '{count} files changed',

  'todo.title': 'TODO Items',
  'todo.completed': 'Completed',
  'todo.pending': 'Pending',
  'todo.inProgress': 'In Progress',

  'search.globalPlaceholder': 'Search everywhere...',

  'export.title': 'Export',
  'export.csv': 'Download CSV',
  'export.report': 'Generate Report',
  'export.success': 'Export complete',

  'webhook.title': 'Webhook Notifications',
  'webhook.sent': 'Notification sent',
  'webhook.error': 'Webhook failed: {message}',
  'webhook.notConfigured': 'Webhook URL is not configured',

  'mcp.title': 'MCP Server',
  'mcp.servers': 'Connected Servers',
  'mcp.noServers': 'No MCP servers',
  'mcp.serverRunning': 'MCP server running (port {port})',
  'mcp.serverStopped': 'MCP server stopped',
  'mcp.port': 'Port',

  'summary.title': 'AI Activity Summary',
  'summary.generated': 'Summary report has been generated',
  'summary.noData': 'No data available for summary',

  'token.title': 'Token Usage',
  'token.input': 'Input Tokens',
  'token.output': 'Output Tokens',
  'token.cacheCreate': 'Cache Creation',
  'token.cacheRead': 'Cache Read',
  'token.total': 'Total Tokens',
} as const;
