# Claude Flow Monitor — Claude Code Project Context

## 프로젝트 개요
Claude Code의 진행사항과 워크플로우를 실시간 시각화하는 독립 VS Code 확장프로그램. 기존 cc-team-viewer의 Agent Teams 모니터링을 계승하면서, **현재 열린 VS Code 프로젝트에 포커스하여 해당 프로젝트의 Claude Code 활동(세션, 파일 편집, 태스크, 에이전트)을 통합 대시보드로 제공**한다.

## 커맨드

```bash
npm run build          # tsup으로 extension.js 번들
npm run dev            # watch 모드 (개발)
npm run package        # .vsix 패키지 생성
npm test               # vitest watch 모드
npm run test:run       # vitest 1회 실행 (CI용)
npm run lint           # eslint 검사
```

VS Code 확장 디버깅: `F5` (Extension Development Host 실행)

## 아키텍처

독립 VS Code 확장 프로젝트. 핵심 데이터 로직은 `@cc-team-viewer/core` npm 패키지를 의존성으로 사용한다.

```
src/
├── extension.ts           → 진입점 (activate/deactivate)
├── services/
│   ├── watcher-service.ts       → core TeamWatcher 래핑 (VS Code lifecycle)
│   ├── i18n-service.ts          → 확장 i18n 관리
│   ├── workspace-matcher.ts     → 워크스페이스 ↔ 프로젝트 해시 매칭
│   ├── session-parser.ts        → 세션 JSONL 파싱 (일반 Claude Code 세션)
│   ├── git-service.ts           → Git Co-Authored-By 커밋 파싱 (AI 기여도 추적)
│   ├── export-service.ts        → CSV/Markdown 리포트 내보내기
│   ├── webhook-service.ts       → Slack/Discord 웹훅 알림 전송
│   └── mcp-service.ts           → MCP 서버 연동 및 데이터 노출 API
├── providers/
│   ├── dashboard-provider.ts    → WebView 패널 (메시지 큐, 상한 100개)
│   ├── tree-provider.ts         → 사이드바 트리뷰 (팀→에이전트→태스크)
│   ├── activity-feed-provider.ts → Activity Feed 집계 (최대 200개)
│   ├── file-decoration-provider.ts → AI 수정 파일 뱃지 (FileDecorationProvider)
│   └── sidebar-dashboard-provider.ts → 사이드바 미니 대시보드 (WebviewView)
├── types/
│   └── messages.ts        → Extension ↔ WebView 메시지 타입 (discriminated union)
├── views/
│   ├── dashboard-html.ts  → HTML 템플릿 (nonce CSP, 7탭 + 검색 바)
│   ├── dashboard-css.ts   → CSS (적응형 테마 + Stitch 기반 + 반응형 + 타임라인/메트릭)
│   └── dashboard-js.ts    → 클라이언트 JS (상태 관리, DOM 조작, 검색 필터)
├── i18n/
│   ├── locales/           → ko, en, ja, zh 번역 파일 (각 86키)
│   ├── types.ts           → ExtendedTranslationMap + WEBVIEW_TRANSLATION_KEYS
│   └── index.ts           → i18n 팩토리 (core 확장, 폴백 체인)
└── utils/
    ├── escape-html.ts     → XSS 방지 (문자열 치환)
    └── theme-detector.ts  → 테마 모드 감지 (DashboardProvider에서 사용)
```

### 데이터 흐름
```
파일 변경 → core TeamWatcher → WatcherService (이벤트) → DashboardProvider (메시지 큐) → WebView (렌더)
워크스페이스 → WorkspaceMatcher (경로 치환) → SessionParser (JSONL, 루트+sessions/ 폴백) → ActivityFeedProvider → WebView
Git 저장소 → GitService (Co-Authored-By) → AiFileDecorationProvider → Explorer 뱃지
알림 → WatcherService → WebhookService → Slack/Discord 웹훅
내보내기 → ExportService → CSV 파일 / Markdown 에디터 탭
MCP → McpService → HTTP JSON API (localhost) / .mcp.json 파싱
```

## 구현 상태

### Phase 1: MVP
- [x] 프로젝트 스캐폴딩 (package.json, tsconfig, tsup, eslint, vitest)
- [x] WatcherService 구현 (core 어댑터, 중복 리스너 가드)
- [x] WebView 대시보드 (Overview/Tasks/Messages/Deps/Activity/Timeline/Metrics 7탭)
- [x] 트리뷰 사이드바 (팀→에이전트→태스크 계층)
- [x] 상태 바 (팀명 + 완료율, 퀵피크)
- [x] 테마 시스템 (다크/라이트/고대비/고대비라이트 4모드 + 적응형)
- [x] 다국어 (ko, en, ja, zh — 49키 완전 커버)
- [x] 실시간 알림 (taskCompleted, agentJoined, agentLeft)
- [x] 워크스페이스 매칭 엔진 (SHA-256 해시 + .project 파일 폴백)
- [x] 세션 파일 파싱 (JSONL → 구조화된 활동 데이터)
- [x] 통합 Activity Feed (파일/커맨드/태스크/메시지 실시간 피드, 최대 200개)
- [x] 미니 대시보드 (상태 바 Markdown tooltip — 세션/파일/태스크/최근활동)
- [x] 칸반 뷰 (Table/Kanban 토글, 3열 보드, blocker 표시)
- [x] 사이드바 미니 대시보드 (WebviewView — 메트릭, 최근 활동, 빠른 액션)
- [x] 브랜딩 아이콘 (Stitch 디자인 시스템 기반 — 사이드바/로고 SVG)

### Phase 2: 향상 기능
- [x] 타임라인 뷰 (Timeline 탭 — 시간순 이벤트 시각화, 날짜 그룹핑)
- [x] 성능 메트릭 대시보드 (Metrics 탭 — 도넛 차트, 속도 차트, 파일 히트맵)
- [x] SVG 기반 DAG 그래프 (Deps 탭 — 베지에 커브 연결선 + 화살표)
- [x] 검색 및 필터 (전역 검색 바, Ctrl+F 단축키, 탭별 필터링)
- [x] 파일 변경 히트맵 + AI 기여도 뱃지 (FileDecorationProvider, Explorer "AI" 뱃지)
- [x] Git Diff 연동 (Co-Authored-By 커밋 식별, GitService)
- [x] TODO/태스크 연동 (TodoWrite 도구 호출 추적, 활동 피드 통합)

### Phase 3: 확장 기능
- [x] MCP 서버 연동 (McpService — .mcp.json 파싱, 연결 서버 목록 표시)
- [x] 알림 시스템 확장 (WebhookService — Slack/Discord 웹훅 POST)
- [x] 내보내기 (ExportService — CSV 다운로드, Markdown 리포트 생성)
- [x] MCP 서버 모드 (HTTP JSON API — /api/teams, /api/activities, /api/metrics)
- [x] AI 활동 요약 리포트 (ExportService.showReport — 에디터 탭에 Markdown 리포트)

### Phase 4: 분석 기능
- [x] 토큰 사용량 모니터링 (세션 JSONL usage 파싱 — 입력/출력/캐시 집계, Metrics 탭 표시)
- [x] 태스크별 소요시간 + 추정 토큰 (Tasks 탭 — createdAt→completedAt 기반, 시간 구간 토큰 추정)
- [x] 프로젝트 히스토리 저장 (cfm-stats.json — 토큰/활동 누적, 재시작 시 복원)
- [x] 세션 기반 Metrics 대체 (Agent Teams 없을 때 파일편집/커맨드 비율 도넛)
- [x] JSONL 구조 파싱 수정 (assistant→message.content[].tool_use 실제 구조 지원)
- [x] 대용량 JSONL 최적화 (8MB+ 파일 끝 512KB만 읽기, 수정시간순 정렬)

## 코어 의존성

`@cc-team-viewer/core` 패키지에서 제공하는 API:

- **TeamWatcher**: 파일 시스템 감시 (fs.watch + 폴링 폴백)
- **파서**: ConfigParser, TaskParser, InboxParser
- **타입**: TeamConfig, Task, InboxMessage, TeamSnapshot, AgentStatus, TeamStats
- **이벤트**: team:*, task:*, message:*, agent:*, snapshot:updated
- **i18n**: createI18n, detectLocale, TranslationMap
- **유틸리티**: topoSortLayers (DAG 위상 정렬)

## 파일 프로토콜

### 감시 대상
```
~/.claude/teams/{team-name}/config.json       → TeamConfig
~/.claude/tasks/{team-name}/{id}.json         → Task
~/.claude/teams/{team-name}/inboxes/{agent}.json → InboxMessage[]
~/.claude/projects/{hash}/sessions/*.jsonl → SessionActivity[]
```

VS Code 설정 `ccFlowMonitor.claudeDir`로 ~/.claude/ 경로 오버라이드 가능.
환경변수 `CC_TEAM_VIEWER_CLAUDE_DIR`도 core 패키지 레벨에서 지원.

## WebView 보안 컨벤션
- CSP: `script-src 'nonce-{nonce}'`만 허용, `worker-src 'none'` 필수
- DOM 조작: `innerHTML` 금지, `textContent` + DOM API 사용
- 사용자 입력(메시지, 태스크명): `escapeHtml()`로 이스케이프 필수
- 이벤트: `onclick` 속성 대신 `addEventListener` 사용 (CSP 호환)
- `localResourceRoots: []` — 인라인 전략, 로컬 리소스 접근 불필요

## 테마 시스템
- VS Code CSS 커스텀 프로퍼티 (`--vscode-*`) 기반
- 시맨틱 토큰 (`--cfm-*`) 추가 정의
- `data-vscode-theme-kind` 속성으로 다크/라이트/고대비 분기
- 반응형: `@container` 쿼리 (400px / 800px 브레이크포인트)
- 적응형 테마: `--vscode-*` 래핑 → 커스텀 테마 자동 적응 (Dracula, One Dark Pro 등)
- Stitch 디자인: https://stitch.withgoogle.com/projects/11841507411109514040

## 다국어(i18n)
- 4개 언어: 한국어(ko, 기본), 영어(en), 일본어(ja), 중국어(zh) — 86키
- core의 TranslationMap을 확장한 ExtendedTranslationMap 사용
- 폴백 체인: 현재 로케일 → ko → 키 자체
- 보간 형식: `{key}` (예: `"{count}초 전"` + `{ count: 5 }` → `"5초 전"`)
- 새 키 추가 시 4개 로케일 파일 모두 업데이트 (TypeScript가 누락 검출)

## 코딩 컨벤션
- 모든 주석과 문서는 한국어
- TypeScript strict mode, `moduleResolution: "bundler"` (tsup 기반)
- ESM (import/export)
- dashboard-js.ts 내부: `var` 사용 (템플릿 리터럴 함수 스코프)
- 에러 핸들링: JSON 파싱 실패 시 graceful skip
- 파일 감시: debounce 100ms
- WebView 메시지: 타입 허용 목록 검증 필수 (`ALLOWED_MSG_TYPES`)
- 입력 검증: teamName 등 경로에 쓰이는 값은 `/\.\x00` 필터링
- 시간 표시: HH:MM:SS 기본, `ccFlowMonitor.timeFormat` 설정으로 변경 가능
- Duration: MM:SS / H:MM:SS 형식 (분:초 단위)

## 테스트
- vitest + `src/__mocks__/vscode.ts` (VS Code API 모킹)
- 현재 커버리지: escape-html (7), i18n 키 일관성 (5), session-parser (5), 총 17개
- 테스트 실행: `npm run test:run` (CI), `npm test` (watch)

## Gotchas
- `@cc-team-viewer/core`는 ESM 패키지 → tsconfig에서 `moduleResolution: "bundler"` 필수
- WebView 내부 JS에서 `innerHTML` 절대 금지 — 문자열 치환 `escapeHtml()` 사용
- Provider를 `context.subscriptions`에 push 해야 dispose 됨 (등록 결과만으로 부족)
- `WatcherService.start()`는 `started` 가드로 중복 호출 방지됨

## 참고 문서
- [PRD (기획안)](docs/plans/01-PRD.md)
- [현황 분석](docs/plans/00-current-status-analysis.md)
- [UI/UX 디자인 가이드](docs/design/01-ui-ux-design-guide.md)
- [i18n 설계](docs/design/02-i18n-design.md)
- [기술 아키텍처](docs/dev-guide/01-architecture.md)
- [개발 가이드](docs/dev-guide/02-development-guide.md)
- [기능 브레인스토밍](docs/plans/02-feature-brainstorm.md)

## 원본 프로젝트
- cc-team-viewer: https://github.com/koh0001/cc-team-viewer
- Agent Teams 공식 문서: https://code.claude.com/docs/en/agent-teams
