/**
 * 일본어 번역
 */

export const ja = {
  'ext.title': 'Claude Flow Monitor',
  'ext.description': 'Claude Code ワークフローのリアルタイム可視化',

  'status.blocked': 'ブロック中',

  'statusBar.noTeams': 'アクティブなチームなし',
  'statusBar.completion': '{name}: {rate}% 完了',

  'task.headerAssignee': '担当者',
  'task.viewKanban': 'カンバン',
  'task.viewTable': 'テーブル',

  'message.filterAll': 'すべて',
  'message.filterConversation': '会話',
  'message.filterSystem': 'システム',

  'deps.noTasks': '表示する依存関係がありません',

  'notification.taskCompleted': 'タスク完了: {task}',
  'notification.agentJoined': '{agent}が{team}に参加しました',
  'notification.agentLeft': '{agent}が{team}から離脱しました',

  'activity.title': 'アクティビティフィード',
  'activity.fileEdit': '{file} 変更 ({lines}行)',
  'activity.command': '{command} 実行',
  'activity.taskChange': 'タスク {task} — {status}',
  'activity.message': '{from} → {to}',
  'activity.error': 'エラー: {message}',
  'activity.noActivity': 'アクティビティがありません',
  'activity.noActivityHint': 'Claude Codeが作業を開始するとここに表示されます',

  'session.active': 'アクティブセッション',
  'session.ended': '終了したセッション',
  'session.filesModified': 'ファイル{count}個変更',
  'session.commandsRun': 'コマンド{count}回実行',

  'search.placeholder': 'タスクを検索...',
  'search.noResults': '検索結果がありません',

  'settings.theme': 'テーマ',
  'settings.language': '言語',
  'settings.notifications': '通知',
  'settings.notifOn': 'オン',
  'settings.notifOff': 'オフ',

  'a11y.skipToContent': 'コンテンツへスキップ',
  'a11y.expandAgent': 'エージェント詳細を展開',
  'a11y.collapseAgent': 'エージェント詳細を閉じる',
  'a11y.expandTask': 'タスク詳細を展開',
  'a11y.collapseTask': 'タスク詳細を閉じる',
  'a11y.progressBar': '進捗: {percent}%',

  'error.dirNotFound': '~/.claudeディレクトリが見つかりません',
  'error.parseError': 'データの読み取りエラー',
  'error.connectionLost': 'ファイル監視が切断されました',
  'error.retrying': '再接続中...',
  'error.retry': '再試行',

  'empty.noTeams': 'アクティブなチームがありません',
  'empty.noTeamsHint': 'Agent Teamsを開始するとここに表示されます',
  'empty.noTasks': '登録されたタスクがありません',
  'empty.noMessages': 'メッセージがありません',
  'empty.noMessagesHint': 'エージェント間通信が開始されると表示されます',
  'empty.noDeps': '表示する依存関係がありません',
  'empty.noDepsHint': 'タスクにblockedBy設定があると表示されます',

  'mini.activeSessions': 'アクティブセッション',
  'mini.modifiedFiles': '変更ファイル',
  'mini.tasks': 'タスク',
  'mini.lastActivity': '最終アクティビティ',
  'mini.openDashboard': 'ダッシュボードを開く',
  'mini.justNow': 'たった今',

  'timeline.title': 'タイムライン',
  'timeline.noEvents': 'イベントがありません',
  'timeline.noEventsHint': 'アクティビティが始まるとタイムラインに表示されます',
  'timeline.today': '今日',
  'timeline.earlier': '以前',

  'metrics.title': 'メトリクス',
  'metrics.completionRate': '完了率',
  'metrics.agentUtilization': 'エージェント稼働率',
  'metrics.taskVelocity': 'タスク処理速度',
  'metrics.totalSessions': '総セッション数',
  'metrics.avgDuration': '平均所要時間',
  'metrics.filesChanged': '変更ファイル数',
  'metrics.noData': 'メトリクスデータなし',
  'metrics.noDataHint': 'アクティビティが追跡されるとメトリクスが表示されます',

  'git.aiCommit': 'AIコミット',
  'git.coAuthored': 'Claudeと共同作成',
  'git.noCommits': 'AIコミットが見つかりません',
  'git.filesChanged': '{count}ファイル変更',

  'todo.title': 'TODO項目',
  'todo.completed': '完了',
  'todo.pending': '保留中',
  'todo.inProgress': '進行中',

  'search.globalPlaceholder': '全体検索...',

  'export.title': 'エクスポート',
  'export.csv': 'CSVダウンロード',
  'export.report': 'レポート生成',
  'export.success': 'エクスポート完了',

  'webhook.title': 'Webhook通知',
  'webhook.sent': '通知送信完了',
  'webhook.error': 'Webhook送信失敗: {message}',
  'webhook.notConfigured': 'Webhook URLが設定されていません',

  'mcp.title': 'MCPサーバー',
  'mcp.servers': '接続サーバー',
  'mcp.noServers': 'MCPサーバーなし',
  'mcp.serverRunning': 'MCPサーバー実行中 (ポート{port})',
  'mcp.serverStopped': 'MCPサーバー停止',
  'mcp.port': 'ポート',

  'summary.title': 'AIアクティビティサマリー',
  'summary.generated': 'サマリーレポートが生成されました',
  'summary.noData': 'サマリーするデータがありません',

  'task.headerDuration': '所要時間',
  'task.headerTokens': 'トークン',
  'task.estimated': '≈ 推定',

  'token.title': 'トークン使用量',
  'token.input': '入力トークン',
  'token.output': '出力トークン',
  'token.cacheCreate': 'キャッシュ作成',
  'token.cacheRead': 'キャッシュ読取',
  'token.total': '合計トークン',
} as const;
