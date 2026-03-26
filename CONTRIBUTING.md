# Contributing to Claude Flow Monitor

Thank you for your interest in contributing! This guide will help you get started.

## Development Setup

```bash
git clone https://github.com/koh0001/claude-flow-monitor.git
cd claude-flow-monitor
npm install
npm run build
```

## Development Workflow

```bash
npm run dev        # Watch mode (auto-rebuild on changes)
npm run build      # Production build
npm run test:run   # Run tests once
npm test           # Watch mode tests
npm run lint       # ESLint check
```

**Debugging:** Press `F5` in VS Code to launch the Extension Development Host.

**Test data:** Run `./test-data/setup.sh` to populate `~/.claude/` with sample data.

## Project Structure

```
src/
├── extension.ts           # Entry point
├── services/              # Backend services (watcher, git, export, webhook, mcp)
├── providers/             # VS Code providers (dashboard, tree, sidebar, file decoration)
├── views/                 # WebView HTML/CSS/JS templates
├── i18n/                  # Internationalization (ko, en, ja, zh)
├── types/                 # TypeScript type definitions
├── core/                  # Core types and watcher
└── utils/                 # Utilities (escape-html, theme-detector)
```

## Coding Conventions

- All comments and documentation in **Korean**
- TypeScript strict mode, `moduleResolution: "bundler"`
- ESM imports (`import/export`)
- `var` in `dashboard-js.ts` (template literal function scope)
- No `innerHTML` in WebView — use `textContent` + DOM API
- `escapeHtml()` for all user-provided strings
- CSP: `script-src 'nonce-{nonce}'` only

## i18n

When adding new features with user-facing text:

1. Add key to `src/i18n/types.ts` (`ExtendedTranslationMap`)
2. Add translation to all 4 locale files (`ko.ts`, `en.ts`, `ja.ts`, `zh.ts`)
3. Add to `WEBVIEW_TRANSLATION_KEYS` if used in WebView
4. TypeScript will catch missing keys at compile time

## Pull Requests

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Make your changes
4. Run `npm run build && npm run test:run && npm run lint`
5. Commit with a descriptive message
6. Push and open a Pull Request

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
