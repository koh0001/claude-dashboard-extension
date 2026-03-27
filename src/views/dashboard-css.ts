/**
 * 대시보드 CSS — Stitch 2.0 기반 적응형 테마 시스템 + 반응형
 *
 * 적응형 전략:
 * 1단계: --vscode-* 변수를 통한 사용자 테마 자동 상속 (모든 테마 호환)
 * 2단계: data-vscode-theme-kind 속성으로 다크/라이트/고대비 분기
 * 3단계: 도메인 특화 --cfm-* 시맨틱 토큰으로 일관성 보장
 *
 * Stitch 프로젝트: https://stitch.withgoogle.com/projects/11841507411109514040
 */

export function getDashboardCss(): string {
  return `
/* ============================================================
   1. 적응형 시맨틱 토큰 (CSS Custom Properties)
   --vscode-* 변수를 래핑하여 어떤 사용자 테마에서도 작동
   ============================================================ */
:root {
  /* --- 배경 계층 (사용자 테마 자동 적응) --- */
  --cfm-bg-primary: var(--vscode-editor-background);
  --cfm-bg-secondary: var(--vscode-sideBar-background);
  --cfm-bg-tertiary: var(--vscode-editorWidget-background);
  --cfm-bg-hover: var(--vscode-list-hoverBackground);
  --cfm-bg-active: var(--vscode-list-activeSelectionBackground);
  --cfm-bg-input: var(--vscode-input-background);

  /* --- 텍스트 계층 (사용자 테마 자동 적응) --- */
  --cfm-text-primary: var(--vscode-foreground);
  --cfm-text-secondary: var(--vscode-descriptionForeground);
  --cfm-text-muted: var(--vscode-disabledForeground);
  --cfm-text-link: var(--vscode-textLink-foreground);
  --cfm-text-link-hover: var(--vscode-textLink-activeForeground, var(--cfm-text-link));

  /* --- 테두리 (사용자 테마 자동 적응) --- */
  --cfm-border-default: var(--vscode-panel-border);
  --cfm-border-active: var(--vscode-focusBorder);
  --cfm-border-input: var(--vscode-input-border, var(--cfm-border-default));

  /* --- 배지 (사용자 테마 자동 적응) --- */
  --cfm-badge-bg: var(--vscode-badge-background);
  --cfm-badge-fg: var(--vscode-badge-foreground);

  /* --- 버튼 (사용자 테마 자동 적응) --- */
  --cfm-btn-bg: var(--vscode-button-background);
  --cfm-btn-fg: var(--vscode-button-foreground);
  --cfm-btn-hover-bg: var(--vscode-button-hoverBackground);
  --cfm-btn-secondary-bg: var(--vscode-button-secondaryBackground, var(--cfm-overlay-light));
  --cfm-btn-secondary-fg: var(--vscode-button-secondaryForeground, var(--cfm-text-primary));

  /* --- 태스크 상태 (RGB 분해 → 투명도 조절 용이) --- */
  --cfm-status-completed-base: 76, 175, 80;
  --cfm-status-in-progress-base: 255, 152, 0;
  --cfm-status-pending-base: 158, 158, 158;
  --cfm-status-blocked-base: 244, 67, 54;
  --cfm-status-completed: rgb(var(--cfm-status-completed-base));
  --cfm-status-in-progress: rgb(var(--cfm-status-in-progress-base));
  --cfm-status-pending: rgb(var(--cfm-status-pending-base));
  --cfm-status-blocked: rgb(var(--cfm-status-blocked-base));

  /* --- 에이전트 색상 --- */
  --cfm-agent-active-base: 33, 150, 243;
  --cfm-agent-idle-base: 120, 144, 156;
  --cfm-agent-lead-base: 255, 215, 0;
  --cfm-agent-active: rgb(var(--cfm-agent-active-base));
  --cfm-agent-idle: rgb(var(--cfm-agent-idle-base));
  --cfm-agent-lead: rgb(var(--cfm-agent-lead-base));

  /* --- 메시지 타입 --- */
  --cfm-msg-system-base: 124, 77, 255;
  --cfm-msg-permission-base: 233, 30, 99;
  --cfm-msg-system: rgb(var(--cfm-msg-system-base));
  --cfm-msg-permission: rgb(var(--cfm-msg-permission-base));

  /* --- Activity 유형별 색상 --- */
  --cfm-activity-file: var(--cfm-text-primary);
  --cfm-activity-command: rgb(var(--cfm-agent-active-base));
  --cfm-activity-task: var(--cfm-status-completed);
  --cfm-activity-message: rgb(var(--cfm-msg-system-base));
  --cfm-activity-error: var(--cfm-status-blocked);

  /* --- 타이포그래피 --- */
  --cfm-font-family: var(--vscode-font-family);
  --cfm-font-size-xs: 11px;
  --cfm-font-size-sm: 12px;
  --cfm-font-size-md: 13px;
  --cfm-font-size-lg: 16px;
  --cfm-font-size-xl: 20px;
  --cfm-font-weight-normal: 400;
  --cfm-font-weight-medium: 500;
  --cfm-font-weight-bold: 600;
  --cfm-line-height: 1.5;
  --cfm-font-mono: var(--vscode-editor-font-family);

  /* --- 스페이싱 --- */
  --cfm-space-xs: 4px;
  --cfm-space-sm: 8px;
  --cfm-space-md: 12px;
  --cfm-space-lg: 16px;
  --cfm-space-xl: 24px;
  --cfm-space-2xl: 32px;
  --cfm-radius-sm: 4px;
  --cfm-radius-md: 6px;
  --cfm-radius-lg: 8px;

  /* --- 트랜지션 --- */
  --cfm-transition-fast: 100ms ease-out;
  --cfm-transition-normal: 150ms ease-out;
  --cfm-transition-slow: 250ms ease-out;
}

/* ============================================================
   2. 테마 분기 — 다크 모드 (Stitch 다크: #1e1e1e 기반)
   ============================================================ */
body[data-vscode-theme-kind="vscode-dark"] {
  --cfm-overlay-subtle: rgba(255,255,255,0.03);
  --cfm-overlay-light: rgba(255,255,255,0.06);
  --cfm-overlay-medium: rgba(255,255,255,0.09);
  --cfm-overlay-strong: rgba(255,255,255,0.12);
  --cfm-overlay-intense: rgba(255,255,255,0.18);
  --cfm-shadow-card: 0 2px 8px rgba(0,0,0,0.3);
  --cfm-shadow-popup: 0 4px 16px rgba(0,0,0,0.5);
  --cfm-scrollbar-thumb: rgba(255,255,255,0.1);
  --cfm-scrollbar-thumb-hover: rgba(255,255,255,0.2);
  --cfm-agent-card-mix: 8%;
  --cfm-kanban-pending-bg: rgba(158,158,158,0.05);
  --cfm-kanban-progress-bg: rgba(255,152,0,0.05);
  --cfm-kanban-completed-bg: rgba(76,175,80,0.05);
}

/* ============================================================
   3. 테마 분기 — 라이트 모드 (Stitch 라이트: #ffffff 기반)
   ============================================================ */
body[data-vscode-theme-kind="vscode-light"] {
  --cfm-overlay-subtle: rgba(0,0,0,0.02);
  --cfm-overlay-light: rgba(0,0,0,0.04);
  --cfm-overlay-medium: rgba(0,0,0,0.07);
  --cfm-overlay-strong: rgba(0,0,0,0.10);
  --cfm-overlay-intense: rgba(0,0,0,0.14);
  --cfm-shadow-card: 0 1px 4px rgba(0,0,0,0.1);
  --cfm-shadow-popup: 0 2px 12px rgba(0,0,0,0.15);
  --cfm-scrollbar-thumb: rgba(0,0,0,0.1);
  --cfm-scrollbar-thumb-hover: rgba(0,0,0,0.2);

  /* 라이트 모드에서 상태 색상을 더 진하게 (대비 확보) */
  --cfm-status-completed-base: 46, 125, 50;
  --cfm-status-in-progress-base: 230, 81, 0;
  --cfm-status-pending-base: 97, 97, 97;
  --cfm-status-blocked-base: 198, 40, 40;

  /* 에이전트 색상도 진하게 */
  --cfm-agent-active-base: 25, 118, 210;
  --cfm-agent-lead-base: 184, 134, 11;

  /* 카드 혼합 비율 (라이트에서는 12%) */
  --cfm-agent-card-mix: 12%;
  --cfm-kanban-pending-bg: rgba(97,97,97,0.06);
  --cfm-kanban-progress-bg: rgba(230,81,0,0.06);
  --cfm-kanban-completed-bg: rgba(46,125,50,0.06);
}

/* ============================================================
   4. 테마 분기 — 고대비 다크 모드
   ============================================================ */
body[data-vscode-theme-kind="vscode-high-contrast"] {
  --cfm-overlay-subtle: rgba(255,255,255,0.05);
  --cfm-overlay-light: rgba(255,255,255,0.08);
  --cfm-overlay-medium: rgba(255,255,255,0.12);
  --cfm-overlay-strong: rgba(255,255,255,0.16);
  --cfm-overlay-intense: rgba(255,255,255,0.24);
  --cfm-shadow-card: none;
  --cfm-shadow-popup: none;
  --cfm-scrollbar-thumb: rgba(255,255,255,0.2);
  --cfm-scrollbar-thumb-hover: rgba(255,255,255,0.4);

  /* 고대비: 명도/채도를 높여 가독성 확보 */
  --cfm-status-completed-base: 0, 230, 118;
  --cfm-status-in-progress-base: 255, 171, 0;
  --cfm-status-pending-base: 189, 189, 189;
  --cfm-status-blocked-base: 255, 23, 68;
  --cfm-border-default: var(--vscode-contrastBorder);
  --cfm-agent-card-mix: 15%;
  --cfm-kanban-pending-bg: rgba(189,189,189,0.08);
  --cfm-kanban-progress-bg: rgba(255,171,0,0.08);
  --cfm-kanban-completed-bg: rgba(0,230,118,0.08);
}

/* ============================================================
   5. 테마 분기 — 고대비 라이트 모드
   ============================================================ */
body[data-vscode-theme-kind="vscode-high-contrast-light"] {
  --cfm-overlay-subtle: rgba(0,0,0,0.04);
  --cfm-overlay-light: rgba(0,0,0,0.07);
  --cfm-overlay-medium: rgba(0,0,0,0.11);
  --cfm-overlay-strong: rgba(0,0,0,0.15);
  --cfm-overlay-intense: rgba(0,0,0,0.22);
  --cfm-shadow-card: none;
  --cfm-shadow-popup: none;
  --cfm-scrollbar-thumb: rgba(0,0,0,0.2);
  --cfm-scrollbar-thumb-hover: rgba(0,0,0,0.4);

  --cfm-status-completed-base: 27, 94, 32;
  --cfm-status-in-progress-base: 191, 54, 12;
  --cfm-status-pending-base: 66, 66, 66;
  --cfm-status-blocked-base: 183, 28, 28;
  --cfm-border-default: var(--vscode-contrastBorder);
  --cfm-agent-active-base: 13, 71, 161;
  --cfm-agent-lead-base: 130, 94, 8;
  --cfm-agent-card-mix: 15%;
  --cfm-kanban-pending-bg: rgba(66,66,66,0.08);
  --cfm-kanban-progress-bg: rgba(191,54,12,0.08);
  --cfm-kanban-completed-bg: rgba(27,94,32,0.08);
}

/* === 3. 기본 레이아웃 === */
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: var(--cfm-font-family);
  font-size: var(--cfm-font-size-sm);
  color: var(--cfm-text-primary);
  background: var(--cfm-bg-primary);
  line-height: 1.5;
  container-type: inline-size;
  container-name: dashboard;
}

.cfm-root {
  padding: var(--cfm-space-md);
  max-width: 1200px;
  margin: 0 auto;
}

/* Skip to content (접근성) */
.cfm-skip-link {
  position: absolute;
  left: -9999px;
  top: 0;
  z-index: 100;
  padding: var(--cfm-space-sm) var(--cfm-space-md);
  background: var(--cfm-badge-bg);
  color: var(--cfm-badge-fg);
  border-radius: var(--cfm-radius-sm);
}
.cfm-skip-link:focus { left: var(--cfm-space-sm); }

/* === 4. 탭 네비게이션 === */
.cfm-tabs {
  display: flex;
  gap: var(--cfm-space-xs);
  border-bottom: 1px solid var(--cfm-border-default);
  margin-bottom: var(--cfm-space-md);
  padding-bottom: var(--cfm-space-xs);
  flex-wrap: wrap;
}
.cfm-tab {
  padding: var(--cfm-space-xs) var(--cfm-space-md);
  background: none;
  border: none;
  color: var(--cfm-text-secondary);
  font-size: var(--cfm-font-size-sm);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all var(--cfm-transition-fast);
  border-radius: var(--cfm-radius-sm) var(--cfm-radius-sm) 0 0;
}
.cfm-tab:hover { color: var(--cfm-text-primary); background: var(--cfm-bg-hover); }
.cfm-tab[aria-selected="true"] {
  color: var(--cfm-text-primary);
  border-bottom-color: var(--cfm-border-active);
}
.cfm-tab:focus-visible {
  outline: 2px solid var(--cfm-border-active);
  outline-offset: -2px;
}

/* === 5. Stats Bar === */
.cfm-stats {
  display: flex;
  gap: var(--cfm-space-md);
  padding: var(--cfm-space-sm) var(--cfm-space-md);
  background: var(--cfm-overlay-subtle);
  border-radius: var(--cfm-radius-md);
  margin-bottom: var(--cfm-space-md);
  flex-wrap: wrap;
  align-items: center;
}
.cfm-stat {
  display: flex;
  align-items: center;
  gap: var(--cfm-space-xs);
  font-size: var(--cfm-font-size-sm);
}
.cfm-stat-value { font-weight: 600; }
.cfm-stat-label { color: var(--cfm-text-secondary); }
.cfm-progress-bar {
  flex: 1;
  min-width: 100px;
  height: 6px;
  background: var(--cfm-overlay-medium);
  border-radius: 3px;
  overflow: hidden;
}
.cfm-progress-fill {
  height: 100%;
  background: var(--cfm-status-completed);
  border-radius: 3px;
  transition: width var(--cfm-transition-normal);
}

/* === 6. 에이전트 카드 그리드 === */
.cfm-agent-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: var(--cfm-space-md);
  margin-bottom: var(--cfm-space-lg);
}
.cfm-agent-card {
  padding: var(--cfm-space-md);
  background: var(--cfm-bg-tertiary);
  border-radius: var(--cfm-radius-md);
  border-left: 3px solid var(--agent-color, var(--cfm-agent-active));
  box-shadow: var(--cfm-shadow-card);
  transition: background var(--cfm-transition-fast);
}
.cfm-agent-card:hover { background: var(--cfm-bg-hover); }
.cfm-agent-card[data-status="idle"] { opacity: 0.7; }
.cfm-agent-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--cfm-space-xs);
}
.cfm-agent-name { font-weight: 600; font-size: var(--cfm-font-size-md); }
.cfm-agent-model {
  font-size: var(--cfm-font-size-xs);
  color: var(--cfm-text-muted);
  padding: 1px 6px;
  background: var(--cfm-overlay-light);
  border-radius: var(--cfm-radius-sm);
}
.cfm-agent-desc { color: var(--cfm-text-secondary); margin-bottom: var(--cfm-space-xs); }
.cfm-agent-task {
  font-size: var(--cfm-font-size-xs);
  color: var(--cfm-text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.cfm-lead-badge {
  color: var(--cfm-agent-lead);
  font-size: var(--cfm-font-size-xs);
}

/* === 7. 태스크 테이블 === */
.cfm-task-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--cfm-font-size-sm);
}
.cfm-task-table th {
  text-align: left;
  padding: var(--cfm-space-xs) var(--cfm-space-sm);
  border-bottom: 1px solid var(--cfm-border-default);
  color: var(--cfm-text-secondary);
  font-weight: 500;
}
.cfm-task-table td {
  padding: var(--cfm-space-xs) var(--cfm-space-sm);
  border-bottom: 1px solid var(--cfm-overlay-subtle);
}
.cfm-task-table tr:hover td { background: var(--cfm-bg-hover); }

/* 상태 뱃지 */
.cfm-status-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 1px 8px;
  border-radius: 10px;
  font-size: var(--cfm-font-size-xs);
}
.cfm-status-badge[data-status="completed"] {
  background: rgba(var(--cfm-status-completed-base), 0.15);
  color: var(--cfm-status-completed);
}
.cfm-status-badge[data-status="in_progress"] {
  background: rgba(var(--cfm-status-in-progress-base), 0.15);
  color: var(--cfm-status-in-progress);
}
.cfm-status-badge[data-status="pending"] {
  background: rgba(var(--cfm-status-pending-base), 0.15);
  color: var(--cfm-status-pending);
}

/* === 8. 메시지 스트림 === */
.cfm-message-list {
  display: flex;
  flex-direction: column;
  gap: var(--cfm-space-xs);
  max-height: 500px;
  overflow-y: auto;
}
.cfm-message {
  padding: var(--cfm-space-sm) var(--cfm-space-md);
  background: var(--cfm-overlay-subtle);
  border-radius: var(--cfm-radius-md);
}
.cfm-message-header {
  display: flex;
  justify-content: space-between;
  font-size: var(--cfm-font-size-xs);
  color: var(--cfm-text-secondary);
  margin-bottom: var(--cfm-space-xs);
}
.cfm-message-from { font-weight: 600; color: var(--cfm-text-primary); }
.cfm-message-content { word-break: break-word; }
.cfm-message[data-type="system"] { border-left: 2px solid var(--cfm-msg-system); }
.cfm-message[data-type="permission"] { border-left: 2px solid var(--cfm-msg-permission); }
.cfm-message-filters {
  display: flex;
  gap: var(--cfm-space-xs);
  margin-bottom: var(--cfm-space-sm);
}
.cfm-filter-btn {
  padding: 2px 10px;
  border: 1px solid var(--cfm-border-default);
  background: none;
  color: var(--cfm-text-secondary);
  border-radius: 12px;
  font-size: var(--cfm-font-size-xs);
  cursor: pointer;
  transition: all var(--cfm-transition-fast);
}
.cfm-filter-btn[aria-pressed="true"] {
  background: var(--cfm-badge-bg);
  color: var(--cfm-badge-fg);
  border-color: transparent;
}

/* === 9. 의존성 그래프 === */
.cfm-deps-graph {
  display: flex;
  gap: var(--cfm-space-xl);
  overflow-x: auto;
  padding: var(--cfm-space-md) 0;
}
.cfm-deps-layer {
  display: flex;
  flex-direction: column;
  gap: var(--cfm-space-sm);
  min-width: 140px;
}
.cfm-deps-layer-title {
  font-size: var(--cfm-font-size-xs);
  color: var(--cfm-text-muted);
  text-align: center;
  margin-bottom: var(--cfm-space-xs);
}
.cfm-deps-node {
  padding: var(--cfm-space-sm);
  background: var(--cfm-bg-tertiary);
  border-radius: var(--cfm-radius-sm);
  border: 1px solid var(--cfm-border-default);
  font-size: var(--cfm-font-size-xs);
  text-align: center;
}

/* === 10. Activity Feed === */
.cfm-activity-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-height: 500px;
  overflow-y: auto;
}
.cfm-activity-item {
  display: flex;
  align-items: center;
  gap: var(--cfm-space-sm);
  padding: var(--cfm-space-xs) var(--cfm-space-sm);
  font-size: var(--cfm-font-size-xs);
  border-radius: var(--cfm-radius-sm);
}
.cfm-activity-item:hover { background: var(--cfm-bg-hover); }
.cfm-activity-time { color: var(--cfm-text-muted); min-width: 42px; }
.cfm-activity-icon { min-width: 16px; text-align: center; }
.cfm-activity-text { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* === 11. 빈 상태 / 에러 상태 === */
.cfm-empty, .cfm-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--cfm-space-sm);
  padding: var(--cfm-space-xl);
  color: var(--cfm-text-muted);
  text-align: center;
}
.cfm-empty-icon, .cfm-error-icon { font-size: 32px; opacity: 0.5; }
.cfm-empty-hint { font-size: var(--cfm-font-size-xs); }
.cfm-retry-btn {
  padding: var(--cfm-space-xs) var(--cfm-space-md);
  background: var(--cfm-badge-bg);
  color: var(--cfm-badge-fg);
  border: none;
  border-radius: var(--cfm-radius-sm);
  cursor: pointer;
  font-size: var(--cfm-font-size-sm);
}

/* === 12. 스켈레톤 로딩 === */
@keyframes skeleton-pulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.8; }
}
.cfm-skeleton {
  background: var(--cfm-overlay-medium);
  border-radius: var(--cfm-radius-sm);
  animation: skeleton-pulse 1.5s ease-in-out infinite;
}

/* === 13. 애니메이션 === */
@keyframes agent-pulse {
  0%, 100% { border-left-color: var(--agent-color); }
  50% { border-left-color: transparent; }
}
.cfm-agent-card[data-status="active"] {
  animation: agent-pulse 2s ease-in-out infinite;
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}

/* === 14. 칸반 보드 (Stitch Kanban View) === */
.cfm-kanban {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--cfm-space-md);
  min-height: 200px;
}
.cfm-kanban-column {
  display: flex;
  flex-direction: column;
  gap: var(--cfm-space-sm);
  padding: var(--cfm-space-sm);
  border-radius: var(--cfm-radius-md);
  min-height: 120px;
}
.cfm-kanban-column[data-status="pending"] { background: var(--cfm-kanban-pending-bg, var(--cfm-overlay-subtle)); }
.cfm-kanban-column[data-status="in_progress"] { background: var(--cfm-kanban-progress-bg, var(--cfm-overlay-subtle)); }
.cfm-kanban-column[data-status="completed"] { background: var(--cfm-kanban-completed-bg, var(--cfm-overlay-subtle)); }
.cfm-kanban-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--cfm-space-xs) 0;
  font-size: var(--cfm-font-size-xs);
  color: var(--cfm-text-secondary);
  font-weight: var(--cfm-font-weight-medium);
}
.cfm-kanban-count {
  padding: 1px 6px;
  background: var(--cfm-overlay-light);
  border-radius: 10px;
  font-size: var(--cfm-font-size-xs);
}
.cfm-kanban-card {
  padding: var(--cfm-space-sm) var(--cfm-space-md);
  background: var(--cfm-bg-tertiary);
  border-radius: var(--cfm-radius-md);
  border: 1px solid var(--cfm-border-default);
  box-shadow: var(--cfm-shadow-card);
  cursor: default;
  transition: background var(--cfm-transition-fast);
}
.cfm-kanban-card:hover { background: var(--cfm-bg-hover); }
.cfm-kanban-card-id {
  font-size: var(--cfm-font-size-xs);
  color: var(--cfm-text-muted);
  font-family: var(--cfm-font-mono);
}
.cfm-kanban-card-title {
  font-size: var(--cfm-font-size-sm);
  margin: var(--cfm-space-xs) 0;
}
.cfm-kanban-card-assignee {
  font-size: var(--cfm-font-size-xs);
  color: var(--cfm-text-secondary);
}
.cfm-kanban-card-blocker {
  font-size: var(--cfm-font-size-xs);
  color: var(--cfm-status-blocked);
  margin-top: var(--cfm-space-xs);
}

/* 뷰 토글 (Table/Kanban) */
.cfm-view-toggle {
  display: flex;
  gap: 2px;
  margin-bottom: var(--cfm-space-sm);
}
.cfm-view-toggle-btn {
  padding: var(--cfm-space-xs) var(--cfm-space-md);
  border: 1px solid var(--cfm-border-default);
  background: none;
  color: var(--cfm-text-secondary);
  font-size: var(--cfm-font-size-xs);
  cursor: pointer;
  transition: all var(--cfm-transition-fast);
}
.cfm-view-toggle-btn:first-child { border-radius: var(--cfm-radius-sm) 0 0 var(--cfm-radius-sm); }
.cfm-view-toggle-btn:last-child { border-radius: 0 var(--cfm-radius-sm) var(--cfm-radius-sm) 0; }
.cfm-view-toggle-btn[aria-pressed="true"] {
  background: var(--cfm-badge-bg);
  color: var(--cfm-badge-fg);
  border-color: transparent;
}

/* === 15. 세션 카드 (Stitch Activity View) === */
.cfm-session-card {
  display: flex;
  align-items: center;
  gap: var(--cfm-space-md);
  padding: var(--cfm-space-md);
  background: var(--cfm-overlay-subtle);
  border-radius: var(--cfm-radius-md);
  border: 1px solid var(--cfm-border-default);
  margin-bottom: var(--cfm-space-md);
}
.cfm-session-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--cfm-status-completed);
  flex-shrink: 0;
}
.cfm-session-indicator[data-active="false"] {
  background: var(--cfm-text-muted);
  opacity: 0.5;
}
.cfm-session-info { flex: 1; }
.cfm-session-name { font-weight: var(--cfm-font-weight-bold); }
.cfm-session-meta {
  font-size: var(--cfm-font-size-xs);
  color: var(--cfm-text-secondary);
}
.cfm-session-progress {
  text-align: right;
  font-size: var(--cfm-font-size-xs);
  color: var(--cfm-text-secondary);
}

/* Activity 필터 칩 */
.cfm-activity-filters {
  display: flex;
  gap: var(--cfm-space-xs);
  margin-bottom: var(--cfm-space-sm);
  flex-wrap: wrap;
}
.cfm-activity-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 10px;
  border: 1px solid var(--cfm-border-default);
  background: none;
  color: var(--cfm-text-secondary);
  border-radius: 12px;
  font-size: var(--cfm-font-size-xs);
  cursor: pointer;
  transition: all var(--cfm-transition-fast);
}
.cfm-activity-chip[aria-pressed="true"] {
  background: var(--cfm-badge-bg);
  color: var(--cfm-badge-fg);
  border-color: transparent;
}
.cfm-activity-chip-count {
  font-size: 10px;
  padding: 0 4px;
  background: var(--cfm-overlay-light);
  border-radius: 8px;
}
.cfm-activity-item[data-type="error"] {
  background: rgba(var(--cfm-status-blocked-base), 0.08);
}

/* === 16. 도넛 차트 (Sprint Capacity) === */
.cfm-donut-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--cfm-space-xs);
}
.cfm-donut {
  position: relative;
  width: 80px;
  height: 80px;
}
.cfm-donut-svg { transform: rotate(-90deg); }
.cfm-donut-track {
  fill: none;
  stroke: var(--cfm-overlay-medium);
  stroke-width: 6;
}
.cfm-donut-fill {
  fill: none;
  stroke: var(--cfm-agent-active);
  stroke-width: 6;
  stroke-linecap: round;
  transition: stroke-dasharray var(--cfm-transition-normal);
}
.cfm-donut-label {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--cfm-font-size-lg);
  font-weight: var(--cfm-font-weight-bold);
}

/* === 17. 커스텀 스크롤바 === */
::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb {
  background: var(--cfm-scrollbar-thumb, rgba(128,128,128,0.2));
  border-radius: 4px;
}
::-webkit-scrollbar-thumb:hover {
  background: var(--cfm-scrollbar-thumb-hover, rgba(128,128,128,0.4));
}

/* === 18. 검색 바 (Tasks 탭) === */
.cfm-search {
  display: flex;
  align-items: center;
  gap: var(--cfm-space-sm);
  padding: var(--cfm-space-xs) var(--cfm-space-sm);
  background: var(--cfm-bg-input);
  border: 1px solid var(--cfm-border-input);
  border-radius: var(--cfm-radius-sm);
  margin-bottom: var(--cfm-space-sm);
}
.cfm-search-input {
  flex: 1;
  background: none;
  border: none;
  color: var(--cfm-text-primary);
  font-size: var(--cfm-font-size-sm);
  font-family: var(--cfm-font-family);
  outline: none;
}
.cfm-search-input::placeholder { color: var(--cfm-text-muted); }

/* === 19. 메시지 통계 패널 (Stitch Messages 하단) === */
.cfm-msg-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--cfm-space-md);
  padding: var(--cfm-space-md);
  background: var(--cfm-overlay-subtle);
  border-radius: var(--cfm-radius-md);
  margin-top: var(--cfm-space-md);
  border: 1px solid var(--cfm-border-default);
}
.cfm-msg-stat-title {
  font-size: var(--cfm-font-size-xs);
  color: var(--cfm-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: var(--cfm-space-xs);
}
.cfm-msg-stat-value {
  font-size: var(--cfm-font-size-lg);
  font-weight: var(--cfm-font-weight-bold);
}

/* === 20. 푸터 (상태 표시) === */
.cfm-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--cfm-space-sm) 0;
  margin-top: var(--cfm-space-md);
  border-top: 1px solid var(--cfm-border-default);
  font-size: var(--cfm-font-size-xs);
  color: var(--cfm-text-muted);
}
.cfm-footer-status {
  display: flex;
  align-items: center;
  gap: var(--cfm-space-xs);
}
.cfm-footer-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--cfm-status-completed);
}

/* === 21. 반응형 === */
@container dashboard (max-width: 400px) {
  .cfm-stats { flex-direction: column; gap: var(--cfm-space-xs); }
  .cfm-agent-grid { grid-template-columns: 1fr; }
  .cfm-kanban { grid-template-columns: 1fr; }
  .cfm-msg-stats { grid-template-columns: 1fr; }
  .cfm-tabs { gap: 2px; }
  .cfm-tab { padding: var(--cfm-space-xs) var(--cfm-space-sm); font-size: var(--cfm-font-size-xs); }
  .cfm-task-table th:nth-child(3) { display: none; }
  .cfm-task-table td:nth-child(3) { display: none; }
}
@container dashboard (min-width: 401px) and (max-width: 800px) {
  .cfm-agent-grid { grid-template-columns: repeat(2, 1fr); }
}
@container dashboard (min-width: 801px) {
  .cfm-agent-grid { grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); }
  .cfm-message-list { max-height: 600px; }
}

/* === 22. 탭 패널 === */
.cfm-panel { display: none; }
.cfm-panel[aria-hidden="false"] { display: block; }

/* === 23. 타임라인 뷰 === */
.cfm-timeline {
  position: relative;
  padding-left: var(--cfm-space-xl);
}
.cfm-timeline::before {
  content: '';
  position: absolute;
  left: 10px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: var(--cfm-border-default);
}
.cfm-timeline-date {
  position: relative;
  padding: var(--cfm-space-xs) var(--cfm-space-sm);
  margin: var(--cfm-space-md) 0 var(--cfm-space-sm) 0;
  font-size: var(--cfm-font-size-xs);
  font-weight: var(--cfm-font-weight-bold);
  color: var(--cfm-text-secondary);
  background: var(--cfm-bg-primary);
  display: inline-block;
}
.cfm-timeline-item {
  position: relative;
  display: flex;
  gap: var(--cfm-space-sm);
  padding: var(--cfm-space-xs) 0;
  margin-bottom: var(--cfm-space-xs);
}
.cfm-timeline-dot {
  position: absolute;
  left: calc(-1 * var(--cfm-space-xl) + 6px);
  top: 8px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--cfm-border-active);
  border: 2px solid var(--cfm-bg-primary);
  z-index: 1;
}
.cfm-timeline-item[data-type="task_change"] .cfm-timeline-dot { background: var(--cfm-status-completed); }
.cfm-timeline-item[data-type="error"] .cfm-timeline-dot { background: var(--cfm-status-blocked); }
.cfm-timeline-item[data-type="command"] .cfm-timeline-dot { background: rgb(var(--cfm-agent-active-base)); }
.cfm-timeline-content {
  flex: 1;
  padding: var(--cfm-space-xs) var(--cfm-space-sm);
  background: var(--cfm-overlay-subtle);
  border-radius: var(--cfm-radius-sm);
  transition: background var(--cfm-transition-fast);
}
.cfm-timeline-content:hover { background: var(--cfm-bg-hover); }
.cfm-timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2px;
}
.cfm-timeline-time {
  font-size: var(--cfm-font-size-xs);
  color: var(--cfm-text-muted);
}
.cfm-timeline-text {
  font-size: var(--cfm-font-size-sm);
  word-break: break-word;
}
.cfm-timeline-detail {
  font-size: var(--cfm-font-size-xs);
  color: var(--cfm-text-muted);
  font-family: var(--cfm-font-mono);
  margin-top: 2px;
}

/* === 24. 메트릭 대시보드 === */
.cfm-metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: var(--cfm-space-md);
  margin-bottom: var(--cfm-space-lg);
}
.cfm-metric-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--cfm-space-xs);
  padding: var(--cfm-space-md);
  background: var(--cfm-overlay-subtle);
  border-radius: var(--cfm-radius-md);
  border: 1px solid var(--cfm-border-default);
  text-align: center;
}
.cfm-metric-icon { font-size: 24px; }
.cfm-metric-value {
  font-size: var(--cfm-font-size-xl);
  font-weight: var(--cfm-font-weight-bold);
}
.cfm-metric-label {
  font-size: var(--cfm-font-size-xs);
  color: var(--cfm-text-secondary);
}
.cfm-metric-sub {
  font-size: var(--cfm-font-size-xs);
  color: var(--cfm-text-muted);
}
.cfm-donut-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}
.cfm-donut-pct {
  position: absolute;
  font-size: var(--cfm-font-size-md);
  font-weight: var(--cfm-font-weight-bold);
  pointer-events: none;
}
.cfm-donut-svg { transform: rotate(-90deg); }
.cfm-donut-track {
  fill: none;
  stroke: var(--cfm-overlay-medium);
  stroke-width: 3.5;
}
.cfm-donut-fill {
  fill: none;
  stroke: var(--cfm-status-completed);
  stroke-width: 3.5;
  stroke-linecap: round;
  transition: stroke-dasharray var(--cfm-transition-normal);
}

/* 태스크 처리 속도 차트 */
.cfm-velocity-chart {
  display: flex;
  align-items: flex-end;
  gap: var(--cfm-space-xs);
  height: 100px;
  padding: var(--cfm-space-sm);
  background: var(--cfm-overlay-subtle);
  border-radius: var(--cfm-radius-md);
  border: 1px solid var(--cfm-border-default);
}
.cfm-velocity-bar-wrap {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  justify-content: flex-end;
}
.cfm-velocity-bar {
  width: 100%;
  max-width: 24px;
  background: linear-gradient(to top, rgb(var(--cfm-agent-active-base)), rgba(var(--cfm-agent-active-base), 0.5));
  border-radius: var(--cfm-radius-sm) var(--cfm-radius-sm) 0 0;
  min-height: 2px;
  transition: height var(--cfm-transition-normal);
}
.cfm-velocity-bar:hover {
  background: rgb(var(--cfm-agent-active-base));
  box-shadow: 0 0 4px rgba(var(--cfm-agent-active-base), 0.4);
}
.cfm-velocity-label {
  font-size: 10px;
  color: var(--cfm-text-muted);
  margin-top: 4px;
}

/* 파일 히트맵 */
.cfm-heatmap {
  display: flex;
  flex-direction: column;
  gap: var(--cfm-space-xs);
}
.cfm-heatmap-row {
  display: flex;
  align-items: center;
  gap: var(--cfm-space-sm);
  font-size: var(--cfm-font-size-xs);
}
.cfm-heatmap-file {
  min-width: 120px;
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: var(--cfm-font-mono);
}
.cfm-heatmap-bar-wrap {
  flex: 1;
  height: 8px;
  background: var(--cfm-overlay-light);
  border-radius: 4px;
  overflow: hidden;
}
.cfm-heatmap-bar {
  height: 100%;
  background: linear-gradient(to right, var(--cfm-status-in-progress), rgba(var(--cfm-status-in-progress-base), 0.5));
  border-radius: 4px;
  transition: width var(--cfm-transition-normal);
}
.cfm-heatmap-row:hover .cfm-heatmap-bar {
  background: var(--cfm-status-in-progress);
}
.cfm-heatmap-count {
  min-width: 24px;
  text-align: right;
  color: var(--cfm-text-muted);
}

/* === 25. SVG DAG 그래프 (향상) === */
.cfm-dag-wrapper {
  position: relative;
  overflow-x: auto;
  padding: var(--cfm-space-md) 0;
}
.cfm-dag-svg {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  overflow: visible;
}
.cfm-dag-edge {
  fill: none;
  stroke: var(--cfm-text-muted);
  stroke-width: 1.5;
  opacity: 0.6;
}
.cfm-dag-arrow {
  fill: var(--cfm-text-muted);
  opacity: 0.6;
}
.cfm-metric-card:hover {
  border-color: var(--cfm-border-active);
  background: var(--cfm-overlay-light);
}
.cfm-deps-node {
  display: flex;
  flex-direction: column;
  gap: 2px;
  cursor: default;
  transition: border-color var(--cfm-transition-fast);
}
.cfm-deps-node:hover {
  border-color: var(--cfm-border-active);
}
.cfm-deps-node[data-status="completed"] { border-left: 3px solid var(--cfm-status-completed); }
.cfm-deps-node[data-status="in_progress"] { border-left: 3px solid var(--cfm-status-in-progress); }
.cfm-deps-node[data-status="pending"] { border-left: 3px solid var(--cfm-status-pending); }
.cfm-deps-node-id {
  font-size: 10px;
  color: var(--cfm-text-muted);
  font-family: var(--cfm-font-mono);
}
.cfm-deps-node-title {
  font-size: var(--cfm-font-size-xs);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* === 26. 추정치 표시 === */
.cfm-estimated {
  color: var(--cfm-text-muted);
  font-style: italic;
  cursor: help;
}

/* === 27. 토큰 사용량 === */
.cfm-token-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--cfm-space-sm) var(--cfm-space-md);
  background: var(--cfm-overlay-subtle);
  border-radius: var(--cfm-radius-md);
  border: 1px solid var(--cfm-border-default);
  margin-top: var(--cfm-space-sm);
  font-size: var(--cfm-font-size-sm);
  color: var(--cfm-text-secondary);
}
.cfm-token-total-value {
  font-size: var(--cfm-font-size-lg);
  font-weight: var(--cfm-font-weight-bold);
  color: var(--cfm-text-primary);
}
.cfm-token-ratio {
  display: flex;
  height: 8px;
  border-radius: 4px;
  overflow: hidden;
  margin-top: var(--cfm-space-sm);
}
.cfm-token-segment {
  height: 100%;
  min-width: 2px;
  transition: width var(--cfm-transition-normal);
}

/* === 27. 검색 바 강화 === */
.cfm-search-icon {
  font-size: var(--cfm-font-size-sm);
  opacity: 0.6;
}
.cfm-search:focus-within {
  border-color: var(--cfm-border-active);
}
.cfm-lang-select {
  background: var(--cfm-bg-input);
  border: 1px solid var(--cfm-border-input);
  color: var(--cfm-text-primary);
  font-size: var(--cfm-font-size-xs);
  font-family: var(--cfm-font-family);
  padding: 2px 6px;
  border-radius: var(--cfm-radius-sm);
  cursor: pointer;
  flex-shrink: 0;
  outline: none;
}
.cfm-lang-select:focus {
  border-color: var(--cfm-border-active);
}

/* === 토큰 사용량 요약 바 === */
.cfm-token-summary {
  display: flex;
  align-items: center;
  gap: var(--cfm-space-sm);
  padding: 4px var(--cfm-space-sm);
  font-size: var(--cfm-font-size-xs);
  color: var(--cfm-text-muted);
  background: var(--cfm-overlay-subtle);
  border-radius: var(--cfm-radius-sm);
  margin-bottom: var(--cfm-space-sm);
}
.cfm-token-item { font-family: var(--cfm-font-mono); }
.cfm-token-item span { font-weight: var(--cfm-font-weight-bold); }
.cfm-token-total { color: var(--cfm-text-primary); }
.cfm-token-sep { color: var(--cfm-text-muted); opacity: 0.3; }

/* === 27. 반응형 업데이트 (Phase 2) === */
@container dashboard (max-width: 400px) {
  .cfm-metrics-grid { grid-template-columns: repeat(2, 1fr); }
  .cfm-velocity-chart { height: 60px; }
  .cfm-heatmap-file { min-width: 80px; max-width: 100px; }
  .cfm-timeline { padding-left: var(--cfm-space-md); }
}
@container dashboard (min-width: 801px) {
  .cfm-metrics-grid { grid-template-columns: repeat(3, 1fr); }
}
`;
}
