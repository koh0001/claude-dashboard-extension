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
│   └── session-parser.ts        → 세션 JSONL 파싱 (일반 Claude Code 세션)
├── providers/
│   ├── dashboard-provider.ts    → WebView 패널 (TeamSnapshot → HTML)
│   ├── tree-provider.ts         → 사이드바 트리뷰 (팀→에이전트→태스크)
│   ├── activity-feed-provider.ts → Activity Feed 데이터 제공
│   └── file-decoration-provider.ts → AI 기여도 뱃지 (Phase 2)
├── types/
│   ├── messages.ts        → Extension ↔ WebView 메시지 타입 정의
│   └── extended-i18n.ts   → 확장 번역 키 타입
├── views/
│   ├── dashboard-html.ts  → HTML 템플릿 (정적 구조)
│   ├── dashboard-css.ts   → CSS (테마 시스템 + 반응형)
│   └── dashboard-js.ts    → 클라이언트 JS (상태 관리, DOM 조작)
├── i18n/
│   ├── locales/           → ko, en, ja, zh 번역 파일
│   ├── types.ts           → ExtendedTranslationMap
│   └── index.ts           → i18n 팩토리
└── utils/
    ├── escape-html.ts     → XSS 방지
    └── theme-detector.ts  → 테마 모드 감지
```

## 구현 상태

### Phase 1: MVP (현재 개발 중)
- [ ] 프로젝트 스캐폴딩 (package.json, tsconfig, tsup 설정)
- [ ] WatcherService 구현 (core 어댑터)
- [ ] WebView 대시보드 (Overview/Tasks/Messages/Deps 4탭)
- [ ] 트리뷰 사이드바
- [ ] 상태 바
- [ ] 테마 시스템 (다크/라이트/고대비)
- [ ] 다국어 (ko, en, ja, zh)
- [ ] 실시간 알림
- [ ] 워크스페이스 매칭 엔진 (workspaceFolder → ~/.claude/projects/ 해시 매칭)
- [ ] 세션 파일 파싱 (JSONL → 구조화된 활동 데이터)
- [ ] 통합 Activity Feed (파일/커맨드/태스크/메시지 실시간 피드)
- [ ] 미니 대시보드 (상태 바 팝업)

### Phase 2: 향상 기능 (계획)
- [ ] 타임라인 뷰
- [ ] 성능 메트릭 대시보드
- [ ] D3.js 기반 DAG 그래프
- [ ] 검색 및 필터
- [ ] 파일 변경 히트맵 + AI 기여도 뱃지
- [ ] Git Diff 연동 (Co-Authored-By 커밋 식별)
- [ ] TODO/태스크 연동

### Phase 3: 확장 기능 (계획)
- [ ] MCP 서버 연동
- [ ] 알림 시스템 확장 (Slack/Discord)
- [ ] 내보내기 (리포트, CSV)
- [ ] MCP 서버 모드 (대시보드 데이터 노출)
- [ ] AI 활동 요약 리포트

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

환경변수 `CC_TEAM_VIEWER_CLAUDE_DIR`로 ~/.claude/ 경로 오버라이드 가능.

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
- 반응형: `@container` 쿼리 (400px / 600px / 900px 브레이크포인트)

## 다국어(i18n)
- 4개 언어: 한국어(ko, 기본), 영어(en), 일본어(ja), 중국어(zh)
- core의 TranslationMap을 확장한 ExtendedTranslationMap 사용
- 폴백 체인: 현재 로케일 → ko → 키 자체
- 보간 형식: `{key}` (예: `"{count}초 전"` + `{ count: 5 }` → `"5초 전"`)
- 새 키 추가 시 4개 로케일 파일 모두 업데이트 (TypeScript가 누락 검출)

## 코딩 컨벤션
- 모든 주석과 문서는 한국어
- TypeScript strict mode
- ESM (import/export)
- dashboard-js.ts 내부: `var` 사용 (템플릿 리터럴 함수 스코프)
- 에러 핸들링: JSON 파싱 실패 시 graceful skip
- 파일 감시: debounce 100ms

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
