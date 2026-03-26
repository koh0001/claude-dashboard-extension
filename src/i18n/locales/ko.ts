/**
 * 한국어 번역 (기준 로케일)
 * core TranslationMap에 없는 확장 키만 정의
 */

/** 확장 번역 키 (core 키 제외) */
export const ko = {
  'ext.title': 'Claude Flow Monitor',
  'ext.description': 'Claude Code 워크플로우 실시간 시각화',

  'status.blocked': '차단됨',

  'statusBar.noTeams': '활성 팀 없음',
  'statusBar.completion': '{name}: {rate}% 완료',

  'task.headerAssignee': '담당자',
  'task.viewKanban': '칸반',
  'task.viewTable': '테이블',

  'message.filterAll': '전체',
  'message.filterConversation': '대화',
  'message.filterSystem': '시스템',

  'deps.noTasks': '표시할 의존성이 없습니다',

  'notification.taskCompleted': '태스크 완료: {task}',
  'notification.agentJoined': '{agent}가 {team}에 합류했습니다',
  'notification.agentLeft': '{agent}가 {team}에서 이탈했습니다',

  'activity.title': '활동 피드',
  'activity.fileEdit': '{file} 수정 ({lines}줄)',
  'activity.command': '{command} 실행',
  'activity.taskChange': '태스크 {task} — {status}',
  'activity.message': '{from} → {to}',
  'activity.error': '오류: {message}',
  'activity.noActivity': '활동이 없습니다',
  'activity.noActivityHint': 'Claude Code가 작업을 시작하면 여기에 표시됩니다',

  'session.active': '활성 세션',
  'session.ended': '종료된 세션',
  'session.filesModified': '파일 {count}개 수정',
  'session.commandsRun': '커맨드 {count}회 실행',

  'search.placeholder': '태스크 검색...',
  'search.noResults': '검색 결과가 없습니다',

  'settings.theme': '테마',
  'settings.language': '언어',
  'settings.notifications': '알림',
  'settings.notifOn': '켜짐',
  'settings.notifOff': '꺼짐',

  'a11y.skipToContent': '콘텐츠로 건너뛰기',
  'a11y.expandAgent': '에이전트 상세 보기',
  'a11y.collapseAgent': '에이전트 상세 닫기',
  'a11y.expandTask': '태스크 상세 보기',
  'a11y.collapseTask': '태스크 상세 닫기',
  'a11y.progressBar': '진행률: {percent}%',

  'error.dirNotFound': '~/.claude 디렉토리를 찾을 수 없습니다',
  'error.parseError': '데이터를 읽는 중 오류가 발생했습니다',
  'error.connectionLost': '파일 감시가 중단되었습니다',
  'error.retrying': '재연결 중...',
  'error.retry': '다시 시도',

  'empty.noTeams': '활성 팀이 없습니다',
  'empty.noTeamsHint': 'Agent Teams를 시작하면 여기에 상태가 표시됩니다',
  'empty.noTasks': '등록된 태스크가 없습니다',
  'empty.noMessages': '메시지가 없습니다',
  'empty.noMessagesHint': '에이전트 간 통신이 시작되면 표시됩니다',
  'empty.noDeps': '표시할 의존성이 없습니다',
  'empty.noDepsHint': '태스크에 blockedBy 설정이 있으면 표시됩니다',

  'mini.activeSessions': '활성 세션',
  'mini.modifiedFiles': '변경 파일',
  'mini.tasks': '태스크',
  'mini.lastActivity': '마지막 활동',
  'mini.openDashboard': '대시보드 열기',
  'mini.justNow': '방금 전',

  'timeline.title': '타임라인',
  'timeline.noEvents': '이벤트가 없습니다',
  'timeline.noEventsHint': '활동이 시작되면 타임라인에 표시됩니다',
  'timeline.today': '오늘',
  'timeline.earlier': '이전',

  'metrics.title': '메트릭',
  'metrics.completionRate': '완료율',
  'metrics.agentUtilization': '에이전트 활용도',
  'metrics.taskVelocity': '태스크 처리 속도',
  'metrics.totalSessions': '전체 세션',
  'metrics.avgDuration': '평균 소요 시간',
  'metrics.filesChanged': '변경된 파일 수',
  'metrics.noData': '메트릭 데이터 없음',
  'metrics.noDataHint': '활동이 추적되면 메트릭이 표시됩니다',

  'git.aiCommit': 'AI 커밋',
  'git.coAuthored': 'Claude와 공동 작성',
  'git.noCommits': 'AI 커밋을 찾을 수 없습니다',
  'git.filesChanged': '{count}개 파일 변경',

  'todo.title': 'TODO 항목',
  'todo.completed': '완료',
  'todo.pending': '대기',
  'todo.inProgress': '진행 중',

  'search.globalPlaceholder': '전체 검색...',

  'export.title': '내보내기',
  'export.csv': 'CSV 다운로드',
  'export.report': '리포트 생성',
  'export.success': '내보내기 완료',

  'webhook.title': '웹훅 알림',
  'webhook.sent': '알림 전송 완료',
  'webhook.error': '웹훅 전송 실패: {message}',
  'webhook.notConfigured': '웹훅 URL이 설정되지 않았습니다',

  'mcp.title': 'MCP 서버',
  'mcp.servers': '연결된 서버',
  'mcp.noServers': 'MCP 서버 없음',
  'mcp.serverRunning': 'MCP 서버 실행 중 (포트 {port})',
  'mcp.serverStopped': 'MCP 서버 중지됨',
  'mcp.port': '포트',

  'summary.title': 'AI 활동 요약',
  'summary.generated': '요약 리포트가 생성되었습니다',
  'summary.noData': '요약할 데이터가 없습니다',
} as const;
