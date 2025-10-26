// @ts-check
import globals from 'globals';
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    // config with just ignores is the replacement for `.eslintignore`
    ignores: ['**/dist/**', '**/__tests__/**', '**/*.test.ts'],
  },
  eslint.configs.recommended,
  {
    files: ["src/**/*.ts"],
    ignores: ["**/__tests__/**", "**/*.test.ts"],
    plugins: {
      '@typescript-eslint': tseslint.plugin,
    },
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: true,
      },
      globals: {
        ...globals.node,
        console: 'readonly',
        process: 'readonly',
      },
    },
    rules: {
      "no-console": "off",
      '@typescript-eslint/no-unsafe-argument': 'warn',
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-unsafe-call': 'warn',
      '@typescript-eslint/no-unsafe-member-access': 'warn',
      '@typescript-eslint/no-unsafe-return': 'error',
    },
  });
