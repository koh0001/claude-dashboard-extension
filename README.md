# Claude Flow Monitor

> Claude Code 워크플로우를 실시간으로 시각화하는 VS Code 확장프로그램

Claude Flow Monitor는 Claude Code Agent Teams의 **진행사항, 태스크 흐름, 에이전트 활동**을 실시간으로 모니터링하는 VS Code 확장입니다. `~/.claude/` 디렉토리의 파일을 감시하여 직관적인 대시보드로 시각화합니다.

## 주요 기능

**실시간 대시보드** — Overview, Tasks, Messages, Dependencies 4개 탭으로 팀 상태를 한눈에 파악합니다.

**칸반 보드** — 태스크를 Pending / In Progress / Completed 3단 칸반으로 시각화하며, 테이블 뷰와 토글할 수 있습니다.

**의존성 DAG 그래프** — 태스크 간 blockedBy/blocks 관계를 위상 정렬 기반 그래프로 시각화합니다.

**메시지 스레딩** — 에이전트 간 메시지를 발신자-수신자 쌍으로 그룹핑하고, All/Conversation/System 필터를 제공합니다.

**VS Code 테마 적응** — 다크 모드, 라이트 모드, 고대비 모드를 자동으로 감지하여 최적화된 UI를 표시합니다.

**다국어 지원** — 한국어, English, 日本語, 中文 4개 언어를 지원하며 실시간으로 전환할 수 있습니다.

## 설치

### VS Code Marketplace (예정)
```
ext install koh-dev.claude-flow-monitor
```

### 수동 설치
```bash
git clone https://github.com/koh0001/claude-flow-monitor.git
cd claude-flow-monitor
npm install
npm run build
npm run package
# 생성된 .vsix 파일을 VS Code에서 설치
```

## 사용법

1. VS Code에서 Activity Bar의 망원경 아이콘을 클릭합니다
2. 사이드바에서 팀 목록을 확인합니다
3. 팀을 선택하면 대시보드가 열립니다
4. 탭을 전환하여 Overview / Tasks / Messages / Deps를 확인합니다

### 커맨드

| 커맨드 | 설명 |
|--------|------|
| `Claude Flow Monitor: Open Dashboard` | 대시보드 열기 |
| `Claude Flow Monitor: Refresh` | 데이터 새로고침 |
| `Claude Flow Monitor: Select Team` | 팀 선택 |

### 설정

| 설정 | 기본값 | 설명 |
|------|--------|------|
| `ccFlowMonitor.language` | `auto` | 표시 언어 (auto/ko/en/ja/zh) |

### 환경 변수

| 변수 | 설명 |
|------|------|
| `CC_TEAM_VIEWER_CLAUDE_DIR` | ~/.claude 디렉토리 경로 오버라이드 |

## 요구사항

- VS Code 1.90.0 이상
- Node.js 20.0.0 이상
- Claude Code Agent Teams 활성화 (팀 데이터 필요)

## 개발

```bash
npm run build          # 빌드
npm run dev            # watch 모드
npm test               # 테스트
npm run lint           # 린트
npm run package        # .vsix 패키지 생성
```

디버깅: VS Code에서 `F5` 키로 Extension Development Host 실행

## 아키텍처

`@cc-team-viewer/core` 패키지를 의존성으로 사용하여 파일 감시, JSON 파싱, 이벤트 발행을 처리합니다. VS Code 확장은 WebView API를 통해 대시보드 UI를 제공하며, 트리뷰 사이드바와 상태 바로 빠른 접근을 지원합니다.

자세한 내용은 [기술 아키텍처 문서](docs/dev-guide/01-architecture.md)를 참조하세요.

## 문서

| 문서 | 설명 |
|------|------|
| [PRD (기획안)](docs/plans/01-PRD.md) | 제품 요구사항, 기능 명세, 릴리즈 계획 |
| [현황 분석](docs/plans/00-current-status-analysis.md) | 기존 cc-team-viewer 프로젝트 분석 |
| [UI/UX 디자인 가이드](docs/design/01-ui-ux-design-guide.md) | 컬러 시스템, 레이아웃, 컴포넌트, 접근성 |
| [i18n 설계](docs/design/02-i18n-design.md) | 다국어 아키텍처, 번역 키 구조 |
| [기술 아키텍처](docs/dev-guide/01-architecture.md) | 시스템 구조, 데이터 흐름, 보안 |
| [개발 가이드](docs/dev-guide/02-development-guide.md) | 개발 환경, 코딩 컨벤션, 테스트 |

## 라이선스

MIT

## 작성자

옥현 (koh-dev) — [GitHub](https://github.com/koh0001)
