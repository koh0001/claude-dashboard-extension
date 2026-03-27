# Changelog

All notable changes to Claude Flow Monitor will be documented in this file.

## [1.5.1] - 2026-03-27

### New Features
- OMC subagent dashboard integration (Overview/Tasks/Messages/Deps tabs)
- Language dropdown selector (ko/en/ja/zh) in search bar
- Token donut chart + ratio bar with legends in Metrics tab
- Teams tree view with subagent session grouping
- Deps tab SVG arrows between sessions and subagents
- Dashboard version display in search bar
- Heatmap 2-line layout (filename top, bar bottom)

### Fixes
- Extension host shutdown delay — empty deactivate(), services auto-cleanup on process exit
- Token double-counting — statsLoaded flag, incremental file reading by size tracking
- totalTokens calculation — include cacheReadTokens in actual total
- Git child process tracking/termination on dispose
- Webhook HTTP request tracking/abort on dispose
- WebView cleanup protocol — cleanup message before panel dispose
- Session count based on actual JSONL file sources

---

## [0.6.0] - 2026-03-27

### New Features
- Project history persistence — `cfm-stats.json` saves cumulative token/activity stats across sessions
- Session-based metrics fallback — file edit ratio + command ratio donuts when no Agent Teams active
- JSONL structure parsing — supports `assistant→message.content[].tool_use` format (real Claude Code sessions)

### Fixes
- Large JSONL optimization — reads last 512KB only for 8MB+ files
- File sorting — modification time instead of UUID alphabetical order
- Directory filtering — `withFileTypes` to exclude subdirectories from JSONL scan
- Duplicate parsing prevention — `parsedFiles` tracking restored on extension restart

---

## [0.5.0] - 2026-03-26

### New Features
- Per-task duration + estimated token columns in Tasks tab (createdAt→completedAt, time-window token estimation with `~` prefix)
- Session JSONL detection fallback — watches project root when `sessions/` folder doesn't exist
- Workspace hash matching fix — uses path substitution (`/` and `_` → `-`) instead of SHA-256

### Improvements
- Stats Bar: elapsed time → current time display
- i18n: added `task.headerDuration`, `task.headerTokens`, `task.estimated` (4 languages)

---

## [0.4.0] - 2026-03-26

### New Features
- Workspace-based team filtering — only shows teams whose `cwd` matches current project
- Token usage monitoring screenshots added (4 languages)

### Improvements
- Logo centered symmetric pulse, full-square rounded rect (256x256)
- README logo size 128→180px across all 4 languages

---

## [0.3.1] - 2026-03-26

### New Features
- Token usage monitoring — parses `message.usage` from session JSONL (input/output/cache tokens)
- Metrics tab: token cards (4 types), total bar, ratio segment bar
- Sidebar mini dashboard (WebviewView — key metrics, recent activity, quick actions)
- Donut chart color differentiation (completion=green, utilization=blue)

### Improvements
- Logo redesigned: centered symmetric pulse, full-square rounded rect
- DAG graph arrows use DOM-based `getBoundingClientRect()` positioning
- Time format: HH:MM:SS default, configurable via settings
- Dashboard quick-open button in sidebar title bar + Welcome View
- Velocity chart gradient + hover glow
- Heatmap gradient + hover highlight
- Metric card hover effect

### Fixes
- Donut chart text overlap (absolute positioning)
- Search icon rendering (HTML entity `&#x1F50D;`)
- Export report NaN/undefined (proper `toSnapshotPayload` mapping)
- Sidebar dashboard flicker (postMessage partial update instead of full HTML replace)
- Task Velocity / Files Changed always visible (removed conditional guard)

---

## [0.1.0] - 2026-03-26

### Phase 1: MVP
- Project scaffolding (package.json, tsconfig, tsup, eslint, vitest)
- WatcherService (core TeamWatcher adapter with duplicate listener guard)
- WebView dashboard (7 tabs: Overview, Tasks, Messages, Deps, Activity, Timeline, Metrics)
- Tree view sidebar (Team → Agent → Task hierarchy)
- Status bar (team name + completion rate, quick pick)
- Theme system (dark/light/high-contrast/high-contrast-light, adaptive)
- i18n (ko, en, ja, zh — 80 keys)
- Real-time notifications (taskCompleted, agentJoined, agentLeft)
- Workspace matching engine (SHA-256 hash + .project file fallback)
- Session file parsing (JSONL → structured activity data)
- Integrated Activity Feed (file/command/task/message, max 200)
- Mini dashboard (status bar Markdown tooltip)
- Kanban view (Table/Kanban toggle, 3-column board, blocker display)
- Sidebar mini dashboard (WebviewView — metrics, recent activity, quick actions)
- Branding icons (Stitch design system — sidebar/logo SVG)

### Phase 2: Enhanced Features
- Timeline view (chronological events, date grouping, type-based icons)
- Performance Metrics dashboard (SVG donut charts, velocity chart, file heatmap)
- SVG-based DAG graph (Bezier curve connections + arrows, DOM-based positioning)
- Search & Filter (global search bar, Ctrl+F shortcut, per-tab filtering)
- File change heatmap + AI contribution badge (FileDecorationProvider, Explorer "AI" badge)
- Git Diff integration (Co-Authored-By commit identification, GitService)
- TODO/Task integration (TodoWrite tool call tracking, activity feed)

### Phase 3: Extended Features
- MCP server integration (McpService — .mcp.json parsing, connected server list)
- Notification system extension (WebhookService — Slack/Discord webhook POST)
- Export (ExportService — CSV download, Markdown report generation)
- MCP server mode (HTTP JSON API — /api/teams, /api/activities, /api/metrics)
- AI activity summary report (ExportService.showReport — editor tab Markdown report)
