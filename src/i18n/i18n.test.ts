import { describe, it, expect } from 'vitest';
import { ko } from './locales/ko.js';
import { en } from './locales/en.js';
import { ja } from './locales/ja.js';
import { zh } from './locales/zh.js';

const locales = { ko, en, ja, zh };
const koKeys = Object.keys(ko);

describe('i18n 키 일관성', () => {
  it('모든 로케일이 동일한 키를 가진다', () => {
    for (const [name, map] of Object.entries(locales)) {
      const keys = Object.keys(map);
      const missing = koKeys.filter((k) => !keys.includes(k));
      expect(missing, `${name} 로케일에 누락된 키`).toEqual([]);
    }
  });

  it('모든 로케일에 빈 값이 없다', () => {
    for (const [name, map] of Object.entries(locales)) {
      for (const [key, value] of Object.entries(map)) {
        expect(value, `${name}.${key}가 비어있음`).not.toBe('');
      }
    }
  });

  it('보간 변수가 모든 로케일에서 동일하다', () => {
    const extractPlaceholders = (text: string): string[] =>
      (text.match(/\{(\w+)\}/g) || []).sort();

    for (const key of koKeys) {
      const koPlaceholders = extractPlaceholders((ko as any)[key]);
      for (const [name, map] of Object.entries(locales)) {
        if (name === 'ko') continue;
        const placeholders = extractPlaceholders((map as any)[key]);
        expect(placeholders, `${name}.${key} 보간 변수 불일치`).toEqual(koPlaceholders);
      }
    }
  });
});

describe('i18n 번역 품질', () => {
  it('ext.title은 모든 로케일에서 동일하다', () => {
    for (const map of Object.values(locales)) {
      expect(map['ext.title']).toBe('Claude Flow Monitor');
    }
  });

  it('한국어가 기준 로케일로 설정되어 있다', () => {
    expect(koKeys.length).toBeGreaterThan(0);
  });
});
