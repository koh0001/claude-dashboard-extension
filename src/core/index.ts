/**
 * core 모듈 통합 진입점
 *
 * @cc-team-viewer/core 패키지를 내재화한 모듈.
 * 타입, 파서, 감시자, i18n을 모두 재내보냅니다.
 */

export * from './types.js';
export * from './parsers.js';
export { TeamWatcher } from './watcher.js';
export { createI18n, detectLocale, interpolate } from './i18n.js';
