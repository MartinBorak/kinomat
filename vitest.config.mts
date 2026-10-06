import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

/*
 * Two projects by file extension: only a .tsx test renders anything, so only it pays for a DOM.
 * Starting jsdom costs more than most test files do, and CI runs the files one at a time.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'dom',
          environment: 'jsdom',
          include: ['src/**/*.test.tsx'],
          setupFiles: ['./vitest.setup.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'node',
          environment: 'node',
          include: ['src/**/*.test.ts'],
          /*
           * One module graph for the run rather than one per file, which is most of what a file
           * costs. Safe because every test here restores what it stubs, and the code keeps no
           * module-level state; a shuffled run is the check on that.
           */
          isolate: false,
        },
      },
    ],
  },
})
