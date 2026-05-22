const eslint = require('@eslint/js')
const tsPlugin = require('@typescript-eslint/eslint-plugin')
const reactHooks = require('eslint-plugin-react-hooks')
const globals = require('globals')

const tsRecommended = [tsPlugin.configs['flat/recommended']].flat()

module.exports = [
  {
    ignores: ['packages/shared/dist/**', 'build/**', 'coverage/**', 'node_modules/**']
  },

  // Base JS rules for all files
  eslint.configs.recommended,

  // TypeScript rules for all TS/TSX files
  ...tsRecommended,

  // React hooks — src only (e2e uses Playwright's test.use(), not React hooks)
  {
    files: ['src/**/*.{ts,tsx,js,jsx}'],
    plugins: { 'react-hooks': reactHooks },
    languageOptions: {
      globals: { ...globals.browser }
    },
    rules: {
      ...reactHooks.configs['recommended-latest'].rules
    }
  },

  // Node.js CommonJS files (setupProxy, config scripts, server-side JS)
  {
    files: ['**/*.js', '**/*.cjs'],
    ignores: ['src/**', 'e2e/**', 'performance/**', 'mobile/**'],
    languageOptions: {
      globals: { ...globals.node, ...globals.commonjs },
      sourceType: 'commonjs'
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off'
    }
  },

  // src JS files that are Node.js (setupProxy.js, config-overrides.js)
  {
    files: ['src/setupProxy.js', 'config-overrides.js'],
    languageOptions: {
      globals: { ...globals.node, ...globals.commonjs },
      sourceType: 'commonjs'
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off'
    }
  },

  // Mobile config/build scripts are Node.js CommonJS
  {
    files: ['mobile/**/*.{js,cjs}'],
    languageOptions: {
      globals: { ...globals.node, ...globals.commonjs },
      sourceType: 'commonjs'
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off'
    }
  },

  // Mobile TS — separate tsconfig
  {
    files: ['mobile/**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        project: './mobile/tsconfig.json'
      }
    }
  }
]
