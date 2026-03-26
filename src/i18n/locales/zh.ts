/**
 * 중국어 번역
 */

export const zh = {
  'ext.title': 'Claude Flow Monitor',
  'ext.description': 'Claude Code 工作流程实时可视化',

  'status.blocked': '已阻塞',

  'statusBar.noTeams': '没有活跃的团队',
  'statusBar.completion': '{name}: 完成 {rate}%',

  'task.headerAssignee': '负责人',
  'task.viewKanban': '看板',
  'task.viewTable': '表格',

  'message.filterAll': '全部',
  'message.filterConversation': '对话',
  'message.filterSystem': '系统',

  'deps.noTasks': '没有可显示的依赖关系',

  'notification.taskCompleted': '任务完成: {task}',
  'notification.agentJoined': '{agent} 加入了 {team}',
  'notification.agentLeft': '{agent} 离开了 {team}',

  'activity.title': '活动动态',
  'activity.fileEdit': '{file} 修改 ({lines}行)',
  'activity.command': '执行 {command}',
  'activity.taskChange': '任务 {task} — {status}',
  'activity.message': '{from} → {to}',
  'activity.error': '错误: {message}',
  'activity.noActivity': '暂无活动',
  'activity.noActivityHint': 'Claude Code 开始工作后活动会显示在这里',

  'session.active': '活跃会话',
  'session.ended': '已结束会话',
  'session.filesModified': '修改了 {count} 个文件',
  'session.commandsRun': '执行了 {count} 条命令',

  'search.placeholder': '搜索任务...',
  'search.noResults': '未找到结果',

  'settings.theme': '主题',
  'settings.language': '语言',
  'settings.notifications': '通知',
  'settings.notifOn': '开',
  'settings.notifOff': '关',

  'a11y.skipToContent': '跳至内容',
  'a11y.expandAgent': '展开代理详情',
  'a11y.collapseAgent': '收起代理详情',
  'a11y.expandTask': '展开任务详情',
  'a11y.collapseTask': '收起任务详情',
  'a11y.progressBar': '进度: {percent}%',

  'error.dirNotFound': '找不到 ~/.claude 目录',
  'error.parseError': '读取数据时出错',
  'error.connectionLost': '文件监视已断开',
  'error.retrying': '重新连接中...',
  'error.retry': '重试',

  'empty.noTeams': '没有活跃的团队',
  'empty.noTeamsHint': '启动 Agent Teams 后状态会显示在这里',
  'empty.noTasks': '没有已注册的任务',
  'empty.noMessages': '没有消息',
  'empty.noMessagesHint': '代理之间开始通信后会显示消息',
  'empty.noDeps': '没有可显示的依赖关系',
  'empty.noDepsHint': '任务设置了 blockedBy 后会显示依赖关系',

  'mini.activeSessions': '活跃会话',
  'mini.modifiedFiles': '修改文件',
  'mini.tasks': '任务',
  'mini.lastActivity': '最近活动',
  'mini.openDashboard': '打开仪表板',
  'mini.justNow': '刚刚',

  'timeline.title': '时间线',
  'timeline.noEvents': '暂无事件',
  'timeline.noEventsHint': '活动开始后将在时间线上显示',
  'timeline.today': '今天',
  'timeline.earlier': '更早',

  'metrics.title': '指标',
  'metrics.completionRate': '完成率',
  'metrics.agentUtilization': '代理利用率',
  'metrics.taskVelocity': '任务处理速度',
  'metrics.totalSessions': '总会话数',
  'metrics.avgDuration': '平均耗时',
  'metrics.filesChanged': '变更文件数',
  'metrics.noData': '暂无指标数据',
  'metrics.noDataHint': '活动被追踪后将显示指标',

  'git.aiCommit': 'AI 提交',
  'git.coAuthored': '与 Claude 合作编写',
  'git.noCommits': '未找到 AI 提交',
  'git.filesChanged': '变更了 {count} 个文件',

  'todo.title': 'TODO 项目',
  'todo.completed': '已完成',
  'todo.pending': '待处理',
  'todo.inProgress': '进行中',

  'search.globalPlaceholder': '全局搜索...',

  'export.title': '导出',
  'export.csv': '下载 CSV',
  'export.report': '生成报告',
  'export.success': '导出完成',

  'webhook.title': 'Webhook 通知',
  'webhook.sent': '通知发送完成',
  'webhook.error': 'Webhook 发送失败: {message}',
  'webhook.notConfigured': '未配置 Webhook URL',

  'mcp.title': 'MCP 服务器',
  'mcp.servers': '已连接服务器',
  'mcp.noServers': '无 MCP 服务器',
  'mcp.serverRunning': 'MCP 服务器运行中 (端口 {port})',
  'mcp.serverStopped': 'MCP 服务器已停止',
  'mcp.port': '端口',

  'summary.title': 'AI 活动摘要',
  'summary.generated': '摘要报告已生成',
  'summary.noData': '没有可用于摘要的数据',

  'token.title': 'Token 用量',
  'token.input': '输入 Token',
  'token.output': '输出 Token',
  'token.cacheCreate': '缓存创建',
  'token.cacheRead': '缓存读取',
  'token.total': '总 Token',
} as const;
