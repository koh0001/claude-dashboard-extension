#!/bin/bash
# 테스트 데이터 설정 스크립트
# ~/.claude/ 디렉토리에 샘플 데이터를 복사하여 대시보드를 테스트할 수 있게 합니다.
#
# 사용법:
#   ./test-data/setup.sh          # 테스트 데이터 설치
#   ./test-data/setup.sh --clean  # 테스트 데이터 제거

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CLAUDE_DIR="${HOME}/.claude"
TEAM_NAME="cfm-dev-team"

# 색상 출력
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

info()  { echo -e "${GREEN}[INFO]${NC} $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }

# 정리 모드
if [[ "${1:-}" == "--clean" ]]; then
  info "테스트 데이터 제거 중..."
  rm -rf "${CLAUDE_DIR}/teams/${TEAM_NAME}"
  rm -rf "${CLAUDE_DIR}/tasks/${TEAM_NAME}"
  rm -rf "${CLAUDE_DIR}/projects/abc123hash"
  info "완료. 테스트 데이터가 제거되었습니다."
  exit 0
fi

info "Claude Flow Monitor 테스트 데이터 설정 시작"
info "대상: ${CLAUDE_DIR}"

# 디렉토리 생성
mkdir -p "${CLAUDE_DIR}/teams/${TEAM_NAME}/inboxes"
mkdir -p "${CLAUDE_DIR}/tasks/${TEAM_NAME}"
mkdir -p "${CLAUDE_DIR}/projects/abc123hash/sessions"

# 팀 설정 복사
cp "${SCRIPT_DIR}/teams/${TEAM_NAME}/config.json" \
   "${CLAUDE_DIR}/teams/${TEAM_NAME}/config.json"
info "팀 설정 복사 완료: ${TEAM_NAME}"

# 태스크 복사
for f in "${SCRIPT_DIR}/tasks/${TEAM_NAME}"/*.json; do
  cp "$f" "${CLAUDE_DIR}/tasks/${TEAM_NAME}/$(basename "$f")"
done
TASK_COUNT=$(ls "${CLAUDE_DIR}/tasks/${TEAM_NAME}"/*.json 2>/dev/null | wc -l | tr -d ' ')
info "태스크 복사 완료: ${TASK_COUNT}개"

# 인박스 메시지 복사
for f in "${SCRIPT_DIR}/teams/${TEAM_NAME}/inboxes"/*.json; do
  cp "$f" "${CLAUDE_DIR}/teams/${TEAM_NAME}/inboxes/$(basename "$f")"
done
INBOX_COUNT=$(ls "${CLAUDE_DIR}/teams/${TEAM_NAME}/inboxes"/*.json 2>/dev/null | wc -l | tr -d ' ')
info "인박스 복사 완료: ${INBOX_COUNT}개 에이전트"

# 세션 JSONL 복사
for f in "${SCRIPT_DIR}/projects/abc123hash/sessions"/*.jsonl; do
  cp "$f" "${CLAUDE_DIR}/projects/abc123hash/sessions/$(basename "$f")"
done
SESSION_COUNT=$(ls "${CLAUDE_DIR}/projects/abc123hash/sessions"/*.jsonl 2>/dev/null | wc -l | tr -d ' ')
info "세션 복사 완료: ${SESSION_COUNT}개 파일"

echo ""
info "=== 테스트 데이터 설정 완료 ==="
echo ""
echo "  팀:        ${TEAM_NAME}"
echo "  에이전트:   team-lead, backend-dev, frontend-dev, qa-engineer"
echo "  태스크:     ${TASK_COUNT}개 (완료 3, 진행 중 2, 대기 2, 차단 1)"
echo "  메시지:     $(cat "${CLAUDE_DIR}/teams/${TEAM_NAME}/inboxes"/*.json | grep -c '"from"')개"
echo "  세션 활동:  $(wc -l < "${CLAUDE_DIR}/projects/abc123hash/sessions/session-2026-03-26.jsonl" | tr -d ' ')개"
echo ""
echo "  VS Code에서 Claude Flow Monitor > Open Dashboard 실행"
echo "  또는 설정에서 ccFlowMonitor.claudeDir을 지정하세요."
echo ""
echo "  제거: ./test-data/setup.sh --clean"
