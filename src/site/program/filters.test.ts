import { type FilmGenre } from 'kinomat-core/db/findGenres'
import { parseBratislavaTime } from 'kinomat-core/lib/time'
import { Temporal } from 'temporal-polyfill'
import { describe, expect, it } from 'vitest'

import { programCopyByLanguage } from '@/site/program/copy'
import {
  applyFilters,
  deriveFilterOptions,
  hasAnyFilter,
  NO_FILTERS,
  parseFilters,
  type ProgramFilters,
  type Selection,
  toggleValue,
  toProgramHref,
} from '@/site/program/filters'
import {
  type ListedFilm,
  type ProgrammeListing,
  type Showing,
} from '@/site/program/groupScreenings'

const SLOVAK = programCopyByLanguage.sk
const DATE = Temporal.PlainDate.from('2026-09-05')

function createShowing(showing: Partial<Showing> = {}): Showing {
  return {
    id: 1,
    startsAt: parseBratislavaTime('2026-09-05T20:15:00'),
    format: ['2d'],
    language: 'sk',
    subtitles: '',
    bookingUrl: '',
    eventNote: '',
    price: null,
    ...showing,
  }
}

const DRAMA: FilmGenre = { id: 18, nameSk: 'Dráma', nameEn: 'Drama' }
const COMEDY: FilmGenre = { id: 35, nameSk: 'Komédia', nameEn: 'Comedy' }

function createFilm(titleSk: string, genres: FilmGenre[] = [DRAMA]): ListedFilm {
  return {
    id: 1,
    publicId: 'k7f3q2abcd',
    titleSk,
    titleEn: 'Waves',
    originalTitle: titleSk,
    releaseYear: 2024,
    runtimeMinutes: 131,
    imdbId: null,
    csfdId: null,
    posterPath: null,
    directors: [],
    genres,
  }
}

function createProgramme(
  titleSk: string,
  cinemas: { id: string; name: string; showings: Showing[] }[],
  films: ListedFilm[] = [createFilm(titleSk)],
): ProgrammeListing {
  return {
    id: 1,
    films,
    cinemas: cinemas.map((cinema) => ({ ...cinema, address: 'Špitálska 4, Bratislava' })),
  }
}

const LUMIERE = { id: 'kino-lumiere', name: 'Kino Lumière' }
const EDISON = { id: 'edison-filmhub', name: 'Edison Filmhub' }

function withFilters(filters: Partial<ProgramFilters>): ProgramFilters {
  return { ...NO_FILTERS, ...filters }
}

describe('reading the filters out of a URL', () => {
  it('reads an absent dimension and an empty one alike, as nothing chosen', () => {
    expect(parseFilters(new URLSearchParams('den=2026-09-05')).cinemas).toEqual([])
    expect(parseFilters(new URLSearchParams('kino=')).cinemas).toEqual([])
  })

  it('reads a list, and folds the case the source wrote', () => {
    expect(parseFilters(new URLSearchParams('zvuk=SK,en')).audio).toEqual(['sk', 'en'])
  })

  it('writes back only what was chosen, so an untouched link stays short', () => {
    expect(toProgramHref(DATE, 'sk')).toBe('/program?den=2026-09-05')
    expect(toProgramHref(DATE, 'en')).toBe('/en/program?den=2026-09-05')
    expect(toProgramHref(undefined, 'sk')).toBe('/program')
    expect(
      toProgramHref(DATE, 'sk', withFilters({ query: 'vlny', cinemas: ['kino-lumiere'] })),
    ).toBe('/program?den=2026-09-05&q=vlny&kino=kino-lumiere')
  })

  it('survives a round trip through the URL', () => {
    const filters = withFilters({ query: 'vlny', cinemas: ['kino-lumiere'], subtitles: ['en'] })
    const query = toProgramHref(DATE, 'sk', filters).split('?')[1]

    expect(parseFilters(new URLSearchParams(query))).toEqual(filters)
  })

  it('knows whether anything is filtered at all', () => {
    expect(hasAnyFilter(NO_FILTERS)).toBe(false)
    expect(hasAnyFilter(withFilters({ query: 'v' }))).toBe(true)
    expect(hasAnyFilter(withFilters({ formats: ['imax'] }))).toBe(true)
  })
})

describe('what the menus offer', () => {
  it('reads its options off the day, splitting a showing written in two languages', () => {
    const options = deriveFilterOptions(
      [
        createProgramme('Vlny', [
          { ...LUMIERE, showings: [createShowing({ language: 'en, sk', subtitles: 'cs' })] },
          { ...EDISON, showings: [createShowing({ id: 2, format: ['imax', '2D'] })] },
        ]),
      ],
      SLOVAK,
      'sk',
    )

    expect(options.cinemas).toEqual([
      { value: 'edison-filmhub', label: 'Edison Filmhub' },
      { value: 'kino-lumiere', label: 'Kino Lumière' },
    ])
    expect(options.audio.map(({ value }) => value)).toEqual(['en', 'sk'])
    expect(options.subtitles).toEqual([{ value: 'cs', label: 'Čeština' }])
    // '2D' and '2d' are the same format written twice, and IMAX is the acronym it is.
    expect(options.formats).toEqual([
      { value: '2d', label: '2D' },
      { value: 'imax', label: 'IMAX' },
    ])
  })

  it('offers the genres of the films on the day, named in the reader’s language', () => {
    const day = [
      createProgramme(
        'Vlny',
        [{ ...LUMIERE, showings: [createShowing()] }],
        [createFilm('Vlny', [COMEDY, DRAMA])],
      ),
    ]

    expect(deriveFilterOptions(day, SLOVAK, 'sk').genres).toEqual([
      { value: '18', label: 'Dráma' },
      { value: '35', label: 'Komédia' },
    ])
    expect(deriveFilterOptions(day, programCopyByLanguage.en, 'en').genres).toEqual([
      { value: '35', label: 'Comedy' },
      { value: '18', label: 'Drama' },
    ])
  })
})

describe('applying the filters to a day', () => {
  const day = [
    createProgramme('Vlny', [
      {
        ...LUMIERE,
        showings: [
          createShowing({ id: 1, language: 'sk', subtitles: '' }),
          createShowing({ id: 2, language: 'en', subtitles: 'sk', format: ['imax'] }),
        ],
      },
      { ...EDISON, showings: [createShowing({ id: 3, language: 'cs' })] },
    ]),
  ]

  it('drops the showings that do not match, then whatever that leaves empty', () => {
    const [programme] = applyFilters(day, withFilters({ audio: ['en'] }))

    expect(programme.cinemas).toHaveLength(1)
    expect(programme.cinemas[0].showings.map(({ id }) => id)).toEqual([2])
  })

  it('leaves a day with nothing matching as no programmes at all', () => {
    expect(applyFilters(day, withFilters({ formats: ['4dx'] }))).toEqual([])
  })

  /*
   * A genre is the film's rather than the showing's, so it keeps or drops the whole bill - and a
   * double feature is kept by either of its films, every showing of it included.
   */
  it('keeps a bill whichever of its films is of a chosen genre', () => {
    const doubleFeature = [
      createProgramme(
        'Vlny',
        [{ ...LUMIERE, showings: [createShowing(), createShowing({ id: 2 })] }],
        [createFilm('Vlny', [DRAMA]), createFilm('Autá', [COMEDY])],
      ),
    ]

    const [kept] = applyFilters(doubleFeature, withFilters({ genres: ['35'] }))

    expect(kept.films.map(({ titleSk }) => titleSk)).toEqual(['Vlny', 'Autá'])
    expect(kept.cinemas[0].showings).toHaveLength(2)
    expect(applyFilters(doubleFeature, withFilters({ genres: ['27'] }))).toEqual([])
  })

  it('excludes a showing whose cinema printed no subtitles line, rather than calling it none', () => {
    const [programme] = applyFilters(day, withFilters({ subtitles: ['sk'] }))

    expect(programme.cinemas[0].showings.map(({ id }) => id)).toEqual([2])
  })

  it('keeps only the chosen cinemas', () => {
    const [programme] = applyFilters(day, withFilters({ cinemas: ['edison-filmhub'] }))

    expect(programme.cinemas.map(({ id }) => id)).toEqual(['edison-filmhub'])
  })

  it('matches a query against either title, diacritics folded', () => {
    expect(applyFilters(day, withFilters({ query: 'VLN' }))).toHaveLength(1)
    expect(applyFilters(day, withFilters({ query: 'waves' }))).toHaveLength(1)
    expect(applyFilters(day, withFilters({ query: 'anora' }))).toEqual([])
  })

  it('shows the whole day when nothing is filtered', () => {
    expect(applyFilters(day, NO_FILTERS)).toEqual(day)
  })
})

describe('ticking a box', () => {
  const options = [
    { value: 'sk', label: 'Slovenčina' },
    { value: 'en', label: 'Angličtina' },
  ]

  it('ticks a box into an untouched dimension, and clears it back out', () => {
    const selection: Selection = toggleValue([], options, 'sk')

    expect(selection).toEqual(['sk'])
    expect(toggleValue(selection, options, 'sk')).toEqual([])
  })

  it('keeps the options in their own order rather than the order they were ticked', () => {
    expect(toggleValue(['en'], options, 'sk')).toEqual(['sk', 'en'])
  })
})
