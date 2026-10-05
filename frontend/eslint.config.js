/**
 * Konfigurasi ESLint flat.
 *
 * Fokusnya boundary yang ditegaskan AGENTS.md: komponen React tidak boleh
 * memanggil fetch langsung, dan data harus lewat `lib/api` atau `lib/pb`.
 * Aturan boundary lain dijaga oleh review karena butuh pemahaman konteks.
 */
import js from '@eslint/js'
import reactHooks from 'eslint-plugin-react-hooks'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  {
    // `.astro` diparse oleh `astro check`, bukan oleh ESLint; `env.d.ts`
    // dibGenerate Astro sehingga triple-slash reference-nya memang disengaja.
    ignores: [
      'dist/',
      '.astro/',
      'android/',
      'ios/',
      'node_modules/',
      '**/*.astro',
      'src/env.d.ts',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': ['warn', { fixStyle: 'inline-type-imports' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  {
    // Service worker berjalan di scope service worker, bukan di browser window.
    files: ['public/**/*.js'],
    languageOptions: { globals: globals.serviceworker },
  },
  {
    files: ['scripts/**/*.js', '*.config.js'],
    languageOptions: { globals: globals.node },
  },
  {
    // Aturan boundary: komponen tidak boleh memanggil fetch langsung.
    files: ['src/components/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-globals': [
        'error',
        { name: 'fetch', message: 'Gunakan lib/api atau lib/pb, bukan fetch langsung.' },
      ],
      'no-restricted-properties': [
        'error',
        { property: 'collection', message: 'Gunakan lib/api/repositories, bukan pb.collection langsung.' },
      ],
    },
  },
)