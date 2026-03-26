import { describe, it, expect } from 'vitest';
import { escapeHtml } from './escape-html.js';

describe('escapeHtml', () => {
  it('빈 문자열을 처리한다', () => {
    expect(escapeHtml('')).toBe('');
  });

  it('null/undefined를 빈 문자열로 처리한다', () => {
    expect(escapeHtml(null as any)).toBe('');
    expect(escapeHtml(undefined as any)).toBe('');
  });

  it('HTML 특수문자를 이스케이프한다', () => {
    expect(escapeHtml('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
    );
  });

  it('앰퍼샌드를 이스케이프한다', () => {
    expect(escapeHtml('a & b')).toBe('a &amp; b');
  });

  it('작은따옴표를 이스케이프한다', () => {
    expect(escapeHtml("it's")).toBe('it&#39;s');
  });

  it('일반 텍스트는 그대로 반환한다', () => {
    expect(escapeHtml('hello world')).toBe('hello world');
  });

  it('한국어/유니코드 문자는 그대로 반환한다', () => {
    expect(escapeHtml('안녕하세요 🎉')).toBe('안녕하세요 🎉');
  });
});
