# CC Team Viewer 현황 분석 보고서

> 작성일: 2026-03-26
> 목적: 기존 cc-team-viewer 프로젝트를 분석하여 새로운 독립 VS Code 확장 프로젝트(Claude Flow Monitor)의 기반 자료로 활용

## 1. 기존 프로젝트 개요

**cc-team-viewer**는 Claude Code Agent Teams의 실시간 모니터링 도구로, `~/.claude/teams/`와 `~/.claude/tasks/` 디렉토리의 JSON 파일을 감시하여 팀원별 작업 상태, 태스크 진행률, 에이전트 간 메시지를 시각화한다.

현재 버전: **v0.1.6** (2026-03-06 기준)

## 2. 아키텍처 현황

### 모노레포 구조
```
cc-team-viewer/
├── packages/
│   ├── core/     → 파일 감시, JSON 파싱, 이벤트 발행 (순수 Node.js)
│   ├── tui/      → 터미널 UI (ink - React for CLI)
│   └── vscode/   → VS Code 확장프로그램 (WebView 패널)
```

### 레이어 구조
```
Extension Entry (extension.ts)
    ↓
Services Layer (WatcherService) — core TeamWatcher 어댑터
    ↓
Providers (DashboardProvider, TreeProvider)
    ↓
UI Layer (WebView HTML/CSS/JS, TreeView)
```

### 핵심 패턴
| 패턴 | 설명 |
|------|------|
| 불변 상태 관리 | 스냅샷 업데이트 시 새 Map/Set 생성 |
| 이벤트 에미터 체인 | Core → WatcherService → Providers 3단계 |
| 메시지 큐 + 핸드셰이크 | WebView ready 전까지 메시지 버퍼링 |
| Dirty Tab 최적화 | 활성 탭만 렌더링, 나머지 dirty 마킹 |
| 스냅샷 변경 감지 | JSON.stringify 비교로 불필요한 렌더 방지 |
| CSP 보안 | nonce 기반 인라인 스크립트, worker-src 'none' |
| 테마 변수 상속 | VS Code CSS 커스텀 프로퍼티 활용 |

## 3. 구현 완료 기능

### Core 패키지 (@cc-team-viewer/core)
- **TeamWatcher**: 파일 시스템 폴링 기반 변경 감지 (debounce 100ms)
- **파서**: ConfigParser, TaskParser, InboxParser — graceful skip on parse failure
- **이벤트**: team:created/updated/removed, task:created/updated/completed, message:received, agent:joined/left, snapshot:updated
- **i18n**: 4개 언어 (ko, en, ja, zh), 보간 지원, 로케일 순환
- **유틸리티**: topoSortLayers (DAG 위상 정렬)
- **타입**: TeamConfig, Task, InboxMessage, TeamSnapshot, AgentStatus, TeamStats 등 전체 정의

### VS Code 확장
| 기능 | 상태 | 구현 위치 |
|------|------|-----------|
| WebView 대시보드 (4탭) | ✅ | DashboardProvider + dashboard-js.ts |
| 트리뷰 사이드바 (팀→에이전트→태스크) | ✅ | TreeProvider |
| 상태 바 (완료율 %) | ✅ | extension.ts |
| 태스크 테이블 + 칸반 뷰 | ✅ | dashboard-js.ts |
| 태스크 의존성 DAG 시각화 | ✅ | dashboard-js.ts (topoSortLayers) |
| 메시지 스레딩 + 필터링 | ✅ | dashboard-js.ts |
| 에이전트 상세 확장 | ✅ | dashboard-js.ts |
| 태스크 상세 아코디언 | ✅ | dashboard-js.ts |
| 실시간 알림 (task/agent 이벤트) | ✅ | WatcherService |
| 다국어 지원 (4개 언어) | ✅ | WatcherService + i18n |
| 실시간 언어 전환 | ✅ | extension.ts + DashboardProvider |
| VS Code 테마 적응 | ✅ | dashboard-css.ts |
| CSP 보안 WebView | ✅ | DashboardProvider |
| Dirty Tab 렌더 최적화 | ✅ | dashboard-js.ts |
| 스냅샷 변경 감지 | ✅ | dashboard-js.ts |

### TUI (터미널 UI)
- Focus mode 키보드 내비게이션, 태스크 상세 패널, 칸반 보드, 에이전트 상세 확장
- 메시지 필터 + 스레드 그룹핑, Deps DAG 그래프, 다국어 지원

## 4. 파일 프로토콜

### 감시 대상 파일
| 파일 | 경로 | 형식 |
|------|------|------|
| 팀 설정 | `~/.claude/teams/{team}/config.json` | TeamConfig |
| 태스크 | `~/.claude/tasks/{team}/{id}.json` | Task |
| 메시지 | `~/.claude/teams/{team}/inboxes/{agent}.json` | InboxMessage[] |

### 주요 타입
```typescript
// 태스크 상태: "pending" | "in_progress" | "completed"
// 메시지 타입: "text" | "idle_notification" | "permission_request" | "plan_approval_request" | "shutdown_request" | "shutdown_approved" | "task_assignment"
// 백엔드 타입: "in-process" | "tmux" | "iterm2"
```

## 5. 기술 스택
| 영역 | 기술 |
|------|------|
| 언어 | TypeScript (ESM) |
| 런타임 | Node.js 20+ |
| 빌드 | tsup |
| 패키지 관리 | npm workspaces |
| TUI | ink (React for CLI) |
| VS Code | WebView API + @types/vscode |
| 테스트 | vitest |
| CSS | VS Code 테마 변수 기반 |

## 6. 식별된 개선 기회 (새 프로젝트 반영 사항)

### 아키텍처
- dashboard-js.ts가 975줄로 단일 파일에 과도한 책임 집중 → 모듈 분리 필요
- `var` 사용 제약 (템플릿 리터럴 내부) → 프레임워크 도입으로 해결 가능
- JSON.stringify 비교 방식 → 구조적 diff 알고리즘 도입 검토
- 메시지 50개 제한 → 가상 스크롤링으로 대량 메시지 처리

### UI/UX
- 다크/라이트 모드는 VS Code 테마에 의존하지만 커스텀 팔레트 부족
- 반응형 레이아웃 미흡 (패널 크기 변경 시 깨짐 가능성)
- 접근성(a11y) 고려 부족 (키보드 내비게이션, ARIA 속성)
- 그래프 시각화가 CSS Grid + SVG 인라인으로 제한적

### 기능 확장 가능성
- Claude Code 일반 워크플로우 (TODO, 파일 변경 등) 시각화 추가
- 타임라인 뷰 (시계열 기반 활동 추적)
- 성능 메트릭 대시보드 (에이전트별 처리 속도, 태스크 완료 시간)
- MCP 서버 연동 (Mac Mini의 MCP Jungle 통합)
- 알림 시스템 확장 (Slack/Discord 웹훅, 데스크톱 알림)

## 7. great-bardeen 폴더

`great-bardeen/`은 cc-team-viewer의 **작업 브랜치 스냅샷**으로, 동일한 모노레포 구조를 갖고 있으나 별도의 .claude/ 설정과 .omc/ 디렉토리를 포함. VS Code 확장의 다국어 README (ko, ja, zh)가 추가되어 있어 독립 배포를 준비하던 흔적으로 보임.

## 8. 새 프로젝트에 재사용할 자산

| 자산 | 재사용 방식 |
|------|-------------|
| @cc-team-viewer/core | npm 의존성으로 직접 사용 (TeamWatcher, 파서, 타입, i18n) |
| 이벤트 프로토콜 | 동일한 이벤트 맵 구조 유지 |
| 파일 프로토콜 타입 | TeamConfig, Task, InboxMessage 타입 그대로 활용 |
| i18n 키 구조 | TranslationMap 확장하여 새 키 추가 |
| CSS 테마 변수 | VS Code 커스텀 프로퍼티 패턴 재사용 |
| CSP 보안 모델 | nonce 기반 인라인 전략 유지 |

## 9. Gap Analysis (현재 → 목표)

기존 cc-team-viewer와 새 프로젝트(Claude Flow Monitor) 간의 영역별 격차를 분석한 결과이다.

| 영역 | 현재 상태 | 목표 상태 | 갭 크기 | Phase |
|------|-----------|-----------|---------|-------|
| 아키텍처 | 모노레포 패키지 (npm workspaces) | 독립 프로젝트 (core를 npm 의존성으로 사용) | Medium | 1 |
| UI 모듈화 | 단일 975줄 파일 (dashboard-js.ts) | 논리적 섹션별 구조화 (HTML/CSS/JS 분리) | High | 1 |
| 테마 | 기본 VS Code 변수 (`--vscode-*`) 직접 사용 | 시맨틱 토큰 (`--cfm-*`) + RGB 분해 + 다크/라이트/고대비 3모드 | Medium | 1 |
| 반응형 | 미흡 (패널 크기 변경 시 깨짐 가능성) | `@container` 쿼리 3단계 브레이크포인트 (400/600/900px) | Medium | 1 |
| 접근성 | 기본 수준 (키보드/ARIA 미고려) | WCAG 2.1 AA 준수 (키보드 내비게이션, ARIA 속성, 고대비 모드) | High | 1 |
| 그래프 | CSS Grid + SVG 인라인 (제한적 DAG 시각화) | D3.js / ELK.js 기반 인터랙티브 DAG 그래프 | High | 2 |
| 상태 관리 | JSON.stringify 비교 (전체 직렬화) | 구조적 diff 알고리즘 + 이벤트 배치 처리 | Medium | 2 |
| 컴포넌트 상태 | 미정의 (정상 상태만 고려) | 로딩/빈/에러 3상태 필수 처리 (스켈레톤 UI, 빈 상태 안내, 에러 복구) | Medium | 1 |
| 배포 | 수동 빌드 및 배포 | CI/CD 파이프라인 + VS Code Marketplace 자동 배포 | Low | 3 |
