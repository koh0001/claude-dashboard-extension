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
      <select class="cfm-lang-select" id="lang-select">
        <option value="ko">한국어</option>
        <option value="en">English</option>
        <option value="ja">日本語</option>
        <option value="zh">中文</option>
      </select>
    </div>

    <!-- 토큰 사용량 요약 바 -->
    <div class="cfm-token-summary" id="token-summary">
      <span class="cfm-token-item" style="color:#2196f3"><span id="ts-input">0</span> in</span>
      <span class="cfm-token-item" style="color:#4caf50"><span id="ts-output">0</span> out</span>
      <span class="cfm-token-item" style="color:#ff9800"><span id="ts-cache">0</span> cache</span>
      <span class="cfm-token-sep">|</span>
      <span class="cfm-token-item cfm-token-total">total <span id="ts-total">0</span></span>
    </div>
    <div class="cfm-token-summary-bar" id="ts-ratio-bar"></div>

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
