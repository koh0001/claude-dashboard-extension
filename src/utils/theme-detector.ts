/**
 * VS Code 테마 모드 감지 유틸리티
 */

import * as vscode from 'vscode';

export type ThemeMode = 'dark' | 'light' | 'high-contrast' | 'high-contrast-light';

/** 현재 VS Code 테마 모드를 감지 */
export function detectThemeMode(): ThemeMode {
  const kind = vscode.window.activeColorTheme.kind;
  switch (kind) {
    case vscode.ColorThemeKind.Light:
      return 'light';
    case vscode.ColorThemeKind.HighContrast:
      return 'high-contrast';
    case vscode.ColorThemeKind.HighContrastLight:
      return 'high-contrast-light';
    case vscode.ColorThemeKind.Dark:
    default:
      return 'dark';
  }
}

/** 테마 모드를 WebView data 속성 값으로 변환 */
export function themeToVscodeKind(mode: ThemeMode): string {
  switch (mode) {
    case 'light': return 'vscode-light';
    case 'high-contrast': return 'vscode-high-contrast';
    case 'high-contrast-light': return 'vscode-high-contrast-light';
    default: return 'vscode-dark';
  }
}
