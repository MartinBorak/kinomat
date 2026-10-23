import { NextRequest } from 'next/server'
import { describe, expect, it } from 'vitest'

import { proxy } from '@/proxy'

function request(path: string): NextRequest {
  return new NextRequest(`https://kinomat.test${path}`)
}

describe('the language proxy', () => {
  it('serves a bare path from its Slovak twin, without the reader seeing it', () => {
    const response = proxy(request('/kina/kino-lumiere/2026-09-05?titulky=en'))

    expect(response.headers.get('x-middleware-rewrite')).toBe(
      'https://kinomat.test/sk/kina/kino-lumiere/2026-09-05?titulky=en',
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

  // Links shared while the day was a query still say ?den=; each moves to the path that is cached.
  it('moves a day out of the query and into the path, keeping the rest of the query', () => {
    const response = proxy(request('/en/filmy/k7f3q2abcd?den=2026-09-05&kino=kino-lumiere'))

    expect(response.status).toBe(308)
    expect(response.headers.get('location')).toBe(
      'https://kinomat.test/en/filmy/k7f3q2abcd/2026-09-05?kino=kino-lumiere',
    )
    expect(proxy(request('/program?den=zajtra')).headers.get('location')).toBe(
      'https://kinomat.test/program',
    )
  })

  it('leaves the reel its day in the query, where its capture asks for it', () => {
    const response = proxy(request('/reel?den=2026-09-05'))

    expect(response.headers.get('x-middleware-rewrite')).toBe(
      'https://kinomat.test/sk/reel?den=2026-09-05',
    )
  })
})
