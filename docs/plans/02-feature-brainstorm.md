# Claude Flow Monitor — 기능 브레인스토밍

> 작성일: 2026-03-26
> 목적: 프로젝트 포커스 대시보드로의 방향 전환 및 신규 기능 아이디어 도출

## 1. 방향 전환

### 기존 방향
- "모든 Claude Code Agent Teams를 보여주는 모니터링 도구"

### 새로운 방향
- **"현재 열린 VS Code 프로젝트에 포커스된 Claude Code 활동 대시보드"**
- 내 프로젝트에서 Claude Code가 뭘 하고 있는지 한눈에 파악
- Agent Teams뿐 아니라 일반 Claude Code 세션(파일 편집, 커맨드, 에러)도 포괄

## 2. 3관점 아이디에이션

### Product Manager 관점

| # | 아이디어 | 설명 |
|---|----------|------|
| PM-1 | 프로젝트 스코프 필터링 | workspaceFolder 경로 기준으로 현재 프로젝트 활동만 표시 |
| PM-2 | 세션 타임라인 | Claude Code 세션 단위 시간축 표시 |
| PM-3 | 파일 변경 히트맵 | AI가 수정한 파일을 디렉토리 트리에 히트맵 표시 |
| PM-4 | TODO/태스크 연동 | TodoWrite/TaskCreate 활동을 대시보드에 통합 |
| PM-5 | AI 활동 요약 리포트 | 세션/일 단위 요약 자동 생성 |

### Product Designer 관점

| # | 아이디어 | 설명 |
|---|----------|------|
| DS-1 | 통합 Activity Feed | 파일 편집, 커맨드, 태스크 변경을 하나의 피드로 통합 |
| DS-2 | 미니 대시보드 | 상태 바 팝업으로 핵심 메트릭 3~4개만 경량 표시 |
| DS-3 | 파일별 AI 기여도 뱃지 | Explorer/탭에 AI 수정 파일 뱃지 표시 |
| DS-4 | 진행률 위젯 | 현재 작업의 진행률 상시 표시 |
| DS-5 | 컨텍스트 패널 | 현재 파일의 AI 활동 이력을 사이드바에 표시 |

### Software Engineer 관점

| # | 아이디어 | 설명 |
|---|----------|------|
| ENG-1 | .claude/ 통합 감시 | 전역 + 로컬 .claude/ 디렉토리 동시 감시 어댑터 |
| ENG-2 | Git Diff 연동 | Co-Authored-By 태그로 Claude 커밋 자동 식별 |
| ENG-3 | MCP 서버 모드 | 대시보드 데이터를 MCP로 노출 |
| ENG-4 | 세션 파일 파싱 | 세션 JSONL 파싱으로 일반 세션도 모니터링 |
| ENG-5 | 워크스페이스 매칭 엔진 | workspaceFolder → ~/.claude/projects/ 해시 매칭 |

## 3. Top 5 우선순위

| 순위 | 아이디어 | 원본 | Phase | 핵심 가정 |
|------|----------|------|-------|-----------|
| 1 | 워크스페이스 매칭 + 프로젝트 스코프 필터링 | ENG-5 + PM-1 | 1 | 프로젝트 해시 역매핑 가능 여부 |
| 2 | 세션 파일 파싱 + Activity Feed | ENG-4 + DS-1 | 1 | JSONL 구조 안정성, 실시간 감시 성능 |
| 3 | 파일 변경 히트맵 + AI 기여도 뱃지 | PM-3 + DS-3 | 2 | FileDecorationProvider API 표현력 |
| 4 | Git Diff 연동 | ENG-2 | 2 | Co-Authored-By 태그 일관성 |
| 5 | 미니 대시보드 (상태 바 팝업) | DS-2 | 1 | StatusBarItem tooltip/popup 한계 |

## 4. 기능 → Phase 매핑

### Phase 1 (MVP) — 기존 + 신규
- 기존: Agent Teams 대시보드 (Overview/Tasks/Messages/Deps), 트리뷰, 상태 바, 테마, i18n, 알림
- **신규: 워크스페이스 매칭 엔진** (모든 프로젝트 스코핑의 기반)
- **신규: 세션 파일 파싱** (일반 Claude Code 세션 데이터 수집)
- **신규: 통합 Activity Feed** (실시간 활동 피드 탭)
- **신규: 미니 대시보드** (상태 바 확장)

### Phase 2 (향상) — 기존 + 신규
- 기존: 타임라인 뷰, 성능 메트릭, D3.js 그래프, 검색/필터
- **신규: 파일 변경 히트맵**
- **신규: AI 기여도 뱃지** (FileDecorationProvider)
- **신규: Git Diff 연동** (Co-Authored-By 커밋 식별)
- **신규: TODO/태스크 연동**

### Phase 3 (확장) — 기존 + 신규
- 기존: MCP 서버 연동, 알림 확장, 내보내기
- **신규: MCP 서버 모드** (대시보드 데이터 노출)
- **신규: AI 활동 요약 리포트**
- **신규: 컨텍스트 패널** (파일별 AI 이력)
