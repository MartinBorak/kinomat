import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'
import eslintConfigPrettier from 'eslint-config-prettier'
import perfectionist from 'eslint-plugin-perfectionist'
import { defineConfig, globalIgnores } from 'eslint/config'

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Disable ESLint stylistic rules that would conflict with Prettier; Prettier owns formatting.
  eslintConfigPrettier,
  {
    plugins: { perfectionist },
    rules: {
      /**
       * Named functions read as `function foo() {}`, not `const foo = () => {}`.
       * Inline callbacks (.map(), useEffect(), etc.) are unaffected since they
       * aren't bound to a name via a variable declarator.
       */
      'func-style': ['error', 'declaration'],
      // Always require { } around if/else/for/while bodies, even single-statement ones.
      curly: ['error', 'all'],
      /**
       * An empty interface extending one type is how a computed type is given a
       * name TypeScript will print, so a hover says `SavedScreening` rather than
       * the whole shape. Every other empty-object-type mistake stays an error.
       */
      '@typescript-eslint/no-empty-object-type': [
        'error',
        { allowInterfaces: 'with-single-extends' },
      ],
      // A comment spanning multiple lines must be a /** */ block, not stacked // lines.
      'multiline-comment-style': ['error', 'starred-block'],
      /**
       * Group imports (packages, then @/ alias, then relative), alphabetical
       * within each group, blank line between groups. `type` imports sort
       * alongside their value counterparts rather than in a separate block.
       */
      'perfectionist/sort-imports': [
        'error',
        {
          groups: [['builtin', 'external'], 'internal', ['parent', 'sibling', 'index'], 'unknown'],
          internalPattern: ['^@/.+'],
          newlinesBetween: 1,
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
  ]),
])

export default eslintConfig
