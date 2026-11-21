import { NextRequest } from 'next/server'
import { describe, expect, it } from 'vitest'

import { proxy } from '@/proxy'

function request(path: string, city?: string): NextRequest {
  return new NextRequest(`https://kinomat.test${path}`, {
    headers: city === undefined ? {} : { cookie: `mesto=${city}` },
  })
}

describe('the language proxy', () => {
  it('serves a bare path from its Slovak twin, without the reader seeing it', () => {
    const response = proxy(request('/bratislava/kina/kino-lumiere/2026-09-05?titulky=en'))

    expect(response.headers.get('x-middleware-rewrite')).toBe(
      'https://kinomat.test/sk/bratislava/kina/kino-lumiere/2026-09-05?titulky=en',
    )
  })

  it('serves a page outside any city the same way', () => {
    expect(proxy(request('/o-kinomate')).headers.get('x-middleware-rewrite')).toBe(
      'https://kinomat.test/sk/o-kinomate',
    )
  })

  it('lets an English path through as it is', () => {
    const response = proxy(request('/en/kosice/program'))

    expect(response.headers.get('x-middleware-rewrite')).toBeNull()
    expect(response.headers.get('x-middleware-next')).toBe('1')
  })

  // One URL per page: the default language is spelled bare, so its prefix is not a second spelling.
  it('sends the Slovak prefix to the bare path for good', () => {
    const response = proxy(request('/sk/kosice/filmy?q=vlny'))

    expect(response.status).toBe(308)
    expect(response.headers.get('location')).toBe('https://kinomat.test/kosice/filmy?q=vlny')
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
    expect(proxy(request('/nitra/program?den=2026-09-05')).headers.get('location')).toBe(
      'https://kinomat.test/nitra/program/2026-09-05',
    )
  })

  it('leaves the reel its day in the query, where its capture asks for it', () => {
    const response = proxy(request('/reel?den=2026-09-05'))

    expect(response.headers.get('x-middleware-rewrite')).toBe(
      'https://kinomat.test/sk/reel?den=2026-09-05',
    )
  })
})

describe('the city proxy', () => {
  // Temporary, since the same link leads each reader to their own city.
  it('sends a listing without a city to the one the reader last looked at', () => {
    const response = proxy(request('/program/2026-09-05?kino=x', 'kosice'))

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe(
      'https://kinomat.test/kosice/program/2026-09-05?kino=x',
    )
    expect(proxy(request('/en/filmy', 'nitra')).headers.get('location')).toBe(
      'https://kinomat.test/en/nitra/filmy',
    )
    expect(proxy(request('/', 'zilina')).headers.get('location')).toBe(
      'https://kinomat.test/zilina',
    )
    expect(proxy(request('/en', 'zilina')).headers.get('location')).toBe(
      'https://kinomat.test/en/zilina',
    )
  })

  it('sends a reader with no city, or one we do not cover, to Bratislava', () => {
    expect(proxy(request('/kina')).headers.get('location')).toBe(
      'https://kinomat.test/bratislava/kina',
    )
    expect(proxy(request('/kina', 'atlantis')).headers.get('location')).toBe(
      'https://kinomat.test/bratislava/kina',
    )
  })

  // A cinema decides its own city, whatever the reader last looked at.
  it('sends a cinema without a city to its own', () => {
    expect(proxy(request('/kina/kino-lumiere/2026-09-05', 'kosice')).headers.get('location')).toBe(
      'https://kinomat.test/bratislava/kina/kino-lumiere/2026-09-05',
    )
  })

  it('leaves a film’s page and the About page outside any city', () => {
    expect(proxy(request('/filmy/k7f3q2abcd', 'kosice')).status).toBe(200)
    expect(proxy(request('/o-kinomate', 'kosice')).status).toBe(200)
  })

  it('remembers the city of every city page visited', () => {
    const cookie = proxy(request('/en/kosice/program')).cookies.get('mesto')

    expect(cookie?.value).toBe('kosice')
    expect(cookie?.maxAge).toBe(60 * 60 * 24 * 365)
    expect(cookie?.httpOnly).toBe(true)
  })

  it('sets nothing when the city is already the remembered one, or the page is in none', () => {
    expect(proxy(request('/kosice/program', 'kosice')).headers.get('set-cookie')).toBeNull()
    expect(proxy(request('/o-kinomate')).headers.get('set-cookie')).toBeNull()
  })
})
