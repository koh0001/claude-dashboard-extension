<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-26 | Updated: 2026-03-26 -->

# dev-guide

## Purpose
기술 아키텍처와 개발 가이드 문서. 시스템 설계, 모듈 구조, 데이터 흐름, 보안 모델, 빌드/배포, 코딩 컨벤션, 테스트 전략, Git 워크플로우, PR 리뷰 프로세스를 정의한다.

## Key Files

| File | Description |
|------|-------------|
| `01-architecture.md` | 기술 아키텍처 (시스템 구조, 모듈 설계, 데이터 흐름, 보안, 성능, ADR) |
| `02-development-guide.md` | 개발 가이드 (환경 설정, 코딩 컨벤션, 에러 처리, 테마/i18n 가이드, PR 리뷰, 기여 가이드) |

## For AI Agents

### Working In This Directory
- 아키텍처 변경 시 ADR(아키텍처 결정 기록) 추가 필수 — "컨텍스트/결정/근거/대안/결과" 5섹션 구조
- 메시지 프로토콜(Extension ↔ WebView) 변경 시 양쪽 테이블 동시 수정
- 새 탭/뷰 추가 시 개발 가이드 섹션 6의 체크리스트 참고
- PR 리뷰 체크리스트(섹션 8.5)는 모든 코드 변경에 적용

### Key Conventions
- `var` 사용: dashboard-js.ts 내부 (템플릿 리터럴 함수 스코프)
- innerHTML 금지, addEventListener만 사용 (CSP 호환)
- JSON 파싱은 항상 graceful fail (불완전 JSON 대비)
- 커밋 형식: `<type>(<scope>): <description>`

### Cross-References
- CSS 변수 정의 → 디자인 가이드(`../design/01-ui-ux-design-guide.md`)
- i18n 키 구조 → i18n 설계(`../design/02-i18n-design.md`)
- 기능 요구사항 → PRD(`../plans/01-PRD.md`)

<!-- MANUAL: -->
