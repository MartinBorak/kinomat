import { describe, expect, it } from 'vitest'

import {
  findSuggestionGroups,
  matchSuggestions,
  toFilmSuggestions,
} from '@/site/search/suggestions'

const CINEMAS = [
  { name: 'Kino Lumière', alternates: [], meta: 'Špitálska 4' },
  { name: 'Kino Mladosť', alternates: [], meta: 'Hviezdoslavovo námestie 17' },
  { name: 'Artkino Za zrkadlom', alternates: [], meta: 'Rovniankova 3' },
  { name: 'Edison Filmhub', alternates: [], meta: 'Baštová 348/6A' },
  { name: 'Kino Lúky', alternates: [], meta: 'Vígľašská 1' },
]

describe('matchSuggestions', () => {
  it('matches anywhere in the name, not only at its start', () => {
    expect(matchSuggestions(CINEMAS, 'zrkadlom')).toEqual([
      { name: 'Artkino Za zrkadlom', alternates: [], meta: 'Rovniankova 3' },
    ])
  })

  it('ignores case', () => {
    expect(matchSuggestions(CINEMAS, 'EDISON')).toEqual([
      { name: 'Edison Filmhub', alternates: [], meta: 'Baštová 348/6A' },
    ])
  })

  it('matches a name written with diacritics from a query typed without them', () => {
    expect(matchSuggestions(CINEMAS, 'lumiere')).toEqual([
      { name: 'Kino Lumière', alternates: [], meta: 'Špitálska 4' },
    ])
    expect(matchSuggestions(CINEMAS, 'luky')).toEqual([
      { name: 'Kino Lúky', alternates: [], meta: 'Vígľašská 1' },
    ])
  })

  it('returns nothing for a query that is empty or only spaces', () => {
    expect(matchSuggestions(CINEMAS, '')).toEqual([])
    expect(matchSuggestions(CINEMAS, '   ')).toEqual([])
  })

  it('returns at most four matches', () => {
    expect(matchSuggestions(CINEMAS, 'o')).toHaveLength(4)
  })
})

describe('findSuggestionGroups', () => {
  it('keeps the given order and drops the groups nothing matched', () => {
    const groups = findSuggestionGroups(
      [
        { label: 'Filmy', suggestions: [{ name: 'Vlny', alternates: [], meta: 'dnes' }] },
        { label: 'Kiná', suggestions: CINEMAS },
      ],
      'kino l',
    )

    expect(groups).toEqual([
      {
        label: 'Kiná',
        items: [
          { name: 'Kino Lumière', alternates: [], meta: 'Špitálska 4' },
          { name: 'Kino Lúky', alternates: [], meta: 'Vígľašská 1' },
        ],
      },
    ])
  })

  it('is empty when nothing matches, which is what hides the panel', () => {
    expect(findSuggestionGroups([{ label: 'Kiná', suggestions: CINEMAS }], 'xyz')).toEqual([])
  })
})

describe('film suggestions', () => {
  const FILM = {
    publicId: 'k7f3q2abcd',
    titleSk: 'Vlny',
    titleEn: 'Waves',
    originalTitle: 'Vlny',
    releaseYear: 2024,
  }

  it('answers to every title the film has, whichever one is shown', () => {
    const [suggestion] = toFilmSuggestions([FILM], 'sk')

    expect(matchSuggestions([suggestion], 'waves')).toHaveLength(1)
    expect(matchSuggestions([suggestion], 'vlny')).toHaveLength(1)
  })

  it('shows the reader their own title for it', () => {
    expect(toFilmSuggestions([FILM], 'sk')[0].name).toBe('Vlny')
    expect(toFilmSuggestions([FILM], 'en')[0].name).toBe('Waves')
  })
})
