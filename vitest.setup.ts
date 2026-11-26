// Adds jest-dom's DOM-specific matchers (e.g. toBeInTheDocument) to Vitest's expect.
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

/*
 * Testing Library unmounts after each test only when Vitest runs with globals, which this project
 * does not: without this, one test's DOM is still mounted while the next one queries.
 */
afterEach(cleanup)

/*
 * jsdom has no ResizeObserver or IntersectionObserver and lays nothing out, so a component that
 * measures itself gets a constructor that never fires rather than a crash. What it would have
 * measured is always 0 here, and a bar that sticks never sticks.
 */
class SilentObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return []
  }
}

globalThis.ResizeObserver = SilentObserver
globalThis.IntersectionObserver = SilentObserver as unknown as typeof IntersectionObserver

/*
 * The city is remembered by a server action, which needs a request to set its cookie on. Here the
 * browser's cookie stands in for the one the response would have set.
 */
vi.mock('@/site/ui/rememberCityAction', () => ({
  rememberCity: (city: string) => {
    document.cookie = `vybrane-mesto=${city}; Path=/`

    return Promise.resolve()
  },
}))
