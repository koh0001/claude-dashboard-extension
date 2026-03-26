/**
 * i18n 코어 - 경량 자체 구현
 *
 * 사용법:
 * ```ts
 * const i18n = createI18n('en');
 * i18n.t('status.completed');              // "Completed"
 * i18n.t('duration.seconds', { count: 30 }); // "30s"
 *
 * const next = i18n.cycleLocale();         // → 'ja'
 * ```
 */

import type {
  Locale,
  TranslationMap,
  InterpolationParams,
  I18nInstance,
} from './types.js';
import { LOCALE_ORDER } from './types.js';

// ────────────────────────────────────────────────
// 번역 데이터 (4개 로케일)
// ────────────────────────────────────────────────

/** 한국어 (기본 로케일) */
const ko: TranslationMap = {
  // 상태
  'status.completed': '완료',
  'status.inProgress': '진행중',
  'status.pending': '대기',
  // 경과 시간
  'duration.seconds': '{count}초',
  'duration.minutes': '{count}분',
  'duration.hours': '{count}시간',
  'duration.hoursMinutes': '{hours}시간 {minutes}분',
  // 상대 시간
  'timeAgo.seconds': '{count}초 전',
  'timeAgo.minutes': '{count}분 전',
  'timeAgo.hours': '{count}시간 전',
  // 앱 전반
  'app.title': 'CC Team Viewer',
  'app.subtitle': 'Claude Code Agent Teams Monitor',
  'app.quit': '종료',
  'app.watching': 'Agent Teams를 감시 중...',
  'app.watchingHint': 'Claude Code에서 Agent Team을 생성하면 여기에 표시됩니다.',
  'app.watchingPath': '감시 경로: {path}/teams/',
  // 뷰 탭
  'view.overview': '개요',
  'view.tasks': '태스크',
  'view.messages': '메시지',
  'view.deps': '의존성',
  'view.tabHint': '(Tab으로 전환)',
  // 사이드바
  'sidebar.teamList': '팀 목록 (↑↓)',
  // 통계
  'stats.tasks': '태스크',
  'stats.active': '활성',
  'stats.messages': '메시지',
  'stats.elapsed': '경과',
  // 에이전트
  'agent.sectionTitle': '에이전트 ({count})',
  'agent.taskProgress': '태스크: {completed}/{total} 완료',
  'agent.noAgents': '에이전트 없음',
  // 태스크
  'task.headerId': 'ID',
  'task.headerTask': '태스크',
  'task.headerOwner': '담당',
  'task.headerStatus': '상태',
  'task.unassigned': '미할당',
  'task.noTasks': '태스크 없음',
  // 메시지
  'message.headerFrom': '발신',
  'message.headerTo': '수신',
  'message.headerContent': '내용',
  'message.headerTime': '시간',
  'message.noMessages': '메시지 없음',
  'message.olderOmitted': '... {count}개 이전 메시지 생략',
  // 의존성 그래프
  'deps.sectionTitle': '태스크 의존성 그래프',
  // 에러
  'error.claudeDirNotFound': 'Claude 디렉토리를 찾을 수 없습니다: {path}',
  'error.agentTeamsNotActive': 'Agent Teams가 활성화되어 있는지 확인해주세요.',
  'error.startFailed': '시작 실패: {message}',
  // CLI
  'cli.usage': '사용법',
  'cli.options': '옵션',
  'cli.teamDesc': '감시할 팀 이름 (여러 번 사용 가능)',
  'cli.dirDesc': 'Claude 디렉토리 경로 (기본: ~/.claude)',
  'cli.langDesc': 'UI 언어 (ko, en, ja, zh)',
  'cli.helpDesc': '도움말 표시',
  'cli.versionDesc': '버전 표시',
  'cli.example': '예시',
};

/** 영어 */
const en: TranslationMap = {
  'status.completed': 'Completed',
  'status.inProgress': 'In Progress',
  'status.pending': 'Pending',
  'duration.seconds': '{count}s',
  'duration.minutes': '{count}m',
  'duration.hours': '{count}h',
  'duration.hoursMinutes': '{hours}h {minutes}m',
  'timeAgo.seconds': '{count}s ago',
  'timeAgo.minutes': '{count}m ago',
  'timeAgo.hours': '{count}h ago',
  'app.title': 'CC Team Viewer',
  'app.subtitle': 'Claude Code Agent Teams Monitor',
  'app.quit': 'quit',
  'app.watching': 'Watching Agent Teams...',
  'app.watchingHint': 'Create an Agent Team in Claude Code to see it here.',
  'app.watchingPath': 'Watch path: {path}/teams/',
  'view.overview': 'Overview',
  'view.tasks': 'Tasks',
  'view.messages': 'Messages',
  'view.deps': 'Deps',
  'view.tabHint': '(Tab to switch)',
  'sidebar.teamList': 'Teams (↑↓)',
  'stats.tasks': 'tasks',
  'stats.active': 'active',
  'stats.messages': 'msgs',
  'stats.elapsed': 'elapsed',
  'agent.sectionTitle': 'Agents ({count})',
  'agent.taskProgress': 'Tasks: {completed}/{total} done',
  'agent.noAgents': 'No agents',
  'task.headerId': 'ID',
  'task.headerTask': 'Task',
  'task.headerOwner': 'Owner',
  'task.headerStatus': 'Status',
  'task.unassigned': 'Unassigned',
  'task.noTasks': 'No tasks',
  'message.headerFrom': 'From',
  'message.headerTo': 'To',
  'message.headerContent': 'Content',
  'message.headerTime': 'Time',
  'message.noMessages': 'No messages',
  'message.olderOmitted': '... {count} older messages omitted',
  'deps.sectionTitle': 'Task Dependency Graph',
  'error.claudeDirNotFound': 'Claude directory not found: {path}',
  'error.agentTeamsNotActive': 'Please check if Agent Teams is active.',
  'error.startFailed': 'Start failed: {message}',
  'cli.usage': 'Usage',
  'cli.options': 'Options',
  'cli.teamDesc': 'Team name to watch (can be used multiple times)',
  'cli.dirDesc': 'Claude directory path (default: ~/.claude)',
  'cli.langDesc': 'UI language (ko, en, ja, zh)',
  'cli.helpDesc': 'Show help',
  'cli.versionDesc': 'Show version',
  'cli.example': 'Examples',
};

/** 일본어 */
const ja: TranslationMap = {
  'status.completed': '完了',
  'status.inProgress': '進行中',
  'status.pending': '待機',
  'duration.seconds': '{count}秒',
  'duration.minutes': '{count}分',
  'duration.hours': '{count}時間',
  'duration.hoursMinutes': '{hours}時間{minutes}分',
  'timeAgo.seconds': '{count}秒前',
  'timeAgo.minutes': '{count}分前',
  'timeAgo.hours': '{count}時間前',
  'app.title': 'CC Team Viewer',
  'app.subtitle': 'Claude Code Agent Teams Monitor',
  'app.quit': '終了',
  'app.watching': 'Agent Teamsを監視中...',
  'app.watchingHint': 'Claude CodeでAgent Teamを作成するとここに表示されます。',
  'app.watchingPath': '監視パス: {path}/teams/',
  'view.overview': '概要',
  'view.tasks': 'タスク',
  'view.messages': 'メッセージ',
  'view.deps': '依存関係',
  'view.tabHint': '(Tabで切替)',
  'sidebar.teamList': 'チーム (↑↓)',
  'stats.tasks': 'タスク',
  'stats.active': '稼働',
  'stats.messages': 'メッセージ',
  'stats.elapsed': '経過',
  'agent.sectionTitle': 'エージェント ({count})',
  'agent.taskProgress': 'タスク: {completed}/{total} 完了',
  'agent.noAgents': 'エージェントなし',
  'task.headerId': 'ID',
  'task.headerTask': 'タスク',
  'task.headerOwner': '担当',
  'task.headerStatus': '状態',
  'task.unassigned': '未割当',
  'task.noTasks': 'タスクなし',
  'message.headerFrom': '送信',
  'message.headerTo': '受信',
  'message.headerContent': '内容',
  'message.headerTime': '時間',
  'message.noMessages': 'メッセージなし',
  'message.olderOmitted': '... {count}件の古いメッセージを省略',
  'deps.sectionTitle': 'タスク依存関係グラフ',
  'error.claudeDirNotFound': 'Claudeディレクトリが見つかりません: {path}',
  'error.agentTeamsNotActive': 'Agent Teamsが有効か確認してください。',
  'error.startFailed': '起動失敗: {message}',
  'cli.usage': '使い方',
  'cli.options': 'オプション',
  'cli.teamDesc': '監視するチーム名 (複数指定可)',
  'cli.dirDesc': 'Claudeディレクトリパス (デフォルト: ~/.claude)',
  'cli.langDesc': 'UI言語 (ko, en, ja, zh)',
  'cli.helpDesc': 'ヘルプを表示',
  'cli.versionDesc': 'バージョンを表示',
  'cli.example': '例',
};

/** 중국어 */
const zh: TranslationMap = {
  'status.completed': '已完成',
  'status.inProgress': '进行中',
  'status.pending': '等待中',
  'duration.seconds': '{count}秒',
  'duration.minutes': '{count}分钟',
  'duration.hours': '{count}小时',
  'duration.hoursMinutes': '{hours}小时{minutes}分钟',
  'timeAgo.seconds': '{count}秒前',
  'timeAgo.minutes': '{count}分钟前',
  'timeAgo.hours': '{count}小时前',
  'app.title': 'CC Team Viewer',
  'app.subtitle': 'Claude Code Agent Teams Monitor',
  'app.quit': '退出',
  'app.watching': '正在监视Agent Teams...',
  'app.watchingHint': '在Claude Code中创建Agent Team后将在此显示。',
  'app.watchingPath': '监视路径: {path}/teams/',
  'view.overview': '概览',
  'view.tasks': '任务',
  'view.messages': '消息',
  'view.deps': '依赖',
  'view.tabHint': '(Tab切换)',
  'sidebar.teamList': '团队 (↑↓)',
  'stats.tasks': '任务',
  'stats.active': '活跃',
  'stats.messages': '消息',
  'stats.elapsed': '经过',
  'agent.sectionTitle': '代理 ({count})',
  'agent.taskProgress': '任务: {completed}/{total} 完成',
  'agent.noAgents': '无代理',
  'task.headerId': 'ID',
  'task.headerTask': '任务',
  'task.headerOwner': '负责人',
  'task.headerStatus': '状态',
  'task.unassigned': '未分配',
  'task.noTasks': '无任务',
  'message.headerFrom': '发送',
  'message.headerTo': '接收',
  'message.headerContent': '内容',
  'message.headerTime': '时间',
  'message.noMessages': '无消息',
  'message.olderOmitted': '... 省略{count}条旧消息',
  'deps.sectionTitle': '任务依赖图',
  'error.claudeDirNotFound': '找不到Claude目录: {path}',
  'error.agentTeamsNotActive': '请确认Agent Teams是否已启用。',
  'error.startFailed': '启动失败: {message}',
  'cli.usage': '用法',
  'cli.options': '选项',
  'cli.teamDesc': '要监视的团队名称 (可多次使用)',
  'cli.dirDesc': 'Claude目录路径 (默认: ~/.claude)',
  'cli.langDesc': '界面语言 (ko, en, ja, zh)',
  'cli.helpDesc': '显示帮助',
  'cli.versionDesc': '显示版本',
  'cli.example': '示例',
};

// ────────────────────────────────────────────────
// 번역 함수
// ────────────────────────────────────────────────

/** 로케일별 번역 맵 */
const TRANSLATIONS: Record<Locale, TranslationMap> = { ko, en, ja, zh };

/**
 * 보간 처리: `{key}` 형식의 플레이스홀더를 params 값으로 치환
 * ReDoS 방지를 위해 replaceAll 사용
 */
export function interpolate(template: string, params?: InterpolationParams): string {
  if (!params) return template;
  let result = template;
  for (const [key, value] of Object.entries(params)) {
    result = result.replaceAll(`{${key}}`, String(value));
  }
  return result;
}

/** 유효한 로케일인지 확인 */
function isValidLocale(value: string): value is Locale {
  return (LOCALE_ORDER as readonly string[]).includes(value);
}

/**
 * 시스템 로케일 자동 감지
 *
 * 우선순위: CC_TEAM_VIEWER_LANG → LANG 환경변수 → Intl API → ko
 */
export function detectLocale(): Locale {
  const ccLang = process.env.CC_TEAM_VIEWER_LANG;
  if (ccLang && isValidLocale(ccLang)) return ccLang;

  const lang = process.env.LANG;
  if (lang) {
    const prefix = lang.split(/[_.\-]/)[0].toLowerCase();
    if (isValidLocale(prefix)) return prefix;
  }

  try {
    const intlLocale = Intl.DateTimeFormat().resolvedOptions().locale;
    const prefix = intlLocale.split(/[_\-]/)[0].toLowerCase();
    if (isValidLocale(prefix)) return prefix;
  } catch {
    // Intl 미지원 환경
  }

  return 'ko';
}

/**
 * i18n 인스턴스 생성 (팩토리)
 *
 * 불변 패턴: setLocale/cycleLocale은 새 인스턴스를 반환
 */
export function createI18n(locale?: Locale): I18nInstance {
  const currentLocale = locale ?? detectLocale();
  const translations = TRANSLATIONS[currentLocale];
  const fallback = TRANSLATIONS.ko;

  const t = (key: keyof TranslationMap, params?: InterpolationParams): string => {
    const template = translations[key] ?? fallback[key] ?? key;
    return interpolate(template, params);
  };

  const setLocale = (newLocale: Locale): I18nInstance => createI18n(newLocale);

  const cycleLocale = (): I18nInstance => {
    const idx = LOCALE_ORDER.indexOf(currentLocale);
    const nextLocale = LOCALE_ORDER[(idx + 1) % LOCALE_ORDER.length];
    return createI18n(nextLocale);
  };

  return { locale: currentLocale, t, setLocale, cycleLocale };
}
