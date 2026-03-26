<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-26 | Updated: 2026-03-26 -->

# design

## Purpose
UI/UX 디자인 가이드와 다국어(i18n) 설계 문서. 컬러 시스템, 타이포그래피, 레이아웃, 컴포넌트 명세, 접근성, 애니메이션, 번역 전략을 정의한다.

## Key Files

| File | Description |
|------|-------------|
| `01-ui-ux-design-guide.md` | 전체 UI/UX 가이드 (컬러, 타이포, 레이아웃, 컴포넌트, 상태, 애니메이션, 접근성) |
| `02-i18n-design.md` | 다국어 설계 (번역 키, 로케일 감지, 복수형, 워크플로우, WebView 프로토콜) |

## For AI Agents

### Working In This Directory
- **색상 리터럴 금지**: `:root` 정의부 외에 `#hex`, `rgb()` 직접 사용 불가. `var(--cfm-*)` 사용
- CSS 변수는 RGB 분해 패턴 사용: `--cfm-status-completed-base: 76, 175, 80;`
- 다크/라이트/고대비 3모드 모두 정의 필수
- 새 컴포넌트 추가 시 로딩/빈/에러 3상태와 인터랙션 5상태(default/hover/focus/active/disabled) 명세 필수
- i18n 키 추가 시 4개 로케일(ko, en, ja, zh) 모두 작성 + `WEBVIEW_TRANSLATION_KEYS` 등록

### Cross-References
- CSS 변수명 → 아키텍처 문서(`../dev-guide/01-architecture.md`)의 테마 시스템
- i18n 키 → 개발 가이드(`../dev-guide/02-development-guide.md`) 섹션 5
- 컴포넌트 명세 → PRD(`../plans/01-PRD.md`)의 기능 요구사항

<!-- MANUAL: -->
