/**
 * Extension ↔ WebView 메시지 타입 정의
 */

/** 탭 이름 */
export type TabName = 'overview' | 'tasks' | 'messages' | 'deps' | 'activity' | 'timeline' | 'metrics';

/** WebView → Extension 메시지 */
export type WebToExtMessage =
  | { type: 'ready' }
  | { type: 'selectTeam'; teamName: string }
  | { type: 'refresh' }
  | { type: 'changeTab'; tab: TabName }
  | { type: 'changeLanguage' }
  | { type: 'changeTab'; tab: TabName };

/** 스냅샷 페이로드 (직렬화용) */
export interface SnapshotPayload {
  teamName: string;
  config: {
    name: string;
    agents: Array<{
      name: string;
      description: string;
      model: string;
      color: string;
      isLead: boolean;
    }>;
  };
  stats: {
    totalTasks: number;
    completedTasks: number;
    activeTasks: number;
    pendingTasks: number;
    blockedTasks: number;
    totalMessages: number;
    elapsedMs: number;
  };
  agents: Array<{
    name: string;
    description: string;
    model: string;
    color: string;
    isLead: boolean;
    status: 'active' | 'idle' | 'completed';
    currentTask: string | null;
    completedTaskCount: number;
    totalTaskCount: number;
  }>;
  tasks: Array<{
    id: string;
    title: string;
    description: string;
    status: string;
    assignee: string;
    blockedBy: string[];
    blocks: string[];
  }>;
  messages: Array<{
    id: string;
    from: string;
    to: string;
    content: string;
    timestamp: number;
    type: 'text' | 'system' | 'permission';
  }>;
  depsLayers: string[][];
}

/** 초기화 페이로드 */
export interface InitPayload {
  teams: Record<string, SnapshotPayload>;
  currentTeam: string | null;
}

/** 세션 활동 항목 */
export interface ActivityItem {
  id: string;
  timestamp: number;
  type: 'file_edit' | 'command' | 'task_change' | 'message' | 'error';
  summary: string;
  detail?: string;
  source?: string;
}

/** 토큰 사용량 */
export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens: number;
  cacheReadTokens: number;
  totalTokens: number;
}

/** Extension → WebView 메시지 */
export type ExtToWebMessage =
  | { type: 'init'; data: InitPayload; translations: Record<string, string>; locale: string }
  | { type: 'snapshotUpdate'; teamName: string; data: SnapshotPayload }
  | { type: 'translationsUpdate'; translations: Record<string, string>; locale: string }
  | { type: 'activityUpdate'; items: ActivityItem[] }
  | { type: 'tokenUpdate'; usage: TokenUsage }
  | { type: 'themeChanged'; themeKind: string };

/** 알림 페이로드 */
export interface NotificationPayload {
  type: 'taskCompleted' | 'agentJoined' | 'agentLeft' | 'error';
  teamName: string;
  message: string;
  detail?: string;
}
