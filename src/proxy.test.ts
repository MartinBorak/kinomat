import { NextRequest } from 'next/server'
import { describe, expect, it, vi } from 'vitest'

import { proxy } from '@/proxy'

// One film with an alias and one without; the database is not this file's question.
vi.mock('kinomat-core/db/appDatabase', () => ({ getDatabase: () => ({}) }))
vi.mock('@/site/films/findFilms', () => ({
  findFilmAlias: async (_database: unknown, publicId: string) =>
    publicId === 'a1b2c3d4e5f6' ? 'vlny' : null,
}))

function request(path: string, city?: string): NextRequest {
  return new NextRequest(`https://kinomat.test${path}`, {
    headers: city === undefined ? {} : { cookie: `vybrane-mesto=${city}` },
  })
}

describe('the language proxy', () => {
  it('serves a bare path from its Slovak twin, without the reader seeing it', async () => {
    const response = await proxy(request('/bratislava/kina/kino-lumiere/2026-09-05?titulky=en'))

    expect(response.headers.get('x-middleware-rewrite')).toBe(
      'https://kinomat.test/sk/bratislava/kina/kino-lumiere/2026-09-05?titulky=en',
    )
  })

  it('serves a page outside any city the same way', async () => {
    expect((await proxy(request('/o-kinomate'))).headers.get('x-middleware-rewrite')).toBe(
      'https://kinomat.test/sk/o-kinomate',
    )
  })

  it('lets an English path through as it is', async () => {
    const response = await proxy(request('/en/kosice/program'))

    expect(response.headers.get('x-middleware-rewrite')).toBeNull()
    expect(response.headers.get('x-middleware-next')).toBe('1')
  })

  // One URL per page: the default language is spelled bare, so its prefix is not a second spelling.
  it('sends the Slovak prefix to the bare path for good', async () => {
    const response = await proxy(request('/sk/kosice/filmy?q=vlny'))

    expect(response.status).toBe(308)
    expect(response.headers.get('location')).toBe('https://kinomat.test/kosice/filmy?q=vlny')
    expect((await proxy(request('/sk'))).headers.get('location')).toBe('https://kinomat.test/')
  })

  // Links shared while the day was a query still say ?den=; each moves to the path that is cached.
  it('moves a day out of the query and into the path, keeping the rest of the query', async () => {
    const response = await proxy(request('/en/filmy/k7f3q2abcd?den=2026-09-05&kino=kino-lumiere'))

    expect(response.status).toBe(308)
    expect(response.headers.get('location')).toBe(
      'https://kinomat.test/en/filmy/k7f3q2abcd/2026-09-05?kino=kino-lumiere',
    )
    expect((await proxy(request('/program?den=zajtra'))).headers.get('location')).toBe(
      'https://kinomat.test/program',
    )
    expect((await proxy(request('/nitra/program?den=2026-09-05'))).headers.get('location')).toBe(
      'https://kinomat.test/nitra/program/2026-09-05',
    )
  })

  it('leaves the reel its day in the query, where its capture asks for it', async () => {
    const response = await proxy(request('/reel?den=2026-09-05'))

    expect(response.headers.get('x-middleware-rewrite')).toBe(
      'https://kinomat.test/sk/reel?den=2026-09-05',
    )
  })
})

describe('the city proxy', () => {
  // Temporary, since the same link leads each reader to their own city.
  it('sends a listing without a city to the one the reader last looked at', async () => {
    const response = await proxy(request('/program/2026-09-05?kino=x', 'kosice'))

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe(
      'https://kinomat.test/kosice/program/2026-09-05?kino=x',
    )
    expect((await proxy(request('/en/filmy', 'nitra'))).headers.get('location')).toBe(
      'https://kinomat.test/en/nitra/filmy',
    )
  })

  // The front page names no city: it is served in the reader's, under the bare URL.
  it('serves the front page in the reader’s city without naming it', async () => {
    const response = await proxy(request('/?q=x', 'zilina'))

    expect(response.headers.get('location')).toBeNull()
    expect(response.headers.get('x-middleware-rewrite')).toBe('https://kinomat.test/sk/zilina?q=x')
    expect((await proxy(request('/en', 'zilina'))).headers.get('x-middleware-rewrite')).toBe(
      'https://kinomat.test/en/zilina',
    )
    expect((await proxy(request('/en'))).headers.get('x-middleware-rewrite')).toBe(
      'https://kinomat.test/en/bratislava',
    )
  })

  // Nothing on the site links to /kosice, so no prefetch can ask for it and the city can be kept.
  it('sends a city’s front page to the bare one, remembering the city', async () => {
    const response = await proxy(request('/kosice?q=x', 'zilina'))

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('https://kinomat.test/?q=x')
    expect(response.cookies.get('vybrane-mesto')?.value).toBe('kosice')
    expect((await proxy(request('/en/nitra'))).headers.get('location')).toBe(
      'https://kinomat.test/en',
    )
  })

  it('sends a reader with no city, or one we do not cover, to Bratislava', async () => {
    expect((await proxy(request('/kina'))).headers.get('location')).toBe(
      'https://kinomat.test/bratislava/kina',
    )
    expect((await proxy(request('/kina', 'atlantis'))).headers.get('location')).toBe(
      'https://kinomat.test/bratislava/kina',
    )
  })

  // A cinema decides its own city, whatever the reader last looked at.
  it('sends a cinema without a city to its own', async () => {
    expect(
      (await proxy(request('/kina/kino-lumiere/2026-09-05', 'kosice'))).headers.get('location'),
    ).toBe('https://kinomat.test/bratislava/kina/kino-lumiere/2026-09-05')
  })

  // A film's page lists one city's showings, so a link without the city goes to the reader's.
  it('sends a film’s page without a city to the reader’s, keeping its day and query', async () => {
    const response = await proxy(request('/en/filmy/k7f3q2abcd/2026-09-05?kino=x', 'kosice'))

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe(
      'https://kinomat.test/en/kosice/filmy/k7f3q2abcd/2026-09-05?kino=x',
    )
  })

  it('leaves the About page outside any city', async () => {
    expect((await proxy(request('/o-kinomate', 'kosice'))).status).toBe(200)
  })

  // Prefetches of links to other cities pass through here too, so the page remembers the city.
  it('remembers no city itself', async () => {
    expect((await proxy(request('/en/kosice/program'))).headers.get('set-cookie')).toBeNull()
  })

  // The city once lived in an httpOnly cookie, which the page cannot overwrite.
  it('moves a city from the old cookie to the new one', async () => {
    const legacy = new NextRequest('https://kinomat.test/kosice/program', {
      headers: { cookie: 'mesto=nitra' },
    })
    const response = await proxy(legacy)

    expect(response.cookies.get('vybrane-mesto')?.value).toBe('nitra')
    expect(response.cookies.get('vybrane-mesto')?.httpOnly).toBeFalsy()
    expect(response.headers.get('set-cookie')).toContain('mesto=; Path=/; Expires=Thu, 01 Jan 1970')
  })

  it('reads the old cookie for a city-less link until it is moved', async () => {
    const legacy = new NextRequest('https://kinomat.test/program', {
      headers: { cookie: 'mesto=nitra' },
    })

    expect((await proxy(legacy)).headers.get('location')).toBe('https://kinomat.test/nitra/program')
  })

  // Links use the alias, so an id saved earlier is sent on to it, with its day and query.
  it('sends a film’s public id on to its alias, for now', async () => {
    const response = await proxy(request('/en/kosice/filmy/a1b2c3d4e5f6/2026-09-05?kino=x'))

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe(
      'https://kinomat.test/en/kosice/filmy/vlny/2026-09-05?kino=x',
    )
  })

  it('serves a film without an alias, or named by its alias, where it was asked for', async () => {
    expect((await proxy(request('/kosice/filmy/b1b2c3d4e5f6'))).headers.get('location')).toBeNull()
    expect((await proxy(request('/kosice/filmy/vlny'))).headers.get('location')).toBeNull()
  })
})
