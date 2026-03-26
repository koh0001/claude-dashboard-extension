# Claude Flow Monitor

> Claude Code 워크플로우를 실시간으로 시각화하는 VS Code 확장프로그램

## 주요 기능

- **실시간 대시보드**: Overview, Tasks, Messages, Dependencies 4개 탭
- **칸반 보드**: 태스크를 Pending/In Progress/Completed 3단 칸반으로 시각화
- **의존성 DAG 그래프**: 태스크 간 관계를 위상 정렬 기반 그래프로 시각화
- **메시지 스레딩**: 에이전트 간 메시지 그룹핑 + 필터링
- **VS Code 테마 적응**: 다크/라이트/고대비 모드 자동 감지
- **다국어**: 한국어, English, 日本語, 中文

## 설치

```bash
# VS Code Marketplace (예정)
ext install koh-dev.claude-flow-monitor

# 수동 설치
git clone https://github.com/koh0001/claude-flow-monitor.git
cd claude-flow-monitor && npm install && npm run build && npm run package
```

## 사용법

1. Activity Bar에서 망원경 아이콘 클릭
2. 사이드바에서 팀 선택
3. 대시보드에서 실시간 모니터링

## 개발

```bash
npm run build    # 빌드
npm run dev      # watch 모드
npm test         # 테스트
npm run package  # .vsix 패키지
```

## 라이선스

MIT — 옥현 (koh-dev)
