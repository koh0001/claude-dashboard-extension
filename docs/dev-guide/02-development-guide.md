# Claude Flow Monitor — 개발 가이드

> 버전: 1.1.0-draft
> 작성일: 2026-03-26
> 최종 수정일: 2026-03-26

## 1. 개발 환경 설정

### 1.1 필수 도구

| 도구 | 최소 버전 | 용도 |
|------|-----------|------|
| Node.js | 20.0.0 | 런타임 |
| npm | 10.0.0 | 패키지 관리 |
| VS Code | 1.90.0 | 개발 + 디버깅 |
| TypeScript | 5.6.0 | 컴파일 |
| Git | 2.30+ | 버전 관리 |

### 1.2 초기 셋업

```bash
# 1. 프로젝트 클론
git clone https://github.com/koh0001/claude-flow-monitor.git
cd claude-flow-monitor

# 2. 의존성 설치
npm install

# 3. 빌드
npm run build

# 4. VS Code에서 열기
code .
```

### 1.3 디버깅

1. VS Code에서 프로젝트를 연다
2. `F5`를 눌러 Extension Development Host를 실행한다
3. 새 VS Code 창에서 `Ctrl+Shift+P` → "Claude Flow Monitor: Open Dashboard"
4. `~/.claude/teams/` 폴더에 테스트 데이터가 있으면 대시보드에 표시된다

### 1.4 테스트 데이터 생성

```bash
# 테스트용 팀 데이터 생성 스크립트
node scripts/generate-test-data.js

# 또는 환경변수로 커스텀 경로 지정
CC_TEAM_VIEWER_CLAUDE_DIR=./test-data npm run dev
```

## 2. 코딩 컨벤션

### 2.1 일반 규칙

| 규칙 | 설명 |
|------|------|
| 언어 | TypeScript (strict mode) |
| 모듈 | ESM (import/export) |
| 주석 | 한국어 |
| 문자열 | 작은따옴표 (`'`) 우선, 템플릿 리터럴 허용 |
| 세미콜론 | 항상 사용 |
| 들여쓰기 | 2 스페이스 |
| 줄 길이 | 100자 권장, 120자 이하 |

### 2.2 파일 명명 규칙

| 종류 | 형식 | 예시 |
|------|------|------|
| 소스 파일 | kebab-case | `watcher-service.ts` |
| 타입 파일 | kebab-case | `messages.ts` |
| 테스트 파일 | `*.test.ts` | `watcher-service.test.ts` |
| i18n 로케일 | 로케일 코드 | `ko.ts`, `en.ts` |

### 2.3 타입 정의

```typescript
// 좋은 예: 인터페이스는 명확한 JSDoc
/** WebView에서 Extension으로 전송하는 메시지 */
export interface WebToExtMessage {
  /** 메시지 타입 (구분자 유니온) */
  type: 'ready' | 'selectTeam' | 'refresh' | 'changeTab' | 'changeLanguage';
  // ...
}

// 좋은 예: 유니온 타입은 discriminated union
export type ExtToWebMessage =
  | { type: 'init'; data: InitPayload }
  | { type: 'snapshotUpdate'; teamName: string; data: SnapshotPayload }
  | { type: 'translationsUpdate'; translations: Record<string, string>; locale: string };
```

### 2.4 WebView 코드 특수 규칙

dashboard-js.ts는 템플릿 리터럴 안에서 실행되므로 다음 규칙을 따른다:

| 규칙 | 이유 |
|------|------|
| `var` 사용 | 함수 스코프 필요 (템플릿 리터럴 내부) |
| innerHTML 금지 | CSP 위반 + XSS 방지 |
| onclick 속성 금지 | CSP 위반 |
| addEventListener 사용 | CSP 호환 이벤트 바인딩 |
| escapeHtml() 필수 | 사용자 데이터 출력 시 |

## 3. 에러 처리

### 3.1 원칙

Agent가 파일을 쓰는 도중에 읽으면 불완전한 JSON이 될 수 있다. 따라서 **모든 JSON 파싱은 graceful fail**이어야 한다.

```typescript
// 좋은 예: 파싱 실패를 조용히 처리
const config = safeReadJson<TeamConfig>(filePath);
if (!config) return; // 다음 폴링에서 재시도

// 나쁜 예: 예외를 상위로 전파
const config = JSON.parse(content); // ← 불완전한 JSON에서 크래시
```

### 3.2 에러 카테고리

| 카테고리 | 처리 방식 | 예시 |
|----------|-----------|------|
| 파일 파싱 오류 | skip + 다음 폴링 재시도 | 불완전한 JSON |
| 디렉토리 미존재 | 빈 상태 표시 + 주기적 재확인 | ~/.claude 미생성 |
| WebView 통신 오류 | 메시지 큐 버퍼링 | WebView 미로드 |
| VS Code API 오류 | 로그 + 사용자 알림 | 권한 부족 |

### 3.3 로깅

```typescript
// VS Code 출력 채널 사용
const output = vscode.window.createOutputChannel('Claude Flow Monitor');
output.appendLine(`[INFO] ${message}`);
output.appendLine(`[ERROR] ${error.message}`);
```

## 4. 테마 개발 가이드

### 4.1 CSS 변수 추가 방법

새로운 시맨틱 색상이 필요한 경우:

```css
/* 1. dashboard-css.ts의 :root에 추가 */
:root {
  --cfm-new-color: var(--vscode-적절한-변수);
}

/* 2. 다크/라이트/고대비 분기 */
body[data-vscode-theme-kind="vscode-dark"] {
  --cfm-new-color: #다크값;
}
body[data-vscode-theme-kind="vscode-light"] {
  --cfm-new-color: #라이트값;
}
body[data-vscode-theme-kind="vscode-high-contrast"] {
  --cfm-new-color: #고대비값;
}
```

### 4.2 테마 테스트 체크리스트

모든 UI 변경 시 다음 테마에서 확인:

- [ ] Default Dark+ (VS Code 기본 다크)
- [ ] Default Light+ (VS Code 기본 라이트)
- [ ] High Contrast (고대비 다크)
- [ ] High Contrast Light (고대비 라이트)
- [ ] One Dark Pro (인기 서드파티 다크)
- [ ] GitHub Light (인기 서드파티 라이트)

## 5. i18n 개발 가이드

### 5.1 새 번역 키 추가 방법

```typescript
// 1. src/i18n/types.ts에 키 추가
export type ExtendedTranslationMap = TranslationMap & {
  "new.key": string;
  // ...
};

// 2. 4개 로케일 파일 모두 업데이트
// src/i18n/locales/ko.ts
"new.key": "새 키 한국어",

// src/i18n/locales/en.ts
"new.key": "New key English",

// src/i18n/locales/ja.ts
"new.key": "新しいキー日本語",

// src/i18n/locales/zh.ts
"new.key": "新键中文",

// 3. WebView에서 사용하는 키라면 WEBVIEW_TRANSLATION_KEYS에 추가
// src/providers/dashboard-provider.ts
const WEBVIEW_TRANSLATION_KEYS = [
  // ...
  "new.key",
];
```

### 5.2 번역 품질 규칙

| 규칙 | 설명 |
|------|------|
| 한국어 기준 | 항상 한국어를 먼저 작성하고 다른 언어로 번역 |
| 보간 일관성 | `{count}` 형태의 플레이스홀더는 모든 로케일에서 동일 위치 |
| 길이 고려 | 독일어/일본어 등 긴 텍스트를 고려해 UI 여유 확보 |
| 컴파일 검증 | TypeScript가 키 누락을 잡아줌 — 빌드 시 확인 |

## 6. 새 탭/뷰 추가 가이드

### 6.1 단계별 프로세스

1. **타입 정의**: `types/messages.ts`에 탭 이름 추가
2. **CSS 추가**: `views/dashboard-css.ts`에 새 탭 스타일
3. **렌더러 구현**: `views/dashboard-js.ts`에 렌더 함수 추가
4. **HTML 컨테이너**: `views/dashboard-html.ts`에 탭 패널 div
5. **탭 버튼**: 탭 네비게이션에 버튼 추가
6. **i18n 키**: 새 탭 관련 번역 키 추가
7. **Dirty Tab**: `dirtyTabs` 로직에 새 탭 포함

### 6.2 예시: Timeline 탭 추가 (Phase 2)

```typescript
// types/messages.ts
type TabName = 'overview' | 'tasks' | 'messages' | 'deps' | 'timeline';

// views/dashboard-js.ts
function renderTimeline(snap) {
  var container = document.getElementById('tab-timeline');
  container.textContent = '';
  // ... 타임라인 렌더링 로직
}

// renderCurrentTab에 분기 추가
if (state.currentTab === 'timeline') renderTimeline(snap);
```

## 7. Git 워크플로우

### 7.1 브랜치 전략

| 브랜치 | 용도 |
|--------|------|
| `main` | 안정 릴리즈 |
| `develop` | 개발 통합 |
| `feature/*` | 기능 개발 |
| `fix/*` | 버그 수정 |
| `release/*` | 릴리즈 준비 |

### 7.2 커밋 메시지 컨벤션

```
<type>(<scope>): <description>

<body>

<footer>
```

타입: `feat`, `fix`, `refactor`, `style`, `docs`, `test`, `chore`
스코프: `dashboard`, `tree`, `i18n`, `theme`, `service`, `core`

예시:
```
feat(dashboard): 타임라인 탭 추가

Phase 2 기능으로 시간축 기반 에이전트 활동 시각화를 구현합니다.
D3.js를 사용하여 SVG 타임라인을 렌더링하며,
에이전트별 색상 코딩을 적용합니다.

Closes #42
```

## 8. PR 리뷰 프로세스

### 8.1 리뷰어 지정 기준

| 변경 영역 | 우선 리뷰어 | 설명 |
|-----------|-------------|------|
| WebView (dashboard-*) | 프론트엔드 담당자 | CSP, 접근성, 테마 호환성 검증 |
| core 연동 (services/) | 코어 모듈 담당자 | TeamWatcher API 호환성 확인 |
| i18n (locales/) | 각 언어 담당자 | 번역 자연스러움 및 보간 일관성 |
| 보안 관련 (CSP, escapeHtml) | 보안 리뷰어 | XSS/CSP 위반 여부 필수 확인 |
| 아키텍처 변경 | 테크 리드 | 설계 방향 및 호환성 판단 |

> 리뷰어를 특정하기 어려운 경우, PR 작성자가 `CODEOWNERS` 파일 또는 최근 해당 파일 변경 이력을 참고하여 지정한다.

### 8.2 리뷰 관점

리뷰어는 다음 4가지 관점에서 코드를 검토한다:

1. **기능 정확성**: 요구사항 충족 여부, 엣지 케이스 처리, 에러 핸들링
2. **보안**: CSP 위반 여부, `escapeHtml()` 사용 여부, 사용자 입력 검증
3. **성능**: 불필요한 리렌더링, 메모리 누수, 파일 감시 디바운스 적정성
4. **접근성**: ARIA 속성, 키보드 내비게이션, 스크린 리더 호환성

### 8.3 승인 조건

- **최소 1명**의 리뷰어가 **Approve** 해야 머지 가능
- **보안 관련 변경**은 보안 리뷰어의 Approve가 추가로 필요
- **CRITICAL** 또는 **HIGH** 심각도 코멘트가 남아 있으면 머지 불가
- 모든 CI 검사 (빌드, 린트, 테스트)가 통과해야 함

### 8.4 리뷰 응답 시간 가이드라인

| 우선순위 | 첫 리뷰 응답 | 후속 응답 |
|----------|-------------|-----------|
| 긴급 (hotfix) | 4시간 이내 | 2시간 이내 |
| 일반 기능 | 1 영업일 이내 | 12시간 이내 |
| 문서/리팩토링 | 2 영업일 이내 | 1 영업일 이내 |

> 리뷰 요청 후 응답 시간이 초과되면 PR 작성자가 리뷰어에게 리마인드하거나 대체 리뷰어를 지정할 수 있다.

### 8.5 코드 리뷰 체크리스트

PR 리뷰 시 다음 항목을 확인한다:

- [ ] **기능 정확성**: 요구사항을 정확히 구현하며 엣지 케이스를 처리하는가
- [ ] **타입 안전성**: TypeScript strict mode에서 타입 에러 없이 컴파일되는가
- [ ] **XSS 방지**: 사용자 데이터 출력 시 `escapeHtml()`을 사용하는가
- [ ] **CSP 호환**: `innerHTML`, `onclick` 속성을 사용하지 않고, nonce 기반 스크립트만 포함하는가
- [ ] **i18n 완비**: 새로 추가된 번역 키가 4개 로케일(ko, en, ja, zh) 모두에 존재하는가
- [ ] **테마 3모드 확인**: 다크, 라이트, 고대비 모드에서 UI가 정상 표시되는가
- [ ] **접근성 (ARIA)**: 인터랙티브 요소에 적절한 ARIA 속성과 키보드 접근성이 확보되는가
- [ ] **테스트 커버리지**: 변경사항에 대한 테스트가 추가되었으며 기존 테스트가 통과하는가
- [ ] **불변성 패턴**: 객체를 직접 변이(mutation)하지 않고 새 객체를 생성하는가
- [ ] **에러 처리**: JSON 파싱 실패 등을 graceful하게 처리하는가

## 9. 기여 가이드라인

### 9.1 기여 워크플로우

```
1. 이슈 생성     → GitHub Issues에 버그 리포트 또는 기능 제안 등록
2. 브랜치 생성   → develop에서 feature/* 또는 fix/* 브랜치 분기
3. 구현          → TDD 방식으로 테스트 → 구현 → 리팩토링
4. PR 생성       → develop 브랜치를 대상으로 Pull Request 생성
5. 코드 리뷰     → 위 "8. PR 리뷰 프로세스" 절차에 따라 리뷰 진행
6. 머지          → 승인 조건 충족 후 Squash & Merge
```

### 9.2 이슈 작성 규칙

- **버그 리포트**: 재현 절차, 기대 동작, 실제 동작, 환경 정보(OS, VS Code 버전) 포함
- **기능 제안**: 목적, 기대 효과, 대략적 구현 방안 기술
- **라벨**: `bug`, `enhancement`, `docs`, `i18n`, `accessibility` 중 적절한 라벨 부착

### 9.3 코드 스타일 요약

| 항목 | 규칙 |
|------|------|
| 언어 | TypeScript strict mode, ESM |
| 주석 | 한국어 |
| 들여쓰기 | 2 스페이스 |
| 문자열 | 작은따옴표 우선 |
| 세미콜론 | 항상 사용 |
| 파일 크기 | 200~400줄 권장, 800줄 이하 |
| 불변성 | 객체 mutation 금지, 새 객체 생성 |
| 에러 처리 | 모든 JSON 파싱은 graceful fail |

> 상세 규칙은 본 문서 "2. 코딩 컨벤션" 참조.

### 9.4 커밋 메시지 규칙

본 문서 "7.2 커밋 메시지 컨벤션"을 따른다.

```
<type>(<scope>): <description>
```

- **type**: `feat`, `fix`, `refactor`, `style`, `docs`, `test`, `chore`
- **scope**: `dashboard`, `tree`, `i18n`, `theme`, `service`, `core`
- 본문과 푸터는 선택 사항이며, 복잡한 변경 시 작성을 권장한다

### 9.5 테스트 요구사항

- 모든 새로운 기능에는 **단위 테스트** 필수
- 테스트 커버리지 **80% 이상** 유지
- WebView 관련 변경 시 **4개 테마 모드**에서 수동 확인
- i18n 변경 시 **4개 로케일** 빌드 검증 (TypeScript 컴파일로 키 누락 감지)
- PR 생성 전 `npm run test:run && npm run lint && npm run build` 통과 확인

## 10. 문제 해결 (Troubleshooting)

### 10.1 흔한 문제

| 문제 | 원인 | 해결 |
|------|------|------|
| WebView 빈 화면 | CSP 위반 (인라인 스크립트 nonce 불일치) | nonce 생성 로직 확인 |
| 데이터 안 나옴 | ~/.claude 디렉토리 미존재 | 환경변수로 경로 오버라이드 |
| 테마 깨짐 | CSS 변수 오타 | VS Code 개발자도구로 확인 (Ctrl+Shift+I) |
| 번역 안 됨 | WEBVIEW_TRANSLATION_KEYS 누락 | 키 목록에 추가 |
| ServiceWorker 에러 | VS Code 캐시 오염 | `%APPDATA%\Code\Service Worker\` 삭제 |

### 10.2 디버깅 도구

```bash
# VS Code 개발자도구 열기 (Extension Host 창에서)
# Help → Toggle Developer Tools (Ctrl+Shift+I)

# WebView 개발자도구
# WebView 우클릭 → "Open DevTools" (Extension Host에서만 가능)

# Extension 로그 확인
# Output 패널 → "Claude Flow Monitor" 채널 선택
```

## 11. 릴리즈 체크리스트

- [ ] 모든 테스트 통과 (`npm run test:run`)
- [ ] 린트 통과 (`npm run lint`)
- [ ] 빌드 성공 (`npm run build`)
- [ ] 4개 테마에서 UI 확인 (Dark+, Light+, HC Dark, HC Light)
- [ ] 4개 언어에서 번역 확인 (ko, en, ja, zh)
- [ ] CHANGELOG.md 업데이트
- [ ] package.json 버전 업데이트
- [ ] vsix 패키지 생성 (`npm run package`)
- [ ] 반응형 확인 (400px, 600px, 900px 너비)
- [ ] 접근성 확인 (키보드 내비게이션, 스크린 리더)
