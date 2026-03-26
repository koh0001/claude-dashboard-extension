<!-- Generated: 2026-03-26 | Updated: 2026-03-26 -->

# Claude Flow Monitor

## Purpose
Claude Code Agent Teams의 진행사항과 워크플로우를 실시간 시각화하는 독립 VS Code 확장프로그램. 기존 cc-team-viewer의 Agent Teams 모니터링을 계승하면서, 향상된 UI/UX와 확장 가능한 아키텍처를 제공한다.

## Key Files

| File | Description |
|------|-------------|
| `CLAUDE.md` | Claude Code 프로젝트 컨텍스트 (커맨드, 아키텍처, 컨벤션) |
| `README.md` | 프로젝트 설명 (영어) |
| `README.ko.md` | 프로젝트 설명 (한국어) |

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `docs/` | 기획, 디자인, 개발 가이드 문서 (see `docs/AGENTS.md`) |
| `src/` | 확장 소스 코드 — 아직 미생성 (Phase 1 구현 시 생성 예정) |

## For AI Agents

### Working In This Directory
- **주석/문서 언어**: 모든 주석, 문서, 커밋 메시지는 한국어로 작성
- **TypeScript strict mode** + ESM (import/export)
- **불변 패턴 필수**: 상태 변경 시 새 객체 생성, 절대 mutation 금지
- **색상 하드코딩 금지**: CSS 변수(`--cfm-*`) 또는 디자인 토큰으로만 참조
- **WebView 보안**: innerHTML 금지, onclick 속성 금지, escapeHtml() 필수, nonce 기반 CSP

### Key Dependencies
- `@cc-team-viewer/core` — 파일 감시, 파싱, 타입, i18n (런타임)
- `@types/vscode` ≥ 1.90.0 — VS Code API 타입 (개발)
- `tsup` — 번들러
- `vitest` — 테스트 프레임워크

### Testing Requirements
- `npm test` — vitest watch 모드
- `npm run test:run` — CI용 1회 실행
- 최소 커버리지 80%
- F5로 Extension Development Host 디버깅

### Common Patterns
- 이벤트 에미터 체인: Core → WatcherService → Providers
- 메시지 큐 + 핸드셰이크: WebView ready 전까지 버퍼링
- Dirty Tab 최적화: 활성 탭만 렌더, 나머지 dirty 마킹
- 4개 언어 지원 (ko, en, ja, zh): 새 키 추가 시 4개 로케일 파일 모두 업데이트

<!-- MANUAL: -->
