# Claude Flow Monitor — 다국어(i18n) 설계 문서

> 버전: 1.1.0-draft
> 작성일: 2026-03-26
> 최종 수정일: 2026-03-26

## 1. 개요

Claude Flow Monitor는 4개 언어를 지원한다: 한국어(ko), 영어(en), 일본어(ja), 중국어(zh). 기존 cc-team-viewer/core의 i18n 시스템을 계승하되, VS Code 확장에 특화된 확장 키와 UI 패턴을 추가한다.

## 2. 아키텍처

### 2.1 의존성 구조

```
@cc-team-viewer/core (기존 i18n)
  ├── createI18n(locale) → I18nInstance
  ├── TranslationMap (100+ 키)
  ├── LOCALE_ORDER: ["ko", "en", "ja", "zh"]
  └── detectLocale() → Locale
          ↓
Claude Flow Monitor (확장 i18n)
  ├── ExtendedTranslationMap (추가 키)
  ├── VS Code 설정 연동
  ├── WebView 번역 전달
  └── 실시간 전환 지원
```

### 2.2 로케일 감지 우선순위

1. `ccFlowMonitor.language` VS Code 설정값 (사용자가 직접 설정)
2. `CC_TEAM_VIEWER_LANG` 환경변수 (CLI 호환)
3. VS Code `env.language` (VS Code UI 언어)
4. `LANG` 환경변수 (OS 언어)
5. `Intl.DateTimeFormat().resolvedOptions().locale` (시스템 로케일)
6. `"ko"` (기본 폴백)

## 3. 번역 키 구조

### 3.1 기존 키 (core에서 상속)

core 패키지의 `TranslationMap`에 정의된 키들을 그대로 사용한다. 주요 카테고리:

| 카테고리 | 예시 키 | 용도 |
|----------|---------|------|
| status.* | status.completed, status.inProgress, status.pending | 태스크 상태 |
| duration.* | duration.seconds, duration.minutes, duration.hours | 경과 시간 |
| timeAgo.* | timeAgo.seconds, timeAgo.minutes, timeAgo.hours | 상대 시간 |
| view.* | view.overview, view.tasks, view.messages, view.deps | 탭 이름 |
| stats.* | stats.tasks, stats.active, stats.messages, stats.elapsed | 통계 |
| agent.* | agent.sectionTitle, agent.taskProgress, agent.noAgents | 에이전트 |
| task.* | task.headerId, task.headerTask, task.viewKanban | 태스크 |
| message.* | message.filterAll, message.filterConversation | 메시지 |
| deps.* | deps.sectionTitle, deps.noTasks | 의존성 |
| notification.* | notification.taskCompleted, notification.agentJoined | 알림 |

### 3.2 확장 키 (새로 추가)

```typescript
export type ExtendedTranslationMap = TranslationMap & {
  // 확장 제목
  "ext.title": string;             // "Claude Flow Monitor"
  "ext.description": string;       // "Claude Code 워크플로우 시각화"

  // 새 기능
  "timeline.title": string;        // "타임라인" (Phase 2)
  "timeline.noEvents": string;     // "표시할 이벤트가 없습니다"
  "metrics.title": string;         // "성능 메트릭" (Phase 2)
  "metrics.avgTime": string;       // "평균 처리 시간"
  "metrics.throughput": string;    // "처리량"

  // 검색
  "search.placeholder": string;    // "태스크 검색..."
  "search.noResults": string;      // "검색 결과가 없습니다"

  // 설정
  "settings.theme": string;        // "테마"
  "settings.language": string;     // "언어"
  "settings.notifications": string; // "알림"
  "settings.notifOn": string;      // "켜짐"
  "settings.notifOff": string;     // "꺼짐"

  // 접근성
  "a11y.skipToContent": string;    // "콘텐츠로 건너뛰기"
  "a11y.expandAgent": string;      // "에이전트 상세 보기"
  "a11y.collapseAgent": string;    // "에이전트 상세 닫기"
  "a11y.expandTask": string;       // "태스크 상세 보기"
  "a11y.collapseTask": string;     // "태스크 상세 닫기"
  "a11y.progressBar": string;      // "진행률: {percent}%"

  // 에러 상태
  "error.connectionLost": string;  // "연결이 끊어졌습니다"
  "error.retrying": string;        // "재연결 중..."
  "error.fileNotFound": string;    // "파일을 찾을 수 없습니다"
};
```

## 4. 번역 파일 예시

### 4.1 한국어 (ko.ts) — 기준 로케일

```typescript
export const ko: ExtendedTranslationMap = {
  // ... core 키 상속 ...

  // 확장 제목
  "ext.title": "Claude Flow Monitor",
  "ext.description": "Claude Code 워크플로우 실시간 시각화",

  // 검색
  "search.placeholder": "태스크 검색...",
  "search.noResults": "검색 결과가 없습니다",

  // 설정
  "settings.theme": "테마",
  "settings.language": "언어",
  "settings.notifications": "알림",
  "settings.notifOn": "켜짐",
  "settings.notifOff": "꺼짐",

  // 접근성
  "a11y.skipToContent": "콘텐츠로 건너뛰기",
  "a11y.expandAgent": "에이전트 상세 보기",
  "a11y.collapseAgent": "에이전트 상세 닫기",
  "a11y.expandTask": "태스크 상세 보기",
  "a11y.collapseTask": "태스크 상세 닫기",
  "a11y.progressBar": "진행률: {percent}%",

  // 에러
  "error.connectionLost": "연결이 끊어졌습니다",
  "error.retrying": "재연결 중...",
  "error.fileNotFound": "파일을 찾을 수 없습니다",
};
```

### 4.2 영어 (en.ts)

```typescript
export const en: ExtendedTranslationMap = {
  "ext.title": "Claude Flow Monitor",
  "ext.description": "Real-time Claude Code workflow visualization",
  "search.placeholder": "Search tasks...",
  "search.noResults": "No results found",
  "settings.theme": "Theme",
  "settings.language": "Language",
  "settings.notifications": "Notifications",
  "settings.notifOn": "On",
  "settings.notifOff": "Off",
  "a11y.skipToContent": "Skip to content",
  "a11y.expandAgent": "Expand agent details",
  "a11y.collapseAgent": "Collapse agent details",
  "a11y.expandTask": "Expand task details",
  "a11y.collapseTask": "Collapse task details",
  "a11y.progressBar": "Progress: {percent}%",
  "error.connectionLost": "Connection lost",
  "error.retrying": "Reconnecting...",
  "error.fileNotFound": "File not found",
};
```

### 4.3 일본어 (ja.ts)

```typescript
export const ja: ExtendedTranslationMap = {
  "ext.title": "Claude Flow Monitor",
  "ext.description": "Claude Code ワークフローのリアルタイム可視化",
  "search.placeholder": "タスクを検索...",
  "search.noResults": "検索結果がありません",
  "settings.theme": "テーマ",
  "settings.language": "言語",
  "settings.notifications": "通知",
  "settings.notifOn": "オン",
  "settings.notifOff": "オフ",
  "a11y.skipToContent": "コンテンツへスキップ",
  "a11y.expandAgent": "エージェント詳細を展開",
  "a11y.collapseAgent": "エージェント詳細を閉じる",
  "a11y.expandTask": "タスク詳細を展開",
  "a11y.collapseTask": "タスク詳細を閉じる",
  "a11y.progressBar": "進捗: {percent}%",
  "error.connectionLost": "接続が切断されました",
  "error.retrying": "再接続中...",
  "error.fileNotFound": "ファイルが見つかりません",
};
```

### 4.4 중국어 (zh.ts)

```typescript
export const zh: ExtendedTranslationMap = {
  "ext.title": "Claude Flow Monitor",
  "ext.description": "Claude Code 工作流程实时可视化",
  "search.placeholder": "搜索任务...",
  "search.noResults": "未找到结果",
  "settings.theme": "主题",
  "settings.language": "语言",
  "settings.notifications": "通知",
  "settings.notifOn": "开",
  "settings.notifOff": "关",
  "a11y.skipToContent": "跳至内容",
  "a11y.expandAgent": "展开代理详情",
  "a11y.collapseAgent": "收起代理详情",
  "a11y.expandTask": "展开任务详情",
  "a11y.collapseTask": "收起任务详情",
  "a11y.progressBar": "进度: {percent}%",
  "error.connectionLost": "连接已断开",
  "error.retrying": "重新连接中...",
  "error.fileNotFound": "文件未找到",
};
```

## 5. WebView 번역 전달 프로토콜

### Extension → WebView

```typescript
// init 메시지에 포함
{
  type: "init",
  data: {
    teams: { ... },
    translations: {
      "status.completed": "완료",
      "status.inProgress": "진행중",
      // ... 선별된 WebView용 키만 포함
    },
    locale: "ko"
  }
}

// 언어 변경 시
{
  type: "translationsUpdate",
  translations: { ... },
  locale: "en"
}
```

### WebView에서 사용

```javascript
// dashboard-js.ts 내에서
function t(key, params) {
  var text = state.translations[key] || key;
  if (params) {
    Object.keys(params).forEach(function(k) {
      text = text.replace('{' + k + '}', params[k]);
    });
  }
  return text;
}

// 사용 예시
t('status.completed');                    // "완료"
t('a11y.progressBar', { percent: 67 });  // "진행률: 67%"
```

## 6. VS Code 설정 스키마

```json
{
  "ccFlowMonitor.language": {
    "type": "string",
    "enum": ["auto", "ko", "en", "ja", "zh"],
    "default": "auto",
    "enumDescriptions": [
      "Auto-detect (시스템 언어 자동 감지)",
      "한국어",
      "English",
      "日本語",
      "中文"
    ],
    "description": "Dashboard display language / 대시보드 표시 언어"
  }
}
```

## 7. 번역 품질 보장

### TypeScript 컴파일 타임 검증
모든 로케일 파일이 `ExtendedTranslationMap` 타입을 만족해야 하므로, 키 누락 시 컴파일 에러가 발생한다.

### 폴백 체인
```
현재 로케일 → ko (기준) → 키 자체 반환
```

### 보간 형식
- `{key}` 형태의 플레이스홀더 사용
- 예: `"{count}개 태스크"` + `{ count: 5 }` → `"5개 태스크"`

### 복수형 처리 전략

#### 전략 비교: ICU MessageFormat vs 별도 키 방식

| 기준 | ICU MessageFormat | 별도 키 방식 (채택) |
|------|-------------------|---------------------|
| 표현력 | 높음 (`{count, plural, one {# task} other {# tasks}}`) | 중간 (`task.count.one`, `task.count.other`) |
| 학습 곡선 | 높음 (ICU 문법 이해 필요) | 낮음 (키-값 패턴만 이해하면 됨) |
| 번들 크기 | 큼 (ICU 파서 라이브러리 필요, ~15KB gzip) | 없음 (추가 의존성 불필요) |
| TypeScript 연동 | 제한적 (런타임 문법 검증) | 강력 (컴파일 타임 키 검증) |
| 유지보수 | 번역 문자열 내 로직 혼재 | 키가 다소 많아지나 단순 |

#### 채택 근거

**별도 키 방식**을 선택한 이유:

1. **대상 언어의 복수형 단순성**: 지원 언어 4개 중 3개(한국어, 일본어, 중국어)가 복수형 구분이 없으므로, ICU MessageFormat의 복잡한 복수형 규칙이 과도한 설계임
2. **TypeScript 타입 안전성**: `ExtendedTranslationMap`에 모든 키를 명시적으로 선언하므로, 누락 키를 컴파일 타임에 검출 가능. ICU 방식은 문자열 내부 문법이라 정적 분석 불가
3. **번들 크기 최적화**: VS Code WebView 환경에서 추가 라이브러리 로딩은 초기 렌더링 지연을 유발
4. **core 패키지 호환**: `@cc-team-viewer/core`의 기존 i18n 시스템이 단순 키-값 보간 방식이므로, 동일 패턴 유지가 통합에 유리

#### 언어별 복수형 규칙

| 언어 | CLDR 복수형 카테고리 | 규칙 | 처리 방식 |
|------|---------------------|------|-----------|
| 한국어 (ko) | `other`만 존재 | 복수형 구분 없음 | 단일 키 사용 (`"task.count": "{count}개 태스크"`) |
| 영어 (en) | `one`, `other` | 1일 때 `one`, 나머지 `other` | 두 개 키 (`"task.count.one": "{count} task"`, `"task.count.other": "{count} tasks"`) |
| 일본어 (ja) | `other`만 존재 | 복수형 구분 없음 | 단일 키 사용 (`"task.count": "{count}個のタスク"`) |
| 중국어 (zh) | `other`만 존재 | 복수형 구분 없음 | 단일 키 사용 (`"task.count": "{count}个任务"`) |

#### 구현 패턴

```typescript
// 복수형 헬퍼 함수
function tPlural(baseKey: string, count: number, params?: Record<string, unknown>): string {
  var mergedParams = Object.assign({}, params, { count: count });

  // 영어처럼 복수형 구분이 있는 경우
  var pluralKey = baseKey + "." + getPluralCategory(count, currentLocale);
  if (state.translations[pluralKey]) {
    return t(pluralKey, mergedParams);
  }

  // 한국어/일본어/중국어처럼 복수형 구분이 없는 경우 기본 키 사용
  return t(baseKey, mergedParams);
}

// CLDR 기반 복수형 카테고리 판별
function getPluralCategory(count: number, locale: string): string {
  if (locale === "en") {
    return count === 1 ? "one" : "other";
  }
  // ko, ja, zh — 항상 other
  return "other";
}
```

```typescript
// 사용 예시
tPlural("task.count", 1);
// ko: "1개 태스크"
// en: "1 task"
// ja: "1個のタスク"

tPlural("task.count", 5);
// ko: "5개 태스크"
// en: "5 tasks"
// ja: "5個のタスク"
```

#### 번역 키 네이밍 규칙

- 복수형이 필요한 키: `{category}.{name}.one`, `{category}.{name}.other`
- 복수형이 불필요한 언어: `{category}.{name}` (접미사 없는 기본 키)로 폴백
- 새 복수형 키 추가 시, 영어에만 `.one`/`.other` 분리 키를 추가하고 나머지 3개 언어는 기본 키 하나로 처리

## 8. 번역 워크플로우 프로세스

### 8.1 워크플로우 개요

```
[1. 키 설계]  →  [2. 기준 번역 작성]  →  [3. 타 언어 번역]  →  [4. 리뷰]  →  [5. 검증]  →  [6. 배포]
  개발자            개발자(ko)           개발자/외부          코드 리뷰     자동 검증      릴리스
```

### 8.2 번역 주체

| 언어 | 번역 주체 | 비고 |
|------|-----------|------|
| 한국어 (ko) | 개발자 직접 | 기준 로케일. 모든 키의 원본 |
| 영어 (en) | 개발자 직접 | 기술 용어 중심이므로 개발자가 가장 적합 |
| 일본어 (ja) | 개발자 초안 + 네이티브 검수 | 초안은 개발자가 작성, 자연스러운 표현은 네이티브 화자가 검수 |
| 중국어 (zh) | 개발자 초안 + 네이티브 검수 | 일본어와 동일한 프로세스 |

> **원칙**: MVP 단계에서는 개발자가 4개 언어 모두 직접 작성한다. 사용자 피드백이나 커뮤니티 기여를 통해 점진적으로 네이티브 검수를 도입한다.

### 8.3 품질 검증 방법

#### 자동 검증 (CI 파이프라인)

1. **TypeScript 컴파일 검증**: 모든 로케일 파일이 `ExtendedTranslationMap` 타입을 만족하는지 확인. 키 누락 시 빌드 실패
   ```bash
   # tsconfig.json의 strict 모드가 누락 키를 컴파일 에러로 검출
   npm run build
   ```

2. **키 일관성 검사**: 기준 로케일(ko)에 존재하는 키가 모든 로케일에 존재하는지 확인
   ```typescript
   // 테스트 코드 예시
   import { ko } from "./locales/ko";
   import { en } from "./locales/en";
   import { ja } from "./locales/ja";
   import { zh } from "./locales/zh";

   describe("i18n 키 일관성", () => {
     const koKeys = Object.keys(ko);

     it("영어 로케일에 모든 키가 존재해야 한다", () => {
       koKeys.forEach((key) => {
         expect(en).toHaveProperty(key);
       });
     });

     it("일본어 로케일에 모든 키가 존재해야 한다", () => {
       koKeys.forEach((key) => {
         expect(ja).toHaveProperty(key);
       });
     });

     it("중국어 로케일에 모든 키가 존재해야 한다", () => {
       koKeys.forEach((key) => {
         expect(zh).toHaveProperty(key);
       });
     });
   });
   ```

3. **보간 변수 검사**: 각 로케일의 번역 문자열에 포함된 `{variable}` 플레이스홀더가 기준 로케일과 동일한지 검증
   ```typescript
   function extractPlaceholders(text: string): string[] {
     return (text.match(/\{(\w+)\}/g) || []).sort();
   }

   it("보간 변수가 기준 로케일과 일치해야 한다", () => {
     koKeys.forEach((key) => {
       const koPlaceholders = extractPlaceholders(ko[key]);
       const enPlaceholders = extractPlaceholders(en[key]);
       expect(enPlaceholders).toEqual(koPlaceholders);
     });
   });
   ```

#### 수동 검증

4. **스크린샷 비교 테스트**: 각 로케일로 전환한 WebView 스크린샷을 캡처하여 레이아웃 깨짐 확인
   - 특히 독일어 등 긴 문자열 언어 추가 시 필수 (현재 지원 언어에서는 영어가 가장 긴 경향)
   - 텍스트 잘림(truncation), 오버플로, 줄바꿈 위치 확인

5. **컨텍스트 리뷰**: 번역 문자열이 실제 UI에서 사용되는 맥락과 일치하는지 육안 확인
   - 버튼 레이블, 툴팁, 에러 메시지 등 UI 요소별로 확인

### 8.4 새 번역 키 추가 체크리스트

새로운 번역 키를 추가할 때 반드시 아래 항목을 확인한다:

- [ ] **1. 타입 정의**: `ExtendedTranslationMap`에 새 키와 타입 추가
- [ ] **2. 기준 번역**: `ko.ts`에 한국어 번역 추가
- [ ] **3. 전체 로케일**: `en.ts`, `ja.ts`, `zh.ts`에 각 언어 번역 추가
- [ ] **4. 복수형 확인**: 숫자와 함께 사용되는 키인 경우, 영어용 `.one`/`.other` 분리 키 필요 여부 판단
- [ ] **5. 보간 변수**: 플레이스홀더(`{variable}`)가 모든 로케일에서 동일한지 확인
- [ ] **6. WebView 전달**: WebView에서 사용하는 키라면 `init` 메시지의 번역 셀렉터에 포함
- [ ] **7. 컴파일 확인**: `npm run build` 성공 여부 확인
- [ ] **8. 테스트**: `npm run test:run`으로 키 일관성 테스트 통과 확인
- [ ] **9. UI 확인**: Extension Development Host에서 4개 언어 모두 전환하여 표시 확인

### 8.5 배포 파이프라인

```
로컬 개발                    CI                          릴리스
─────────                ─────────                   ─────────
키 추가/수정       →     TypeScript 컴파일 검증    →   vsix 패키지 생성
4개 로케일 작성    →     i18n 키 일관성 테스트     →   마켓플레이스 배포
PR 생성            →     보간 변수 검사            →   릴리스 노트에
코드 리뷰          →     단위 테스트               →   번역 변경사항 기재
```

- **핫픽스 번역**: 오역이나 UI 깨짐이 발견되면 패치 릴리스로 즉시 수정
- **번역 전용 PR**: 번역만 변경하는 PR은 `i18n:` 접두사를 사용 (예: `i18n: 일본어 검색 관련 번역 수정`)

## 9. 날짜/시간 포맷

각 로케일별 날짜/시간 포맷 규칙:

| 로케일 | 날짜 | 시간 | 상대 시간 |
|--------|------|------|-----------|
| ko | 2026년 3월 26일 | 오후 2:30 | 5분 전 |
| en | Mar 26, 2026 | 2:30 PM | 5m ago |
| ja | 2026年3月26日 | 14:30 | 5分前 |
| zh | 2026年3月26日 | 下午2:30 | 5分钟前 |

`Intl.DateTimeFormat`과 `Intl.RelativeTimeFormat` API를 우선 사용하되, 간단한 상대 시간은 core의 `timeAgo()` 함수를 활용한다.
