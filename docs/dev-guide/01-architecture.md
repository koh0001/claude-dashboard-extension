# Claude Flow Monitor — 기술 아키텍처 문서

> 버전: 1.2.0-draft
> 작성일: 2026-03-26
> 최종 수정일: 2026-03-26

## 1. 시스템 아키텍처

### 1.1 전체 구조

```
┌─────────────────────────────────────────────────────────────┐
│                    Claude Code Agent Teams                    │
│  Team Lead ──spawn──▶ Agent A ◀──inbox──▶ Agent B           │
│      └──── config.json + inboxes/ + tasks/                   │
└─────────────────┬───────────────────────────────────────────┘
                  │ (파일 시스템 감시)
                  ▼
┌─────────────────────────────────────────────────────────────┐
│              @cc-team-viewer/core (npm 패키지)                │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐    │
│  │ TeamWatcher  │  │  Parsers     │  │  Types          │    │
│  │ (fs.watch)   │──│  config/task │──│  TeamSnapshot   │    │
│  │ EventEmitter │  │  /inbox      │  │  Task/Message   │    │
│  └──────┬───────┘  └──────────────┘  └─────────────────┘    │
│         │ events: team:*, task:*, message:*, snapshot:*      │
└─────────┼───────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│              Claude Flow Monitor (독립 VS Code 확장)          │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Service Layer                                        │    │
│  │  ┌─────────────────┐  ┌────────────────────────┐   │    │
│  │  │ WatcherService   │  │ ExtendedI18nService    │   │    │
│  │  │ (core 어댑터)    │  │ (확장 번역 관리)       │   │    │
│  │  └────────┬────────┘  └────────────────────────┘   │    │
│  │  ┌─────────────────────┐  ┌──────────────────────┐ │    │
│  │  │WorkspaceMatcherSvc  │  │ SessionParserService │ │    │
│  │  │(워크스페이스↔프로젝 │  │ (세션 JSONL 파싱)    │ │    │
│  │  │ 트 해시 매칭)       │  └──────────────────────┘ │    │
│  │  └─────────────────────┘  ┌──────────────────────┐ │    │
│  │                            │ GitIntegrationSvc   │ │    │
│  │                            │ (Claude 커밋 식별)  │ │    │
│  │                            │ (Phase 2)           │ │    │
│  │                            └──────────────────────┘ │    │
│  └───────────┼─────────────────────────────────────────┘    │
│              │                                               │
│  ┌───────────┼─────────────────────────────────────────┐    │
│  │ Provider Layer                                       │    │
│  │  ┌────────┴────────┐  ┌─────────────┐              │    │
│  │  │ DashboardProvider│  │ TreeProvider │              │    │
│  │  │ (WebView 관리)   │  │ (사이드바)   │              │    │
│  │  └────────┬────────┘  └─────────────┘              │    │
│  └───────────┼─────────────────────────────────────────┘    │
│              │                                               │
│  ┌───────────┼─────────────────────────────────────────┐    │
│  │ View Layer (WebView 내부)                            │    │
│  │  ┌────────┴──────────────────────────────────────┐  │    │
│  │  │  ┌──────────┐ ┌──────────┐ ┌───────────────┐ │  │    │
│  │  │  │ Renderer │ │  Theme   │ │ i18n Client   │ │  │    │
│  │  │  │ Modules  │ │  Engine  │ │               │ │  │    │
│  │  │  └──────────┘ └──────────┘ └───────────────┘ │  │    │
│  │  └───────────────────────────────────────────────┘  │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 디렉토리 구조

```
claude-flow-monitor/
├── .vscode/
│   ├── launch.json            # F5 디버깅 설정
│   └── tasks.json             # 빌드 태스크
├── docs/
│   ├── plans/                 # 기획 문서
│   │   ├── 00-current-status-analysis.md
│   │   └── 01-PRD.md
│   ├── design/                # 디자인 문서
│   │   ├── 01-ui-ux-design-guide.md
│   │   └── 02-i18n-design.md
│   └── dev-guide/             # 개발 가이드
│       ├── 01-architecture.md (이 문서)
│       └── 02-development-guide.md
├── src/
│   ├── extension.ts           # 진입점 (activate/deactivate)
│   ├── services/
│   │   ├── watcher-service.ts    # core TeamWatcher 래핑
│   │   ├── i18n-service.ts       # 확장 i18n 관리
│   │   ├── workspace-matcher.ts  # 워크스페이스 ↔ 프로젝트 매칭
│   │   ├── session-parser.ts     # 세션 JSONL 파싱
│   │   └── git-integration.ts    # Git Claude 커밋 식별 (Phase 2)
│   ├── providers/
│   │   ├── dashboard-provider.ts      # WebView 패널 관리
│   │   ├── tree-provider.ts           # 사이드바 트리뷰
│   │   ├── activity-feed-provider.ts  # Activity Feed 데이터 제공
│   │   └── file-decoration-provider.ts # AI 기여도 뱃지 (Phase 2)
│   ├── types/
│   │   ├── messages.ts        # Extension ↔ WebView 메시지 타입
│   │   └── extended-i18n.ts   # 확장 번역 키 타입
│   ├── views/
│   │   ├── dashboard-html.ts  # HTML 템플릿 (정적 구조)
│   │   ├── dashboard-css.ts   # CSS (테마 시스템 포함)
│   │   └── dashboard-js.ts    # 클라이언트 JS (모듈화)
│   ├── i18n/
│   │   ├── locales/
│   │   │   ├── ko.ts          # 한국어 (기준)
│   │   │   ├── en.ts          # 영어
│   │   │   ├── ja.ts          # 일본어
│   │   │   └── zh.ts          # 중국어
│   │   ├── types.ts           # 확장 TranslationMap
│   │   └── index.ts           # i18n 팩토리
│   └── utils/
│       ├── escape-html.ts     # XSS 방지
│       └── theme-detector.ts  # 테마 모드 감지
├── images/
│   └── Logo.png               # 확장 아이콘
├── CLAUDE.md                  # Claude Code 프로젝트 컨텍스트
├── README.md                  # 프로젝트 설명 (영어)
├── README.ko.md               # 한국어 README
├── CHANGELOG.md               # 변경 이력
├── package.json               # VS Code 확장 매니페스트
├── tsconfig.json              # TypeScript 설정
└── tsup.config.ts             # 번들러 설정
```

## 2. 핵심 모듈 설계

### 2.1 Extension Entry (extension.ts)

```typescript
// 라이프사이클
export function activate(context: vscode.ExtensionContext) {
  // 1. WatcherService 초기화 (싱글톤)
  // 2. I18nService 초기화 (로케일 감지)
  // 3. DashboardProvider 등록
  // 4. TreeProvider 등록
  // 5. StatusBar 생성
  // 6. Commands 등록
  // 7. Configuration 리스너 등록
}

export function deactivate() {
  // WatcherService.dispose() → 파일 감시 정리
}
```

### 2.2 WatcherService

기존 cc-team-viewer의 WatcherService를 계승하되 다음을 개선한다:

```typescript
class WatcherService implements vscode.Disposable {
  // 개선 1: 구조적 diff (JSON.stringify 대신)
  private hasSnapshotChanged(prev: TeamSnapshot, next: TeamSnapshot): boolean {
    // stats 비교 → tasks 수/상태 비교 → messages 수 비교
    // 전체 직렬화 대신 핵심 필드만 비교하여 성능 향상
  }

  // 개선 2: 이벤트 배치 처리
  private batchedEmit(events: WatcherEvent[]): void {
    // 100ms 윈도우 내 이벤트를 배치하여 한 번에 UI 갱신
  }

  // 개선 3: 타입 안전 이벤트
  readonly onUpdate: vscode.Event<{ teamName: string; snapshot: TeamSnapshot }>;
  readonly onRemove: vscode.Event<string>;
  readonly onNotification: vscode.Event<NotificationPayload>;
}
```

### 2.3 DashboardProvider

```typescript
class DashboardProvider implements vscode.WebviewViewProvider {
  // 개선 1: 메시지 큐 + 핸드셰이크 패턴 유지
  // 개선 2: 선별적 번역 키 전달 (WebView용 키만)
  // 개선 3: 스냅샷 페이로드 직렬화 최적화

  private toSnapshotPayload(snapshot: TeamSnapshot): SnapshotPayload {
    // 메시지 최대 50개 제한
    // 에이전트 상세 정보 flatten
    // 순환 참조 방지
  }
}
```

### 2.4 WebView 클라이언트 (dashboard-js.ts) 모듈 구조

기존의 975줄 단일 파일을 논리적 섹션으로 구조화한다. 여전히 인라인 스크립트이지만, 코드 내부에서 모듈 패턴을 적용한다:

```javascript
// === 1. State Management ===
var state = { ... };
function getState() { ... }
function updateState(partial) { ... }

// === 2. Message Handler ===
function handleMessage(event) { ... }

// === 3. Theme Engine ===
function detectThemeMode() { ... }
function applyThemeOverrides() { ... }

// === 4. Renderers ===
// 4a. Stats Bar
function renderStatsBar(snap) { ... }

// 4b. Overview Tab
function renderOverview(snap) { ... }
function renderAgentCard(agent) { ... }
function renderAgentDetail(agent) { ... }

// 4c. Tasks Tab
function renderTasks(snap) { ... }
function renderTaskTable(tasks) { ... }
function renderTaskKanban(tasks) { ... }
function renderTaskDetail(task) { ... }

// 4d. Messages Tab
function renderMessages(snap) { ... }
function groupIntoThreads(messages) { ... }
function renderThread(thread) { ... }

// 4e. Deps Tab
function renderDeps(snap) { ... }
function renderDagGraph(tasks) { ... }

// === 5. i18n Client ===
function t(key, params) { ... }

// === 6. Utilities ===
function escapeHtml(text) { ... }
function formatDuration(ms) { ... }
function timeAgo(timestamp) { ... }

// === 7. Event Binding ===
function bindEvents() { ... }

// === 8. Init ===
function init() { ... }
```

### 2.5 WorkspaceMatcherService

```typescript
class WorkspaceMatcherService implements vscode.Disposable {
  // 핵심: workspaceFolder 절대 경로 → ~/.claude/projects/ 해시 디렉토리 매칭
  // Claude Code는 프로젝트 경로를 SHA-256 해시하여 디렉토리명으로 사용

  matchWorkspace(workspaceFolder: vscode.Uri): ProjectMatch | null;

  // 매칭 결과
  interface ProjectMatch {
    workspacePath: string;       // VS Code 워크스페이스 경로
    claudeProjectDir: string;    // ~/.claude/projects/{hash} 절대 경로
    sessionsDir: string;         // sessions/ 하위 경로
    teamsDir: string;            // teams/ 하위 경로 (Agent Teams용)
  }

  // 매칭 실패 시 사용자에게 수동 선택 UI 제공
  readonly onMatchFailed: vscode.Event<string>;
}
```

### 2.6 SessionParserService

```typescript
class SessionParserService implements vscode.Disposable {
  // 세션 JSONL 파일을 파싱하여 구조화된 활동 데이터 생성
  // 실시간 감시: fs.watch로 새 줄 추가 감지

  watchSession(sessionPath: string): void;
  parseSessionFile(path: string): SessionActivity[];

  interface SessionActivity {
    timestamp: number;
    type: 'tool_call' | 'file_edit' | 'command' | 'error' | 'message';
    detail: ToolCallDetail | FileEditDetail | CommandDetail | ErrorDetail;
  }

  interface FileEditDetail {
    filePath: string;
    linesAdded: number;
    linesRemoved: number;
  }

  readonly onActivity: vscode.Event<SessionActivity>;
}
```

## 3. 데이터 흐름

### 3.1 초기화 시퀀스

```
1. VS Code 활성화
   └─▶ extension.ts:activate()

2. WatcherService 시작
   └─▶ core TeamWatcher.start()
   └─▶ ~/.claude/ 디렉토리 스캔
   └─▶ 초기 스냅샷 생성

3. 사용자 대시보드 열기 (커맨드 또는 사이드바 클릭)
   └─▶ DashboardProvider.show()
   └─▶ WebView HTML 생성 (nonce 포함)
   └─▶ WebView 로드 시작

4. WebView ready
   └─▶ WebView → Extension: { type: "ready" }
   └─▶ Extension → WebView: { type: "init", teams, translations, locale }
   └─▶ WebView: renderAll()
```

### 3.2 실시간 업데이트 흐름

```
파일 변경 (에이전트가 JSON 파일 수정)
  └─▶ core TeamWatcher: fs.watch/polling 감지
  └─▶ debounce 100ms
  └─▶ scanAll() → 새 스냅샷 생성
  └─▶ 변경 감지 → "snapshot:updated" 이벤트
  └─▶ WatcherService.onUpdate 발행
  └─▶ DashboardProvider: postMessage({ type: "snapshotUpdate", ... })
  └─▶ WebView: handleMessage → updateState → renderCurrentTab
```

### 3.3 언어 전환 흐름

```
사용자 액션 (UI 버튼 클릭 또는 Settings 변경)
  └─▶ WebView → Extension: { type: "changeLanguage" }
  └─▶ I18nService.cycleLocale()
  └─▶ 새 번역 맵 생성
  └─▶ Extension → WebView: { type: "translationsUpdate", translations, locale }
  └─▶ WebView: state.translations = newTranslations → renderAll()
```

### 3.4 에러 복구 흐름

세 가지 주요 에러 시나리오에 대한 복구 전략을 정의한다.

#### 시나리오 1: 파일 파싱 실패

에이전트가 JSON 파일을 부분적으로 기록하거나 잘못된 형식으로 저장한 경우의 복구 흐름.

```
파일 변경 감지 (fs.watch)
  │
  ▼
JSON.parse() 시도
  │
  ├─ 성공 ──▶ 정상 스냅샷 갱신
  │
  └─ 실패 (SyntaxError)
       │
       ▼
     에러 로깅 (console.warn)
       │
       ▼
     해당 파일 건너뛰기 (graceful skip)
       │
       ▼
     이전 유효 스냅샷 유지
       │
       ▼
     다음 파일 변경 시 재시도
       │
       ├─ 성공 ──▶ 스냅샷 갱신 (자동 복구)
       └─ 3회 연속 실패 ──▶ 알림 표시
            └─▶ "파일 형식 오류: {파일명}" 경고
```

#### 시나리오 2: 디렉토리 미존재

`~/.claude/teams/` 또는 `~/.claude/tasks/` 디렉토리가 아직 생성되지 않은 경우의 복구 흐름.

```
WatcherService 시작
  │
  ▼
감시 대상 디렉토리 확인
  │
  ├─ 존재 ──▶ fs.watch 등록 → 정상 감시 시작
  │
  └─ 미존재 (ENOENT)
       │
       ▼
     폴링 모드 전환 (5초 간격)
       │
       ▼
     "대기 중" 상태 표시 (상태 바 + 대시보드)
       │
       ▼
     ┌──────────────────────────┐
     │  5초마다 디렉토리 존재 확인  │◀──┐
     └────────────┬─────────────┘    │
                  │                    │
                  ├─ 미존재 ───────────┘
                  │
                  └─ 존재 확인됨
                       │
                       ▼
                     fs.watch 등록 → 폴링 중단
                       │
                       ▼
                     초기 스캔 실행 → 스냅샷 생성
                       │
                       ▼
                     "활성" 상태 전환 → UI 갱신
```

#### 시나리오 3: WebView 통신 오류

Extension과 WebView 간 메시지 전달이 실패한 경우의 복구 흐름.

```
Extension: postMessage() 호출
  │
  ├─ WebView 활성 ──▶ 정상 메시지 전달
  │
  └─ WebView 비활성 또는 disposed
       │
       ▼
     메시지 큐에 적재 (최대 100건, FIFO)
       │
       ▼
     ┌─────────────────────────────────────┐
     │  WebView 상태 감시                    │
     │                                       │
     │  ├─ WebView 재활성화                  │
     │  │    └─▶ "ready" 핸드셰이크 수신     │
     │  │         │                          │
     │  │         ▼                          │
     │  │    큐 drain: 적재된 메시지 순차 전송  │
     │  │         │                          │
     │  │         ▼                          │
     │  │    최신 스냅샷 재전송 (동기화 보장)   │
     │  │                                    │
     │  └─ 큐 overflow (100건 초과)           │
     │       └─▶ 오래된 메시지 폐기           │
     │       └─▶ 최신 스냅샷만 보존           │
     └─────────────────────────────────────┘

     WebView dispose 시:
       └─▶ 큐 전체 초기화
       └─▶ 리소스 해제
       └─▶ 다음 show() 호출 시 새 WebView 생성
```

### 3.5 프로젝트 스코핑 흐름

```
VS Code 활성화
  └─▶ WorkspaceMatcherService.matchWorkspace(workspaceFolder)
  └─▶ SHA-256(absolutePath) → ~/.claude/projects/{hash}/ 탐색
  └─▶ 매칭 성공 → ProjectMatch 생성
      ├─▶ WatcherService: teamsDir만 감시 (기존 Agent Teams)
      ├─▶ SessionParserService: sessionsDir 감시 (일반 세션)
      └─▶ DashboardProvider: 프로젝트 스코프 데이터만 표시
  └─▶ 매칭 실패 → 수동 선택 QuickPick UI
```

## 4. Extension ↔ WebView 메시지 프로토콜

### 4.1 Extension → WebView

| type | 페이로드 | 용도 |
|------|----------|------|
| `init` | `{ teams, translations, selectedTeam, locale }` | 초기 로드 |
| `snapshotUpdate` | `{ teamName, data: SnapshotPayload }` | 실시간 스냅샷 갱신 |
| `teamRemoved` | `{ teamName }` | 팀 삭제 |
| `translationsUpdate` | `{ translations, locale }` | 언어 변경 |
| `error` | `{ message }` | 에러 표시 |

### 4.2 WebView → Extension

| type | 페이로드 | 용도 |
|------|----------|------|
| `ready` | (없음) | WebView DOM 준비 완료 |
| `selectTeam` | `{ teamName }` | 팀 선택 |
| `refresh` | (없음) | 새로고침 요청 |
| `changeTab` | `{ tab }` | 탭 전환 알림 |
| `changeLanguage` | (없음) | 다음 언어로 순환 |

## 5. 보안 모델

### 5.1 Content Security Policy (CSP)

```
default-src 'none';
script-src 'nonce-{random32}';
style-src 'nonce-{random32}';
font-src ${webview.cspSource};
img-src ${webview.cspSource} data:;
worker-src 'none';
```

### 5.2 DOM 보안 규칙

| 규칙 | 설명 |
|------|------|
| innerHTML 금지 | textContent + DOM API만 사용 |
| escapeHtml() 필수 | 사용자 입력 (메시지, 태스크명) |
| onclick 금지 | addEventListener만 사용 (CSP 호환) |
| eval 금지 | 동적 코드 실행 차단 |

### 5.3 파일 접근 제한

```typescript
webviewOptions: {
  localResourceRoots: [],  // 인라인 전략: 로컬 리소스 접근 불필요
  enableScripts: true,     // nonce 기반 스크립트만 허용
}
```

## 6. 성능 최적화 전략

### 6.1 렌더링 최적화

| 전략 | 설명 |
|------|------|
| Dirty Tab 패턴 | 활성 탭만 렌더, 나머지 dirty 마킹 |
| 구조적 Diff | JSON.stringify 대신 핵심 필드 비교 |
| 가상 스크롤 | 메시지 리스트 > 100건 시 적용 (Phase 2) |
| DOM 재사용 | 요소 삭제/생성 대신 속성 업데이트 우선 |
| requestAnimationFrame | DOM 배치 업데이트 |

### 6.2 데이터 최적화

| 전략 | 설명 |
|------|------|
| 메시지 50개 제한 | 최근 50개만 WebView에 전달 |
| 이벤트 배치 | 100ms 윈도우 내 이벤트 묶어 처리 |
| 번역 키 선별 | WebView에 필요한 키만 전달 (37개) |
| 스냅샷 캐싱 | Map<teamName, snapshot> 유지 |

### 6.3 번들 최적화

```typescript
// tsup.config.ts
export default defineConfig({
  entry: ['src/extension.ts'],
  format: ['cjs'],
  target: 'node20',
  external: ['vscode'],
  treeshake: true,
  minify: true,
  // dashboard 뷰 파일은 별도 번들링 없이 템플릿 리터럴로 인라인
});
```

## 7. 테스트 전략

### 7.1 단위 테스트 (vitest)

| 대상 | 테스트 내용 |
|------|-------------|
| i18n/locales/*.ts | 모든 로케일의 키 완전성 검증 |
| utils/escape-html.ts | XSS 벡터 이스케이프 검증 |
| types/messages.ts | 페이로드 직렬화/역직렬화 |
| services/watcher-service.ts | 이벤트 발행 로직 (core mock) |

### 7.2 통합 테스트

| 대상 | 테스트 내용 |
|------|-------------|
| DashboardProvider | WebView 생성 + 메시지 핸드셰이크 |
| TreeProvider | 트리 아이템 생성 + 갱신 |
| Extension lifecycle | activate/deactivate 정상 동작 |

### 7.3 E2E 테스트 (Phase 2)

VS Code Extension Host에서 실제 확장을 로드하여 대시보드 인터랙션 검증.

## 8. 빌드 및 배포

### 8.1 빌드 커맨드

```bash
npm run build          # tsup으로 extension.js 번들
npm run dev            # watch 모드
npm run package        # .vsix 패키지 생성
npm run test           # vitest 실행
npm run lint           # eslint 검사
```

### 8.2 CI/CD 파이프라인 (GitHub Actions)

```yaml
# .github/workflows/ci.yml
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npm run lint
      - run: npm run test:run
      - run: npm run build
      - run: npm run package
```

### 8.3 VS Code Marketplace 배포

```bash
# 수동 배포
npx vsce publish

# 자동 배포 (CI)
npx vsce publish -p $VSCE_TOKEN
```

## 9. 환경 설정

### 9.1 개발 환경 설정

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Extension Host",
      "type": "extensionHost",
      "request": "launch",
      "args": ["--extensionDevelopmentPath=${workspaceFolder}"],
      "preLaunchTask": "build"
    }
  ]
}
```

### 9.2 환경 변수

| 변수 | 용도 | 기본값 |
|------|------|--------|
| `CC_TEAM_VIEWER_CLAUDE_DIR` | ~/.claude 디렉토리 오버라이드 | `$HOME/.claude` |
| `CC_TEAM_VIEWER_LANG` | 언어 강제 지정 | (자동 감지) |

## 10. 의존성 관리

### 10.1 런타임 의존성

| 패키지 | 버전 | 용도 |
|--------|------|------|
| @cc-team-viewer/core | ^0.1.0 | 파일 감시, 파싱, 타입, i18n |

### 10.2 개발 의존성

| 패키지 | 버전 | 용도 |
|--------|------|------|
| @types/vscode | ^1.90.0 | VS Code API 타입 |
| @vscode/vsce | ^3.0.0 | 확장 패키징 |
| tsup | ^8.0.0 | 번들러 |
| typescript | ^5.6.0 | TypeScript 컴파일러 |
| vitest | ^2.0.0 | 테스트 프레임워크 |
| eslint | ^9.0.0 | 린터 |

### 10.3 core 패키지 참조 방식

**Option A**: npm registry에서 설치 (배포 후)
```json
{ "dependencies": { "@cc-team-viewer/core": "^0.1.0" } }
```

**Option B**: 로컬 경로 참조 (개발 중)
```json
{ "dependencies": { "@cc-team-viewer/core": "file:../cc-team-viewer/packages/core" } }
```

**Option C**: Git submodule 또는 Git URL
```json
{ "dependencies": { "@cc-team-viewer/core": "github:koh0001/cc-team-viewer#main" } }
```

초기 개발 시 Option B, 안정화 후 Option A로 전환을 권장한다.

## 11. 아키텍처 결정 기록 (ADR)

### ADR-001: core 패키지를 npm 의존성으로 사용

**상태**: 채택됨 (2026-03-26)

#### 컨텍스트

Claude Flow Monitor는 기존 cc-team-viewer 프로젝트의 파일 감시, 파싱, 타입 정의 로직을 재사용해야 한다. 코드 공유 방식으로 모노레포 내부 참조, Git submodule, npm 패키지 등 여러 선택지가 존재한다.

#### 결정

`@cc-team-viewer/core`를 독립 npm 패키지로 발행하고, Claude Flow Monitor에서 일반 npm 의존성(`dependencies`)으로 설치하여 사용한다.

#### 근거

- **독립적 릴리스 사이클**: core와 확장의 버전을 독립적으로 관리할 수 있어 배포 유연성이 높다.
- **명확한 계약**: npm 패키지 경계가 곧 API 계약이 되어, core의 내부 구현 변경이 확장에 영향을 주지 않는다.
- **빌드 단순화**: 모노레포 도구(Turborepo, Nx 등) 없이 표준 `npm install`만으로 의존성 해결이 가능하다.
- **기여자 진입 장벽 감소**: 별도 저장소 클론이나 심볼릭 링크 설정 없이 바로 개발을 시작할 수 있다.

#### 대안

| 대안 | 장점 | 기각 사유 |
|------|------|-----------|
| 모노레포 (workspace 참조) | 코드 변경 즉시 반영 | 모노레포 도구 의존성 추가, 빌드 복잡도 증가 |
| Git submodule | 특정 커밋 고정 가능 | submodule 관리 번거로움, CI 설정 복잡화 |
| 소스 코드 복사 | 의존성 없음 | 코드 중복, 동기화 비용 발생, 버그 수정 누락 위험 |

#### 결과

- 개발 초기에는 로컬 경로 참조(`file:../cc-team-viewer/packages/core`)로 빠른 이터레이션을 진행한다.
- core가 안정화되면 npm registry에 발행하고 시맨틱 버저닝으로 의존성을 관리한다.
- core의 breaking change 시 확장 측에서 마이그레이션 작업이 필요하다.

---

### ADR-002: WebView 인라인 전략 (별도 번들 대신 템플릿 리터럴)

**상태**: 채택됨 (2026-03-26)

#### 컨텍스트

VS Code WebView에 HTML/CSS/JS를 전달하는 방식으로 (1) 별도 파일을 번들링하여 URI로 로드하는 방식과 (2) 템플릿 리터럴로 인라인하는 방식이 있다. 대시보드의 HTML, CSS, JS를 어떻게 WebView에 전달할지 결정해야 한다.

#### 결정

HTML 구조(`dashboard-html.ts`), CSS(`dashboard-css.ts`), JavaScript(`dashboard-js.ts`)를 각각 TypeScript 파일에서 템플릿 리터럴(backtick string)로 정의하고, `DashboardProvider`에서 조합하여 하나의 HTML 문서를 생성한다. 별도 번들러나 로컬 리소스 로딩 없이 인라인 전략을 사용한다.

#### 근거

- **보안 강화**: `localResourceRoots: []`로 설정하여 WebView의 로컬 파일 시스템 접근을 완전히 차단한다. 공격 표면을 최소화한다.
- **빌드 단순화**: WebView용 별도 번들 파이프라인(webpack, vite 등)이 불필요하다. tsup 하나로 전체 빌드가 완결된다.
- **CSP nonce 주입 용이**: 템플릿 리터럴 내에서 `${nonce}`를 직접 삽입할 수 있어 nonce 기반 CSP 적용이 간편하다.
- **디버깅 편의성**: 확장 호스트에서 WebView HTML 전체를 문자열로 확인할 수 있어 문제 진단이 용이하다.

#### 대안

| 대안 | 장점 | 기각 사유 |
|------|------|-----------|
| 별도 번들 (webpack/vite) | HMR 지원, 소스맵 | 빌드 복잡도 증가, 추가 번들러 의존성 |
| 외부 HTML 파일 로드 | 파일 분리 명확 | localResourceRoots 허용 필요, 보안 약화 |
| iframe + 외부 서버 | 완전한 웹앱 개발 경험 | 네트워크 의존성, 오프라인 불가, 보안 위험 |

#### 결과

- `dashboard-html.ts`, `dashboard-css.ts`, `dashboard-js.ts` 세 파일로 관심사를 분리하되 물리적으로는 인라인된다.
- JS 파일 내부에서 `var` 키워드를 사용하여 함수 스코프 문제를 회피한다 (템플릿 리터럴 내부 특성).
- 코드 규모가 커지면(2,000줄 이상) 파일 분할 및 빌드 시 결합 전략으로 전환을 재검토한다.

---

### ADR-003: CSS 커스텀 프로퍼티 기반 테마 (JS 런타임 테마 대신)

**상태**: 채택됨 (2026-03-26)

#### 컨텍스트

VS Code WebView에서 다크/라이트/고대비 테마를 지원해야 한다. 테마 전환 방식으로 (1) JavaScript로 런타임에 클래스/스타일을 토글하는 방식과 (2) CSS 커스텀 프로퍼티(`--vscode-*` 변수)를 활용하는 방식이 있다.

#### 결정

VS Code가 제공하는 CSS 커스텀 프로퍼티(`--vscode-editor-background`, `--vscode-foreground` 등)를 기반으로 시맨틱 토큰(`--cfm-*`)을 정의하고, `data-vscode-theme-kind` 속성으로 테마별 분기를 CSS에서 처리한다. JavaScript 런타임 테마 엔진은 사용하지 않는다.

#### 근거

- **VS Code 네이티브 통합**: VS Code가 테마 변경 시 자동으로 CSS 변수를 갱신하므로 추가 이벤트 리스너나 JS 로직이 불필요하다.
- **성능 우위**: CSS 엔진이 변수 변경을 처리하므로 JavaScript 실행 비용이 없다. 리페인트만 발생하여 FOUC(Flash of Unstyled Content)가 없다.
- **유지보수 용이**: 테마 관련 로직이 CSS 한 곳에 집중되어 JS와 CSS 간 동기화 문제가 발생하지 않는다.
- **고대비 테마 자동 지원**: `data-vscode-theme-kind="vscode-high-contrast"` 셀렉터만 추가하면 고대비 모드를 쉽게 지원한다.

#### 대안

| 대안 | 장점 | 기각 사유 |
|------|------|-----------|
| JS 런타임 테마 토글 | 동적 테마 생성 가능 | 불필요한 복잡도, FOUC 위험, 성능 저하 |
| CSS-in-JS (styled-components 등) | 컴포넌트 스코프 스타일 | 번들 크기 증가, 인라인 전략과 비호환 |
| Tailwind CSS 다크모드 | 유틸리티 클래스 편의 | 빌드 의존성 추가, WebView 인라인과 비호환 |

#### 결과

- `dashboard-css.ts`에서 `--cfm-*` 시맨틱 토큰을 `--vscode-*` 변수로 매핑하여 정의한다.
- `data-vscode-theme-kind` 속성 기반으로 다크(`vscode-dark`), 라이트(`vscode-light`), 고대비(`vscode-high-contrast`, `vscode-high-contrast-light`) 4가지 모드를 지원한다.
- 커스텀 테마가 필요해지는 경우(사용자 지정 색상 등) JS 기반 오버라이드 레이어 추가를 재검토한다.

---

### ADR-004: 프로젝트 스코핑을 워크스페이스 매칭으로 구현

**상태**: 채택됨 (2026-03-26)

#### 컨텍스트

사용자가 여러 프로젝트를 동시에 열 수 있고, Claude Code 데이터는 전역 `~/.claude/`에 저장된다. 각 VS Code 워크스페이스에서 해당 프로젝트의 데이터만 정확히 보여주려면 워크스페이스와 Claude 프로젝트 디렉토리 간의 매칭이 필요하다.

#### 결정

`workspaceFolder` 경로의 SHA-256 해시로 `~/.claude/projects/` 하위 디렉토리를 매칭한다. 매칭 실패 시 사용자에게 수동 선택 QuickPick UI를 제공한다.

#### 근거

- **Claude Code 호환**: Claude Code가 동일한 SHA-256 해시 방식으로 프로젝트 디렉토리를 생성하므로 별도 설정 없이 자동 매칭된다.
- **제로 설정**: 사용자가 프로젝트 경로를 수동으로 지정할 필요가 없어 UX가 우수하다.
- **멀티 워크스페이스 지원**: 각 워크스페이스 폴더별로 독립적인 해시가 생성되므로 멀티 루트 워크스페이스에서도 정확한 스코핑이 가능하다.

#### 대안

| 대안 | 장점 | 기각 사유 |
|------|------|-----------|
| 사용자 수동 경로 설정 | 구현 단순 | UX 나쁨, 매번 설정 필요, 경로 변경 시 재설정 |
| `.claude/` 로컬 디렉토리만 사용 | 설정 불필요 | 세션/팀 데이터 부족, Claude Code 전역 데이터 활용 불가 |
| 프로젝트명 문자열 매칭 | 직관적 | 동명 프로젝트 충돌 위험, Claude Code 내부 구조와 불일치 |

#### 결과

- `WorkspaceMatcherService`가 활성화 시점에 자동 매칭을 수행한다.
- 매칭 성공 시 `ProjectMatch` 객체를 생성하여 다른 서비스(`WatcherService`, `SessionParserService`)에 스코프를 전달한다.
- 매칭 실패 시 `onMatchFailed` 이벤트를 발행하고, QuickPick UI로 수동 폴백을 제공한다.
