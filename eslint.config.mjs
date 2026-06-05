import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

// Flat config (ESLint 9). Covers the React client and the Node server with the
// right globals each. Stylistic concerns are delegated to Prettier (eslint-config-
// prettier disables conflicting rules). Most rules are warnings so the lint stays
// useful without failing CI on the existing codebase; real-bug rules stay errors.
export default tseslint.config(
  { ignores: ['**/dist/**', '**/node_modules/**', '**/*.config.*', '**/prisma/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  // Client — React + browser
  {
    files: ['client/src/**/*.{ts,tsx}'],
    languageOptions: { globals: { ...globals.browser } },
    plugins: { 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
  // Server — Node
  {
    files: ['server/src/**/*.ts'],
    languageOptions: { globals: { ...globals.node } },
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
  prettier,
);
