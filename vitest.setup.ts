// Adds jest-dom's DOM-specific matchers (e.g. toBeInTheDocument) to Vitest's expect.
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

/*
 * Testing Library unmounts after each test only when Vitest runs with globals, which this project
 * does not: without this, one test's DOM is still mounted while the next one queries.
 */
afterEach(cleanup)

/*
 * jsdom has no ResizeObserver and lays nothing out, so a component that measures itself gets a
 * constructor that never fires rather than a crash. What it would have measured is always 0 here.
 */
globalThis.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
}
