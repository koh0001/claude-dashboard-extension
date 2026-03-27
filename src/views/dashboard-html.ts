/**
 * 대시보드 HTML 템플릿 (정적 구조)
 */

import { getDashboardCss } from './dashboard-css.js';
import { getDashboardJs } from './dashboard-js.js';

/** WebView HTML 생성 */
export function getDashboardHtml(nonce: string): string {
  const css = getDashboardCss();
  const js = getDashboardJs();

  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy"
    content="default-src 'none'; style-src 'nonce-${nonce}'; script-src 'nonce-${nonce}'; worker-src 'none';">
  <style nonce="${nonce}">${css}</style>
</head>
<body>
  <div class="cfm-root" id="cfm-root">
    <!-- 접근성: 콘텐츠 건너뛰기 -->
    <a href="#cfm-content" class="cfm-skip-link" id="skip-link"></a>

    <!-- 검색 바 + 언어 변경 -->
    <div class="cfm-search" id="search-bar">
      <span class="cfm-search-icon">&#x1F50D;</span>
      <input type="text" class="cfm-search-input" id="search-input" autocomplete="off" spellcheck="false">
      <button class="cfm-lang-btn" id="lang-btn" title="Change Language">&#x1F310;</button>
    </div>

    <!-- 탭 네비게이션 -->
    <div class="cfm-tabs" role="tablist" aria-label="Dashboard tabs">
      <button role="tab" class="cfm-tab" data-tab="overview" aria-selected="true" aria-controls="panel-overview" id="tab-overview"></button>
      <button role="tab" class="cfm-tab" data-tab="tasks" aria-selected="false" aria-controls="panel-tasks" id="tab-tasks"></button>
      <button role="tab" class="cfm-tab" data-tab="messages" aria-selected="false" aria-controls="panel-messages" id="tab-messages"></button>
      <button role="tab" class="cfm-tab" data-tab="deps" aria-selected="false" aria-controls="panel-deps" id="tab-deps"></button>
      <button role="tab" class="cfm-tab" data-tab="activity" aria-selected="false" aria-controls="panel-activity" id="tab-activity"></button>
      <button role="tab" class="cfm-tab" data-tab="timeline" aria-selected="false" aria-controls="panel-timeline" id="tab-timeline"></button>
      <button role="tab" class="cfm-tab" data-tab="metrics" aria-selected="false" aria-controls="panel-metrics" id="tab-metrics"></button>
    </div>

    <!-- 콘텐츠 영역 -->
    <div id="cfm-content">
      <!-- Stats Bar -->
      <div class="cfm-stats" id="stats-bar" role="region" aria-label="Statistics"></div>

      <!-- Overview 탭 -->
      <div role="tabpanel" class="cfm-panel" id="panel-overview" aria-labelledby="tab-overview" aria-hidden="false"></div>

      <!-- Tasks 탭 -->
      <div role="tabpanel" class="cfm-panel" id="panel-tasks" aria-labelledby="tab-tasks" aria-hidden="true"></div>

      <!-- Messages 탭 -->
      <div role="tabpanel" class="cfm-panel" id="panel-messages" aria-labelledby="tab-messages" aria-hidden="true"></div>

      <!-- Deps 탭 -->
      <div role="tabpanel" class="cfm-panel" id="panel-deps" aria-labelledby="tab-deps" aria-hidden="true"></div>

      <!-- Activity 탭 -->
      <div role="tabpanel" class="cfm-panel" id="panel-activity" aria-labelledby="tab-activity" aria-hidden="true"></div>

      <!-- Timeline 탭 -->
      <div role="tabpanel" class="cfm-panel" id="panel-timeline" aria-labelledby="tab-timeline" aria-hidden="true"></div>

      <!-- Metrics 탭 -->
      <div role="tabpanel" class="cfm-panel" id="panel-metrics" aria-labelledby="tab-metrics" aria-hidden="true"></div>
    </div>
  </div>

  <script nonce="${nonce}">${js}</script>
</body>
</html>`;
}
