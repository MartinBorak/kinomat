import { describe, expect, it } from 'vitest'

import { toCityNavigation, toSiteNavigation } from '@/site/ui/navigation'

describe('the site navigation', () => {
  it('links the city’s views, the festival and the About page in Slovak, and marks the current one', () => {
    expect(toSiteNavigation('sk', 'kosice', 'filmy')).toEqual([
      { label: 'Kiná', href: '/kosice/kina', isCurrent: false },
      { label: 'Filmy', href: '/kosice/filmy', isCurrent: true },
      { label: 'Program', href: '/kosice/program', isCurrent: false },
      { label: 'FFi', href: '/ffi', isCurrent: false },
      { label: 'O Kinomate', href: '/o-kinomate', isCurrent: false },
    ])
  })

  // A reader who switched to English stays in it on the next page, not just this one.
  it('carries English across to every view', () => {
    expect(toSiteNavigation('en', 'kosice', null).map((item) => item.href)).toEqual([
      '/en/kosice/kina',
      '/en/kosice/filmy',
      '/en/kosice/program',
      '/en/ffi',
      '/en/o-kinomate',
    ])
  })

  // The proxy fills in the reader's city, so a film's page need not know it to link to the views.
  it('links the views bare from a page outside any city', () => {
    expect(toSiteNavigation('sk', null, null).map((item) => item.href)).toEqual([
      '/kina',
      '/filmy',
      '/program',
      '/ffi',
      '/o-kinomate',
    ])
  })
})

describe('the city menu', () => {
  it('offers every city, in the section the reader is in, and marks the current one', () => {
    const items = toCityNavigation('sk', 'kosice', 'program')

    expect(items.map((item) => item.label)).toEqual([
      'Banská Bystrica',
      'Bratislava',
      'Košice',
      'Nitra',
      'Prešov',
      'Trenčín',
      'Trnava',
      'Žilina',
    ])
    expect(items.find((item) => item.isCurrent)?.label).toBe('Košice')
    expect(items.find((item) => item.label === 'Nitra')?.href).toBe('/nitra/program')
  })

  // A cinema is one city's only, so its page leads to the other city's list of them.
  it('sends a cinema’s page to the other city’s cinemas, and the front page to its front page', () => {
    expect(toCityNavigation('en', 'kosice', 'kina').at(-1)?.href).toBe('/en/zilina/kina')
    expect(toCityNavigation('sk', 'kosice', null).at(-1)?.href).toBe('/zilina')
  })
})
