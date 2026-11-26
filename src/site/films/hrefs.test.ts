import { describe, expect, it } from 'vitest'

import { toFilmHref } from '@/site/films/hrefs'

describe('film hrefs', () => {
  it('links a film by its alias, and by its public id only where it has none', () => {
    expect(toFilmHref({ publicId: 'a1b2c3d4e5f6', alias: 'vlny' }, 'sk', 'bratislava')).toBe(
      '/bratislava/filmy/vlny',
    )
    expect(toFilmHref({ publicId: 'a1b2c3d4e5f6', alias: null }, 'sk', 'bratislava')).toBe(
      '/bratislava/filmy/a1b2c3d4e5f6',
    )
  })
})
