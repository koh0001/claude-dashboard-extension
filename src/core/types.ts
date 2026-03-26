/**
 * Agent Teams 파일 프로토콜 타입 정의
 *
 * Claude Code가 ~/.claude/ 디렉토리에 저장하는
 * JSON 파일들의 구조를 TypeScript 타입으로 정의합니다.
 *
 * 참고: https://www.claudecodecamp.com/p/claude-code-agent-teams-how-they-work-under-the-hood
 */

// ────────────────────────────────────────────────
// 팀 / 에이전트 타입
// ────────────────────────────────────────────────

/** 스폰 백엔드 타입 */
export type BackendType = 'in-process' | 'tmux' | 'iterm2';

/** 팀 멤버 (에이전트) 정보 */
export interface TeamMember {
  /** 고유 ID. 형식: "{name}@{team-name}" */
  agentId: string;
  /** 에이전트 이름 (예: "team-lead", "backend-dev") */
  name: string;
  /** 에이전트 역할 타입 (예: "team-lead", "Backend Developer") */
  agentType: string;
  /** 사용 모델 (예: "opus", "sonnet", "haiku") */
  model?: string;
  /** 스폰 시 전달된 프롬프트 */
  prompt?: string;
  /** UI 표시 색상 (hex) */
  color: string;
  /** plan 모드 강제 여부 */
  planModeRequired?: boolean;
  /** 팀 합류 시각 (Unix timestamp ms) */
  joinedAt: number;
  /** tmux pane ID (tmux 백엔드일 때) */
  tmuxPaneId?: string;
  /** 작업 디렉토리 */
  cwd?: string;
  /** 스폰 백엔드 타입 */
  backendType: BackendType;
}

/** 팀 설정 파일 (config.json) */
export interface TeamConfig {
  /** 팀 이름 (디렉토리명과 동일) */
  name: string;
  /** 팀 설명 */
  description: string;
  /** 리더 에이전트 ID */
  leadAgentId: string;
  /** 팀 생성 시각 (Unix timestamp ms) */
  createdAt: number;
  /** 팀 멤버 목록 */
  members: TeamMember[];
}

// ────────────────────────────────────────────────
// 태스크 타입
// ────────────────────────────────────────────────

/** 태스크 상태 */
export type TaskStatus = 'pending' | 'in_progress' | 'completed';

/** 태스크 메타데이터 */
export interface TaskMetadata {
  /** 내부 태스크 여부 (에이전트 라이프사이클 추적용) */
  _internal?: boolean;
  /** 추가 메타데이터 */
  [key: string]: unknown;
}

/** 개별 태스크 */
export interface Task {
  /** 태스크 ID (숫자 문자열) */
  id: string;
  /** 태스크 제목 */
  subject: string;
  /** 상세 설명 */
  description?: string;
  /** 현재 상태 */
  status: TaskStatus;
  /** 담당 에이전트 이름 (빈 문자열이면 미할당) */
  owner: string;
  /** 이 태스크가 차단하는 태스크 ID 목록 */
  blocks: string[];
  /** 이 태스크를 차단하는 태스크 ID 목록 */
  blockedBy: string[];
  /** 메타데이터 */
  metadata: TaskMetadata;
  /** 완료 시각 (추가 필드, 직접 추적용) */
  completedAt?: number;
}

// ────────────────────────────────────────────────
// 메시지 타입
// ────────────────────────────────────────────────

/** 메시지 타입 */
export type MessageType =
  | 'text'
  | 'idle_notification'
  | 'permission_request'
  | 'plan_approval_request'
  | 'shutdown_request'
  | 'shutdown_approved'
  | 'task_assignment';

/** 수신 메시지 */
export interface InboxMessage {
  /** 발신자 에이전트 이름 */
  from: string;
  /** 수신자 에이전트 이름 */
  to: string;
  /** 메시지 타입 */
  type: MessageType;
  /** 메시지 본문 (텍스트 또는 JSON 문자열) */
  content: string;
  /** 전송 시각 (Unix timestamp ms) */
  timestamp: number;
  /** 읽음 여부 */
  read: boolean;
}

// ────────────────────────────────────────────────
// 스냅샷 / 통계 타입
// ────────────────────────────────────────────────

/** 에이전트의 현재 상태 요약 */
export interface AgentStatus {
  /** 에이전트 멤버 정보 */
  member: TeamMember;
  /** 현재 진행 중인 태스크 */
  activeTasks: Task[];
  /** 완료한 태스크 */
  completedTasks: Task[];
  /** 할당된 전체 태스크 */
  allTasks: Task[];
  /** 마지막 메시지 시각 */
  lastMessageAt?: number;
  /** 유휴 상태 여부 */
  isIdle: boolean;
}

/** 팀의 전체 상태 스냅샷 */
export interface TeamSnapshot {
  /** 팀 설정 */
  config: TeamConfig;
  /** 전체 태스크 목록 */
  tasks: Task[];
  /** 에이전트별 상태 */
  agents: AgentStatus[];
  /** 전체 메시지 (시간순) */
  messages: InboxMessage[];
  /** 스냅샷 시각 */
  timestamp: number;
  /** 진행률 통계 */
  stats: TeamStats;
}

/** 팀 통계 */
export interface TeamStats {
  /** 전체 태스크 수 (내부 태스크 제외) */
  totalTasks: number;
  /** 완료 태스크 수 */
  completedTasks: number;
  /** 진행 중 태스크 수 */
  inProgressTasks: number;
  /** 대기 중 태스크 수 */
  pendingTasks: number;
  /** 완료율 (0-100) */
  completionRate: number;
  /** 활성 에이전트 수 */
  activeAgents: number;
  /** 전체 에이전트 수 (리더 포함) */
  totalAgents: number;
  /** 팀 가동 시간 (ms) */
  uptime: number;
  /** 전체 메시지 수 */
  totalMessages: number;
}

// ────────────────────────────────────────────────
// TeamWatcher 이벤트 / 옵션 타입
// ────────────────────────────────────────────────

/** TeamWatcher가 발행하는 이벤트 맵 */
export interface TeamWatcherEvents {
  /** 새 팀 발견 */
  'team:created': (teamName: string, config: TeamConfig) => void;
  /** 팀 설정 변경 (멤버 추가/제거 등) */
  'team:updated': (teamName: string, config: TeamConfig) => void;
  /** 팀 삭제됨 */
  'team:removed': (teamName: string) => void;
  /** 태스크 생성 */
  'task:created': (teamName: string, task: Task) => void;
  /** 태스크 상태 변경 */
  'task:updated': (teamName: string, task: Task, prev: Task | null) => void;
  /** 태스크 완료 */
  'task:completed': (teamName: string, task: Task) => void;
  /** 새 메시지 수신 */
  'message:received': (teamName: string, message: InboxMessage) => void;
  /** 에이전트 합류 */
  'agent:joined': (teamName: string, member: TeamMember) => void;
  /** 에이전트 이탈 */
  'agent:left': (teamName: string, memberName: string) => void;
  /** 전체 스냅샷 갱신 */
  'snapshot:updated': (teamName: string, snapshot: TeamSnapshot) => void;
  /** 에러 발생 (감시 중단되지 않음) */
  error: (error: Error, context: string) => void;
}

/** TeamWatcher 설정 옵션 */
export interface WatcherOptions {
  /** ~/.claude 디렉토리 경로 (기본: $HOME/.claude) */
  claudeDir?: string;
  /** 파일 변경 감지 debounce (ms, 기본: 100) */
  debounceMs?: number;
  /** 스냅샷 폴링 간격 (ms, 기본: 1000). fs.watch 폴백용 */
  pollIntervalMs?: number;
  /** 내부 태스크(_internal) 필터링 여부 (기본: true) */
  filterInternalTasks?: boolean;
  /** 감시할 팀 이름 필터 (비어있으면 전체) */
  teamFilter?: string[];
}

// ────────────────────────────────────────────────
// i18n 타입
// ────────────────────────────────────────────────

/** 지원 로케일 */
export type Locale = 'ko' | 'en' | 'ja' | 'zh';

/** 로케일 순환 순서 */
export const LOCALE_ORDER: readonly Locale[] = ['ko', 'en', 'ja', 'zh'] as const;

/** 로케일 표시 이름 */
export const LOCALE_NAMES: Record<Locale, string> = {
  ko: '한국어',
  en: 'English',
  ja: '日本語',
  zh: '中文',
};

/** 번역 맵 (중첩 구조를 평탄화한 dot-notation 키) */
export type TranslationMap = {
  'status.completed': string;
  'status.inProgress': string;
  'status.pending': string;
  'duration.seconds': string;
  'duration.minutes': string;
  'duration.hours': string;
  'duration.hoursMinutes': string;
  'timeAgo.seconds': string;
  'timeAgo.minutes': string;
  'timeAgo.hours': string;
  'app.title': string;
  'app.subtitle': string;
  'app.quit': string;
  'app.watching': string;
  'app.watchingHint': string;
  'app.watchingPath': string;
  'view.overview': string;
  'view.tasks': string;
  'view.messages': string;
  'view.deps': string;
  'view.tabHint': string;
  'sidebar.teamList': string;
  'stats.tasks': string;
  'stats.active': string;
  'stats.messages': string;
  'stats.elapsed': string;
  'agent.sectionTitle': string;
  'agent.taskProgress': string;
  'agent.noAgents': string;
  'task.headerId': string;
  'task.headerTask': string;
  'task.headerOwner': string;
  'task.headerStatus': string;
  'task.unassigned': string;
  'task.noTasks': string;
  'message.headerFrom': string;
  'message.headerTo': string;
  'message.headerContent': string;
  'message.headerTime': string;
  'message.noMessages': string;
  'message.olderOmitted': string;
  'deps.sectionTitle': string;
  'error.claudeDirNotFound': string;
  'error.agentTeamsNotActive': string;
  'error.startFailed': string;
  'cli.usage': string;
  'cli.options': string;
  'cli.teamDesc': string;
  'cli.dirDesc': string;
  'cli.langDesc': string;
  'cli.helpDesc': string;
  'cli.versionDesc': string;
  'cli.example': string;
};

/** 번역 키 */
export type TranslationKey = keyof TranslationMap;

/** 보간 파라미터 */
export type InterpolationParams = Record<string, string | number>;

/** 번역 함수 시그니처 */
export type TranslateFn = (key: TranslationKey, params?: InterpolationParams) => string;

/** i18n 인스턴스 */
export interface I18nInstance {
  /** 현재 로케일 */
  readonly locale: Locale;
  /** 번역 함수 */
  t: TranslateFn;
  /** 로케일 변경 (새 인스턴스 반환) */
  setLocale: (locale: Locale) => I18nInstance;
  /** 다음 로케일로 순환 (새 인스턴스 반환) */
  cycleLocale: () => I18nInstance;
}
