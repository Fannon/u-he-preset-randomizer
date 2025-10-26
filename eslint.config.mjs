// @ts-check
import globals from 'globals';
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    // config with just ignores is the replacement for `.eslintignore`
    ignores: [
      '**/dist/**',
      '**/__tests__/**',
      '**/*.test.ts',
      '**/coverage/**',
      '**/.husky/**',
    ],
  },
  eslint.configs.recommended,
  {
    // Apply type-aware linting only to TypeScript files in the src directory
    files: ['src/**/*.ts'],
    ignores: ['**/__tests__/**', '**/*.test.ts'],
    extends: [
      ...tseslint.configs.recommendedTypeChecked,
      ...tseslint.configs.stylisticTypeChecked,
    ],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        ...globals.node,
      },
    },
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-unsafe-call': 'warn',
      '@typescript-eslint/no-unsafe-member-access': 'warn',
      '@typescript-eslint/no-unsafe-return': 'error',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
    },
  },
  {
    // Basic linting for config files (no type checking)
    files: ['*.js', '*.mjs', '*.cjs'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  }
);
