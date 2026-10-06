import { NextRequest } from 'next/server'
import { describe, expect, it } from 'vitest'

import { proxy } from '@/proxy'

function request(path: string): NextRequest {
  return new NextRequest(`https://kinomat.test${path}`)
}

describe('the language proxy', () => {
  it('serves a bare path from its Slovak twin, without the reader seeing it', () => {
    const response = proxy(request('/kina/kino-lumiere?den=2026-09-05'))

    expect(response.headers.get('x-middleware-rewrite')).toBe(
      'https://kinomat.test/sk/kina/kino-lumiere?den=2026-09-05',
    )
  })

  it('serves the front page the same way', () => {
    expect(proxy(request('/')).headers.get('x-middleware-rewrite')).toBe('https://kinomat.test/sk')
  })

  it('lets an English path through as it is', () => {
    const response = proxy(request('/en/program'))

    expect(response.headers.get('x-middleware-rewrite')).toBeNull()
    expect(response.headers.get('x-middleware-next')).toBe('1')
  })

  // One URL per page: the default language is spelled bare, so its prefix is not a second spelling.
  it('sends the Slovak prefix to the bare path for good', () => {
    const response = proxy(request('/sk/filmy?q=vlny'))

    expect(response.status).toBe(308)
    expect(response.headers.get('location')).toBe('https://kinomat.test/filmy?q=vlny')
    expect(proxy(request('/sk')).headers.get('location')).toBe('https://kinomat.test/')
  })
})
