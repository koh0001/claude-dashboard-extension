/**
 * XSS 방지를 위한 HTML 이스케이프 유틸리티
 */

const ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

const ESCAPE_RE = /[&<>"']/g;

/** HTML 특수문자 이스케이프 */
export function escapeHtml(text: string): string {
  if (!text) return '';
  return text.replace(ESCAPE_RE, (ch) => ESCAPE_MAP[ch] || ch);
}
