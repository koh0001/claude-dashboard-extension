import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';

export default [
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      // 세미콜론 필수
      'semi': ['error', 'always'],
      // 작은따옴표 우선
      'quotes': ['error', 'single', { avoidEscape: true, allowTemplateLiterals: true }],
      // 미사용 변수 경고
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      // innerHTML 사용 금지 (CSP)
      'no-restricted-properties': ['error', {
        object: 'element',
        property: 'innerHTML',
        message: 'innerHTML 사용 금지 — textContent + DOM API 사용',
      }],
    },
  },
  {
    ignores: ['dist/', 'node_modules/', '*.config.*'],
  },
];
