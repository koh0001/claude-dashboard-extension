/**
 * I18nService — VS Code 확장 i18n 관리
 */

import * as vscode from 'vscode';
import {
  createExtendedI18n,
  detectVSCodeLocale,
  type ExtendedI18nInstance,
  type Locale,
  LOCALE_ORDER,
  LOCALE_LABELS,
} from '../i18n/index.js';

export class I18nService implements vscode.Disposable {
  private i18n: ExtendedI18nInstance;
  private disposables: vscode.Disposable[] = [];

  private readonly _onLocaleChanged = new vscode.EventEmitter<Locale>();
  readonly onLocaleChanged = this._onLocaleChanged.event;

  constructor() {
    const locale = detectVSCodeLocale();
    this.i18n = createExtendedI18n(locale);

    // 설정 변경 감시
    const configWatcher = vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('ccFlowMonitor.language')) {
        const newLocale = detectVSCodeLocale();
        if (newLocale !== this.i18n.locale) {
          this.i18n = createExtendedI18n(newLocale);
          this._onLocaleChanged.fire(newLocale);
        }
      }
    });
    this.disposables.push(configWatcher, this._onLocaleChanged);
  }

  /** 현재 로케일 */
  get locale(): Locale {
    return this.i18n.locale;
  }

  /** 번역 함수 */
  t(key: string, params?: Record<string, string | number>): string {
    return this.i18n.t(key, params);
  }

  /** 로케일 순환 (UI 버튼용) */
  cycleLocale(): Locale {
    this.i18n = this.i18n.cycleLocale();
    this._onLocaleChanged.fire(this.i18n.locale);
    return this.i18n.locale;
  }

  /** 로케일 직접 설정 */
  setLocale(locale: Locale): void {
    if (locale !== this.i18n.locale) {
      this.i18n = this.i18n.setLocale(locale);
      this._onLocaleChanged.fire(locale);
    }
  }

  /** WebView용 번역 맵 */
  getWebViewTranslations(): Record<string, string> {
    return this.i18n.getWebViewTranslations();
  }

  /** 로케일 퀵피크 표시 */
  async showLocalePicker(): Promise<void> {
    const items = LOCALE_ORDER.map((l) => ({
      label: LOCALE_LABELS[l],
      description: l === this.i18n.locale ? '✓' : '',
      locale: l,
    }));

    const picked = await vscode.window.showQuickPick(items, {
      placeHolder: this.t('settings.language'),
    });

    if (picked) {
      this.setLocale(picked.locale);
      // VS Code 설정에도 반영
      await vscode.workspace.getConfiguration('ccFlowMonitor')
        .update('language', picked.locale, vscode.ConfigurationTarget.Global);
    }
  }

  dispose(): void {
    for (const d of this.disposables) d.dispose();
  }
}
