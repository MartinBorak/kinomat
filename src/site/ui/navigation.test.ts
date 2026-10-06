import { describe, expect, it } from 'vitest'

import { toSiteNavigation } from '@/site/ui/navigation'

describe('the site navigation', () => {
  it('links the three views and the About page bare in Slovak, and marks the current one', () => {
    expect(toSiteNavigation('sk', 'filmy')).toEqual([
      { label: 'Kiná', href: '/kina', isCurrent: false },
      { label: 'Filmy', href: '/filmy', isCurrent: true },
      { label: 'Program', href: '/program', isCurrent: false },
      { label: 'O Kinomate', href: '/o-kinomate', isCurrent: false },
    ])
  })

  // A reader who switched to English stays in it on the next page, not just this one.
  it('carries English across to every view', () => {
    expect(toSiteNavigation('en', null).map((item) => item.href)).toEqual([
      '/en/kina',
      '/en/filmy',
      '/en/program',
      '/en/o-kinomate',
    ])
  })
})
