# Claude Flow Monitor — UI/UX 디자인 가이드

> 버전: 1.2.0-draft
> 작성일: 2026-03-26
> 최종 수정: 2026-03-26
> 디자인 도구: Stitch 2.0 (AI 디자인)

## 1. 디자인 철학

### 핵심 원칙
1. **VS Code 네이티브**: 확장이 아니라 VS Code의 일부처럼 자연스럽게 녹아들어야 함
2. **정보 밀도 최적화**: 핵심 메트릭은 한눈에, 상세 정보는 점진적 공개(Progressive Disclosure)
3. **실시간 안정성**: 빈번한 데이터 갱신에도 시각적 불안정(깜빡임, 레이아웃 이동) 없이 부드러운 전환
4. **다크 퍼스트**: 대부분의 개발자가 다크 모드를 사용하므로 다크 테마를 1순위로 디자인

## 2. 컬러 시스템

### 2.1 VS Code 테마 변수 활용

VS Code는 수백 개의 CSS 커스텀 프로퍼티를 제공한다. 우리 확장은 이 변수를 최대한 활용하여 모든 VS Code 테마와 자연스럽게 호환된다.

#### 기본 색상 매핑
```css
:root {
  /* 배경 계층 */
  --cfm-bg-primary: var(--vscode-editor-background);
  --cfm-bg-secondary: var(--vscode-sideBar-background);
  --cfm-bg-tertiary: var(--vscode-editorWidget-background);
  --cfm-bg-hover: var(--vscode-list-hoverBackground);
  --cfm-bg-active: var(--vscode-list-activeSelectionBackground);

  /* 텍스트 계층 */
  --cfm-text-primary: var(--vscode-foreground);
  --cfm-text-secondary: var(--vscode-descriptionForeground);
  --cfm-text-muted: var(--vscode-disabledForeground);
  --cfm-text-link: var(--vscode-textLink-foreground);

  /* 테두리 */
  --cfm-border-default: var(--vscode-panel-border);
  --cfm-border-active: var(--vscode-focusBorder);

  /* 배지/상태 */
  --cfm-badge-bg: var(--vscode-badge-background);
  --cfm-badge-fg: var(--vscode-badge-foreground);
}
```

### 2.2 시맨틱 토큰 팔레트

VS Code 변수만으로 부족한 **도메인 특화 색상**을 별도 시맨틱 토큰으로 정의한다.

#### 상태 색상 (Status Colors)

> **규칙**: 색상 리터럴(`#FF0000`, `rgb()` 등)은 `:root` 정의부에서만 사용한다.
> 컴포넌트 스타일에서는 반드시 `var(--cfm-*)` 변수로 참조할 것.

```css
:root {
  /* === 태스크 상태 === */
  --cfm-status-completed-base: 76, 175, 80;       /* RGB 컴포넌트: 초록 */
  --cfm-status-in-progress-base: 255, 152, 0;     /* RGB 컴포넌트: 주황 */
  --cfm-status-pending-base: 158, 158, 158;       /* RGB 컴포넌트: 회색 */
  --cfm-status-blocked-base: 244, 67, 54;         /* RGB 컴포넌트: 빨강 */

  --cfm-status-completed: rgb(var(--cfm-status-completed-base));
  --cfm-status-in-progress: rgb(var(--cfm-status-in-progress-base));
  --cfm-status-pending: rgb(var(--cfm-status-pending-base));
  --cfm-status-blocked: rgb(var(--cfm-status-blocked-base));

  /* === 에이전트 활동 === */
  --cfm-agent-active-base: 33, 150, 243;          /* RGB: 파랑 */
  --cfm-agent-idle-base: 120, 144, 156;           /* RGB: 청회색 */
  --cfm-agent-lead-base: 255, 215, 0;             /* RGB: 금색 */

  --cfm-agent-active: rgb(var(--cfm-agent-active-base));
  --cfm-agent-idle: rgb(var(--cfm-agent-idle-base));
  --cfm-agent-lead: rgb(var(--cfm-agent-lead-base));

  /* === 메시지 타입 === */
  --cfm-msg-text: var(--cfm-text-primary);
  --cfm-msg-system-base: 124, 77, 255;            /* RGB: 보라 */
  --cfm-msg-permission-base: 233, 30, 99;         /* RGB: 핑크 */

  --cfm-msg-system: rgb(var(--cfm-msg-system-base));
  --cfm-msg-permission: rgb(var(--cfm-msg-permission-base));

  /* === 활동 유형 === */
  --cfm-activity-file: var(--cfm-text-primary);
  --cfm-activity-command: rgb(var(--cfm-agent-active-base));
  --cfm-activity-task: var(--cfm-status-completed);
  --cfm-activity-message: rgb(var(--cfm-msg-system-base));
}

/* RGB 분해 패턴을 사용하면 투명도 조절이 용이하다 */
/* 예: rgba(var(--cfm-status-completed-base), 0.2) → 배경용 반투명 초록 */
```

#### 다크/라이트 모드 적응
```css
/* 다크 모드 (기본 — VS Code가 data-vscode-theme-kind 속성 제공) */
body[data-vscode-theme-kind="vscode-dark"],
body[data-vscode-theme-kind="vscode-high-contrast"] {
  --cfm-overlay-subtle: rgba(255, 255, 255, 0.03);
  --cfm-overlay-light: rgba(255, 255, 255, 0.06);
  --cfm-overlay-medium: rgba(255, 255, 255, 0.09);
  --cfm-overlay-strong: rgba(255, 255, 255, 0.12);
  --cfm-overlay-intense: rgba(255, 255, 255, 0.18);
  --cfm-shadow-card: 0 2px 8px rgba(0, 0, 0, 0.3);
  --cfm-shadow-popup: 0 4px 16px rgba(0, 0, 0, 0.5);
}

/* 라이트 모드 */
body[data-vscode-theme-kind="vscode-light"],
body[data-vscode-theme-kind="vscode-high-contrast-light"] {
  --cfm-overlay-subtle: rgba(0, 0, 0, 0.02);
  --cfm-overlay-light: rgba(0, 0, 0, 0.04);
  --cfm-overlay-medium: rgba(0, 0, 0, 0.07);
  --cfm-overlay-strong: rgba(0, 0, 0, 0.10);
  --cfm-overlay-intense: rgba(0, 0, 0, 0.14);
  --cfm-shadow-card: 0 1px 4px rgba(0, 0, 0, 0.1);
  --cfm-shadow-popup: 0 2px 12px rgba(0, 0, 0, 0.15);
}

/* 고대비 모드 — 명도/채도를 높여 가독성 확보 */
body[data-vscode-theme-kind="vscode-high-contrast"] {
  --cfm-status-completed-base: 0, 230, 118;
  --cfm-status-in-progress-base: 255, 171, 0;
  --cfm-status-pending-base: 189, 189, 189;
  --cfm-status-blocked-base: 255, 23, 68;

  --cfm-status-completed: rgb(var(--cfm-status-completed-base));
  --cfm-status-in-progress: rgb(var(--cfm-status-in-progress-base));
  --cfm-status-pending: rgb(var(--cfm-status-pending-base));
  --cfm-status-blocked: rgb(var(--cfm-status-blocked-base));
  --cfm-border-default: var(--vscode-contrastBorder);
}
```

### 2.3 에이전트 색상 시스템

각 에이전트에 config.json의 `color` 필드값을 그대로 사용하되, 배경/텍스트 대비를 보장한다.

```css
/* 에이전트 카드에 적용 */
.agent-card {
  --agent-color: attr(data-color);  /* config.json의 color 값 */
  border-left: 3px solid var(--agent-color);
  background: color-mix(in srgb, var(--agent-color) 8%, var(--cfm-bg-tertiary));
}

/* 고대비 모드에서는 보더만 사용 */
body[data-vscode-theme-kind="vscode-high-contrast"] .agent-card {
  background: var(--cfm-bg-tertiary);
  border-left-width: 4px;
}
```

## 3. 타이포그래피

VS Code의 에디터 폰트를 상속한다.

```css
:root {
  --cfm-font-family: var(--vscode-font-family);
  --cfm-font-size-xs: 11px;
  --cfm-font-size-sm: 12px;     /* 기본 */
  --cfm-font-size-md: 13px;     /* 강조 */
  --cfm-font-size-lg: 16px;     /* 섹션 타이틀 */
  --cfm-font-size-xl: 20px;     /* 페이지 타이틀 */
  --cfm-font-weight-normal: 400;
  --cfm-font-weight-medium: 500;
  --cfm-font-weight-bold: 600;
  --cfm-line-height: 1.5;
  --cfm-font-mono: var(--vscode-editor-font-family);
}
```

## 4. 레이아웃 시스템

### 4.1 대시보드 구조

```
┌─────────────────────────────────────────────────────────┐
│ [팀 선택 탭]     [Overview] [Tasks] [Messages] [Deps]  🌐│
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌─ Stats Bar ────────────────────────────────────┐     │
│  │  📊 12 tasks  ⚡ 4 active  💬 28 msgs  ⏱ 45m  │     │
│  │  ██████████████░░░░░░░░  67%                   │     │
│  └────────────────────────────────────────────────┘     │
│                                                          │
│  ┌─ Content Area ─────────────────────────────────┐     │
│  │                                                 │     │
│  │  (탭별 콘텐츠 — Overview/Tasks/Messages/Deps)   │     │
│  │                                                 │     │
│  │                                                 │     │
│  └─────────────────────────────────────────────────┘     │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### 4.2 반응형 브레이크포인트

WebView 패널은 사용자가 자유롭게 크기를 조절할 수 있으므로 반응형이 필수적이다.

```css
/* 컴팩트: 사이드바 좁게 열렸을 때 */
@container dashboard (max-width: 400px) {
  .stats-bar { flex-direction: column; gap: 4px; }
  .agent-grid { grid-template-columns: 1fr; }
  .kanban-board { grid-template-columns: 1fr; }  /* 1열 스택 */
  .task-table th:nth-child(3) { display: none; }  /* owner 컬럼 숨김 */
}

/* 기본: 일반 에디터 영역 크기 */
@container dashboard (min-width: 401px) and (max-width: 800px) {
  .agent-grid { grid-template-columns: repeat(2, 1fr); }
  .kanban-board { grid-template-columns: repeat(3, 1fr); }
}

/* 와이드: 전체 너비로 열렸을 때 */
@container dashboard (min-width: 801px) {
  .agent-grid { grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); }
  .kanban-board { grid-template-columns: repeat(3, 1fr); }
  .message-list { max-height: 600px; }
}
```

### 4.3 스페이싱 체계

```css
:root {
  --cfm-space-xs: 4px;
  --cfm-space-sm: 8px;
  --cfm-space-md: 12px;
  --cfm-space-lg: 16px;
  --cfm-space-xl: 24px;
  --cfm-space-2xl: 32px;
  --cfm-radius-sm: 4px;
  --cfm-radius-md: 6px;
  --cfm-radius-lg: 8px;
}
```

## 5. 컴포넌트 명세

### 5.1 에이전트 카드

```
┌──────────────────────────────────────┐
│  ● backend-dev                  opus │
│  Backend Developer                   │
│  ████████░░ 2/4 tasks (50%)         │
│  현재: API 엔드포인트 구현          │
└──────────────────────────────────────┘
```

상태:
- **Active**: 펄스 애니메이션 (좌측 보더), 현재 태스크 표시
- **Idle**: 반투명 처리, "유휴" 뱃지
- **Lead**: 금색 왕관 아이콘, 보더 강조

### 5.2 태스크 행 (테이블 뷰)

```
│ #3 │ 차트 컴포넌트 구현 │ frontend-dev │ ● 진행중 │
│    └─ 📋 D3.js 기반 실시간 차트 렌더링 구현         │ (확장 시)
│       🚫 blockedBy: #1 API 설계                      │
│       🔗 blocks: #5 통합 테스트                       │
```

### 5.3 칸반 카드

```
┌─────────────────────┐
│ #3                ● │
│ 차트 컴포넌트 구현   │
│ frontend-dev        │
│ 🚫 blocked by: #1  │
└─────────────────────┘
```

### 5.4 메시지 스레드

```
▼ backend-dev → frontend-dev (3 messages)
│  [14:32] API 엔드포인트 설계가 완료되었습니다.
│  [14:33] /users 엔드포인트의 응답 형식을 확인해주세요.
│  [14:45] 확인했습니다. 타입 정의를 공유해주세요.
```

### 5.5 의존성 그래프 노드

```
 Layer 0          Layer 1          Layer 2
┌──────────┐    ┌──────────┐    ┌──────────┐
│ #1 ● API │───▶│ #3 ● 차트│───▶│ #5 ○ 테스트│
│   설계   │    │  컴포넌트│    │   통합   │
└──────────┘    └──────────┘    └──────────┘
      │         ┌──────────┐
      └────────▶│ #4 ● 인증│
                │  미들웨어│
                └──────────┘
```

### 5.6 Activity Feed 항목

실시간 활동 피드의 개별 항목. 유형별 아이콘과 색상으로 구분한다.

```
┌──────────────────────────────────────────────┐
│ 📝 14:32  dashboard-css.ts 수정 (45줄 추가)   │
│ ⚡ 14:33  npm run build 실행                   │
│ ✅ 14:35  #3 차트 컴포넌트 구현 — 완료          │
│ 💬 14:36  backend-dev → frontend-dev 메시지     │
└──────────────────────────────────────────────┘
```

활동 유형별 색상:
- 파일 편집: `var(--cfm-activity-file)` — 기본 텍스트
- 커맨드 실행: `var(--cfm-activity-command)` — `var(--cfm-agent-active)` 계열
- 태스크 변경: `var(--cfm-activity-task)` — 상태별 색상 상속
- 메시지: `var(--cfm-activity-message)` — `var(--cfm-msg-text)` 계열

필터 토글 버튼: 유형별 on/off, 활성 상태는 배경색으로 표시

### 5.7 미니 대시보드 (상태 바 팝업)

상태 바 클릭 시 나타나는 경량 팝업.

```
┌─────────────────────────────┐
│ Claude Flow Monitor          │
│                              │
│  🔄 활성 세션: 2             │
│  📝 변경 파일: 12            │
│  ✅ 태스크: 8/12 (67%)       │
│  ⏱  마지막 활동: 2분 전      │
│                              │
│  [대시보드 열기]              │
└─────────────────────────────┘
```

크기: 최대 너비 280px, 고정 4 메트릭
상태 바 텍스트: "$(pulse) CFM: 67%" 형태

### 5.8 파일 히트맵 뱃지

Explorer 파일 트리에 표시되는 AI 기여도 뱃지.

- FileDecorationProvider API 사용
- 뱃지 텍스트: "AI" (2글자)
- 뱃지 색상: 수정 빈도에 따라 3단계
  - 1~2회: `var(--cfm-status-pending)` (회색)
  - 3~5회: `var(--cfm-status-in-progress)` (주황)
  - 6회+: `var(--cfm-status-blocked)` (빨강, "많이 수정됨" 의미)
- tooltip: "Claude Code가 N회 수정 (최근: YYYY-MM-DD HH:mm)"

### 5.9 세션 카드

Activity Feed 상단에 표시되는 현재/최근 세션 요약 카드.

```
┌──────────────────────────────────────┐
│  🟢 활성 세션                   14:20~│
│  claude-flow-monitor                  │
│  파일 12개 수정 · 커맨드 5회 실행     │
│  ████████████░░░░  67% (8/12 tasks)  │
└──────────────────────────────────────┘
```

상태:
- 활성(🟢): 세션 진행 중, 펄스 보더 애니메이션
- 종료(⚫): 세션 완료, 반투명 처리

## 6. 컴포넌트 상태 (Loading / Empty / Error)

모든 데이터 표시 컴포넌트는 **3가지 비정상 상태**를 반드시 처리해야 한다.

### 6.1 로딩 상태 (Loading)

데이터가 아직 도착하지 않은 초기 로드 시점.

```
┌──────────────────────────────────────┐
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │  ← 스켈레톤 블록
│  ░░░░░░░░░░░░░░░░░░                 │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
└──────────────────────────────────────┘
```

| 컴포넌트 | 로딩 표현 |
|----------|-----------|
| 에이전트 카드 | 펄스 애니메이션 스켈레톤 (카드 형태 유지) |
| 태스크 테이블 | 3행 스켈레톤 + 흐릿한 헤더 |
| 메시지 스트림 | 3개 메시지 버블 스켈레톤 |
| DAG 그래프 | 중앙 스피너 + "의존성 분석 중..." 텍스트 |
| Stats Bar | 숫자 영역만 스켈레톤, 아이콘은 표시 |

```css
@keyframes skeleton-pulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.8; }
}
.skeleton {
  background: var(--cfm-overlay-medium);
  border-radius: var(--cfm-radius-sm);
  animation: skeleton-pulse 1.5s ease-in-out infinite;
}
```

### 6.2 빈 상태 (Empty)

데이터가 로드되었으나 표시할 항목이 없는 경우.

```
┌──────────────────────────────────────┐
│                                       │
│           $(telescope)                │  ← Codicon 아이콘
│       활성 팀이 없습니다              │  ← i18n 키 사용
│  Agent Teams를 시작하면 여기에         │
│       상태가 표시됩니다               │
│                                       │
└──────────────────────────────────────┘
```

| 컴포넌트 | 빈 상태 메시지 | 보조 텍스트 |
|----------|---------------|-------------|
| Overview | "활성 팀이 없습니다" | "Agent Teams를 시작하면 표시됩니다" |
| Tasks | "등록된 태스크가 없습니다" | — |
| Messages | "메시지가 없습니다" | "에이전트 간 통신이 시작되면 표시됩니다" |
| Deps | "표시할 의존성이 없습니다" | "태스크에 blockedBy 설정이 있으면 표시됩니다" |

### 6.3 에러 상태 (Error)

파일 접근 실패, 디렉토리 미존재 등 오류 발생 시.

```
┌──────────────────────────────────────┐
│                                       │
│           $(warning)                  │  ← 경고 아이콘
│     데이터를 불러올 수 없습니다        │
│     ~/.claude 디렉토리를 확인하세요    │
│           [다시 시도]                  │  ← 액션 버튼
│                                       │
└──────────────────────────────────────┘
```

| 에러 유형 | 아이콘 | 메시지 | 액션 |
|-----------|--------|--------|------|
| 디렉토리 미존재 | `$(warning)` | "~/.claude 디렉토리를 찾을 수 없습니다" | 경로 설정 안내 |
| 파싱 실패 | `$(error)` | "데이터를 읽는 중 오류가 발생했습니다" | 다시 시도 버튼 |
| 연결 끊김 | `$(debug-disconnect)` | "파일 감시가 중단되었습니다" | 재연결 버튼 |

### 6.4 인터랙션 상태 (Interaction States)

모든 인터랙티브 요소는 다음 5가지 상태를 지원한다.

| 상태 | CSS | 설명 |
|------|-----|------|
| **Default** | 기본 스타일 | 초기 상태 |
| **Hover** | `background: var(--cfm-bg-hover);` | 마우스 오버 |
| **Focus** | `outline: 2px solid var(--cfm-border-active); outline-offset: -2px;` | 키보드 포커스 (a11y 필수) |
| **Active** | `background: var(--cfm-bg-active); transform: scale(0.98);` | 클릭/탭 중 |
| **Disabled** | `opacity: 0.5; pointer-events: none;` | 비활성 |

```css
/* 인터랙티브 요소 기본 트랜지션 */
.interactive {
  transition: background var(--cfm-transition-fast),
              transform var(--cfm-transition-fast),
              outline var(--cfm-transition-fast);
}
.interactive:hover { background: var(--cfm-bg-hover); }
.interactive:focus-visible {
  outline: 2px solid var(--cfm-border-active);
  outline-offset: -2px;
}
.interactive:active { transform: scale(0.98); }
.interactive:disabled,
.interactive[aria-disabled="true"] {
  opacity: 0.5;
  pointer-events: none;
}
```

## 7. 애니메이션 및 트랜지션

### 7.1 원칙
- **150ms 이하**: 즉시 반응으로 느끼는 임계값
- **ease-out**: 자연스러운 감속 곡선
- **reduced-motion 존중**: `prefers-reduced-motion: reduce` 미디어 쿼리 대응

### 7.2 정의
```css
:root {
  --cfm-transition-fast: 100ms ease-out;
  --cfm-transition-normal: 150ms ease-out;
  --cfm-transition-slow: 250ms ease-out;
}

/* 태스크 상태 변경 시 */
@keyframes status-pulse {
  0% { box-shadow: 0 0 0 0 var(--status-color); }
  70% { box-shadow: 0 0 0 6px transparent; }
  100% { box-shadow: 0 0 0 0 transparent; }
}

/* 에이전트 카드 활성 */
@keyframes agent-pulse {
  0%, 100% { border-left-color: var(--agent-color); }
  50% { border-left-color: color-mix(in srgb, var(--agent-color) 50%, transparent); }
}

/* 새 메시지 슬라이드 인 */
@keyframes message-slide-in {
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: translateY(0); }
}

/* 접근성: 모션 감소 설정 존중 */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

## 8. 아이콘 시스템

VS Code 내장 Codicon을 우선 사용하고, 부족한 경우 인라인 SVG를 사용한다.

| 용도 | Codicon | 폴백 SVG |
|------|---------|----------|
| 팀 | `$(telescope)` | — |
| 에이전트 (리더) | `$(account)` | 왕관 SVG |
| 에이전트 (일반) | `$(person)` | — |
| 태스크 (완료) | `$(check)` | — |
| 태스크 (진행) | `$(loading~spin)` | — |
| 태스크 (대기) | `$(circle-outline)` | — |
| 메시지 | `$(comment)` | — |
| 의존성 | `$(git-merge)` | — |
| 언어 전환 | `$(globe)` | — |
| 새로고침 | `$(refresh)` | — |
| 설정 | `$(gear)` | — |

## 9. 접근성 (Accessibility)

### 키보드 내비게이션
| 키 | 동작 |
|----|------|
| Tab / Shift+Tab | 포커스 이동 |
| Enter / Space | 선택/확장 |
| Escape | 닫기/축소 |
| Arrow keys | 리스트/그리드 내 이동 |
| 1-4 | 탭 직접 선택 |

### ARIA 속성
```html
<div role="tablist" aria-label="대시보드 탭">
  <button role="tab" aria-selected="true" aria-controls="panel-overview">Overview</button>
</div>
<div role="tabpanel" id="panel-overview" aria-labelledby="tab-overview">
  <!-- 콘텐츠 -->
</div>
<div role="progressbar" aria-valuenow="67" aria-valuemin="0" aria-valuemax="100">
  67% 완료
</div>
```

### 포커스 관리
- 탭 전환 시 해당 패널의 첫 번째 포커스 가능 요소로 이동
- 모달/드롭다운 닫힘 시 트리거 요소로 포커스 복원
- Skip-to-content 링크 (대시보드 상단)

## 10. Stitch 2.0 디자인 워크플로우

Stitch 2.0은 AI 기반 디자인 도구로, 다음 워크플로우로 UI를 생성한다:

1. **컴포넌트 프롬프팅**: 각 컴포넌트의 요구사항을 Stitch 2.0에 입력
2. **테마 토큰 입력**: 위에서 정의한 CSS 변수를 디자인 토큰으로 변환하여 입력
3. **변형(Variants) 생성**: 다크/라이트/고대비 각각의 변형을 생성
4. **반응형 프리뷰**: 400px / 600px / 900px 너비에서 각각 확인
5. **핸드오프**: 생성된 디자인에서 CSS 코드를 추출하여 dashboard-css.ts에 반영

### Stitch 2.0 입력 규격
```json
{
  "project": "Claude Flow Monitor",
  "platform": "VS Code WebView",
  "theme": {
    "mode": ["dark", "light", "high-contrast"],
    "tokens": "CSS custom properties (--cfm-*)",
    "base": "VS Code theme variables (--vscode-*)"
  },
  "components": [
    "AgentCard", "TaskRow", "TaskKanbanCard",
    "MessageThread", "DepsGraph", "StatsBar",
    "TeamSelector", "LanguageButton"
  ],
  "breakpoints": [400, 600, 900],
  "accessibility": "WCAG 2.1 AA"
}
```

## 11. 디자인 토큰 내보내기 형식

Stitch 2.0에서 생성된 디자인 토큰은 다음 형식으로 내보내진다:

```typescript
// design-tokens.ts
// 색상은 RGB 컴포넌트 배열로 정의하여 투명도 조절에 활용
export const tokens = {
  color: {
    status: {
      completed: { dark: [76, 175, 80], light: [46, 125, 50], hc: [0, 230, 118] },
      inProgress: { dark: [255, 152, 0], light: [230, 81, 0], hc: [255, 171, 0] },
      pending: { dark: [158, 158, 158], light: [97, 97, 97], hc: [189, 189, 189] },
      blocked: { dark: [244, 67, 54], light: [198, 40, 40], hc: [255, 23, 68] },
    },
    agent: {
      active: { dark: [33, 150, 243], light: [21, 101, 192], hc: [68, 138, 255] },
      idle: { dark: [120, 144, 156], light: [84, 110, 122], hc: [144, 164, 174] },
    },
  },
  spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, '2xl': 32 },
  radius: { sm: 4, md: 6, lg: 8 },
  shadow: {
    card: { dark: '0 2px 8px rgba(0,0,0,0.3)', light: '0 1px 4px rgba(0,0,0,0.1)' },
  },
  animation: {
    fast: '100ms ease-out',
    normal: '150ms ease-out',
    slow: '250ms ease-out',
  },
} as const;

// 유틸리티: RGB 배열 → CSS 문자열 변환
// toRgb([76, 175, 80]) → "rgb(76, 175, 80)"
// toRgba([76, 175, 80], 0.2) → "rgba(76, 175, 80, 0.2)"
```
