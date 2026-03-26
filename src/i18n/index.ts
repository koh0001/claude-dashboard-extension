/**
 * i18n 팩토리 — core i18n을 확장하여 Claude Flow Monitor 전용 키 지원
 */

import { createI18n as coreCreateI18n } from '../core/index.js';
import type { Locale } from './types.js';
import { LOCALE_ORDER, WEBVIEW_TRANSLATION_KEYS } from './types.js';
import { ko } from './locales/ko.js';
import { en } from './locales/en.js';
import { ja } from './locales/ja.js';
import { zh } from './locales/zh.js';

/** 확장 번역 맵 (로케일별) */
const EXTENDED_MAPS: Record<Locale, Record<string, string>> = {
  ko: ko as unknown as Record<string, string>,
  en: en as unknown as Record<string, string>,
  ja: ja as unknown as Record<string, string>,
  zh: zh as unknown as Record<string, string>,
};

/** 보간 처리 (ReDoS 방지: replaceAll 사용) */
function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  let result = template;
  for (const [key, value] of Object.entries(params)) {
    result = result.replaceAll(`{${key}}`, String(value));
  }
  return result;
}

/** 확장 i18n 인스턴스 */
export interface ExtendedI18nInstance {
  readonly locale: Locale;
  /** 번역 함수 (core + 확장 키 모두 지원) */
  t(key: string, params?: Record<string, string | number>): string;
  /** 로케일 변경 */
  setLocale(locale: Locale): ExtendedI18nInstance;
  /** 다음 로케일로 순환 */
  cycleLocale(): ExtendedI18nInstance;
  /** WebView에 전달할 번역 맵 추출 */
  getWebViewTranslations(): Record<string, string>;
}

/** 확장 i18n 인스턴스 생성 */
export function createExtendedI18n(locale: Locale = 'ko'): ExtendedI18nInstance {
  const coreI18n = coreCreateI18n(locale);
  const extMap = EXTENDED_MAPS[locale] || EXTENDED_MAPS.ko;

  const instance: ExtendedI18nInstance = {
    locale,

    t(key: string, params?: Record<string, string | number>): string {
      // 확장 키 우선 확인
      if (key in extMap) {
        return interpolate(extMap[key], params);
      }
      // core 번역 시도
      try {
        const result = coreI18n.t(key as any, params as any);
        if (result !== key) return result;
      } catch {
        // core에 없는 키
      }
      // 폴백: ko 확장 맵
      if (locale !== 'ko' && key in EXTENDED_MAPS.ko) {
        return interpolate(EXTENDED_MAPS.ko[key], params);
      }
      // 최종 폴백: 키 자체 반환
      return key;
    },

    setLocale(newLocale: Locale): ExtendedI18nInstance {
      return createExtendedI18n(newLocale);
    },

    cycleLocale(): ExtendedI18nInstance {
      const idx = LOCALE_ORDER.indexOf(locale);
      const next = LOCALE_ORDER[(idx + 1) % LOCALE_ORDER.length];
      return createExtendedI18n(next);
    },

    getWebViewTranslations(): Record<string, string> {
      const result: Record<string, string> = {};
      for (const key of WEBVIEW_TRANSLATION_KEYS) {
        result[key] = instance.t(key);
      }
      return result;
    },
  };

  return instance;
}

/** VS Code 설정에서 로케일 감지 */
export function detectVSCodeLocale(): Locale {
  // 런타임에 vscode 모듈에서 읽기 (순환 참조 방지)
  try {
    const vscode = require('vscode');
    const configLang = vscode.workspace.getConfiguration('ccFlowMonitor').get<string>('language');
    if (configLang && configLang !== 'auto' && LOCALE_ORDER.includes(configLang as Locale)) {
      return configLang as Locale;
    }
    // VS Code UI 언어
    const vsLang = vscode.env.language;
    if (vsLang) {
      const prefix = vsLang.split('-')[0] as Locale;
      if (LOCALE_ORDER.includes(prefix)) return prefix;
    }
  } catch {
    // vscode 모듈 없는 환경 (테스트 등)
  }

  // 환경변수 폴백
  const envLang = process.env.CC_TEAM_VIEWER_LANG || process.env.LANG || '';
  const prefix = envLang.split(/[_.-]/)[0] as Locale;
  if (LOCALE_ORDER.includes(prefix)) return prefix;

  return 'ko';
}

export { LOCALE_ORDER, LOCALE_LABELS, WEBVIEW_TRANSLATION_KEYS } from './types.js';
export type { Locale, ExtendedTranslationMap } from './types.js';
