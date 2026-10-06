import { parseBratislavaTime } from 'kinomat-core/lib/time'
import { describe, expect, it } from 'vitest'

import { type ScreeningRow } from '@/site/program/findScreenings'
import { groupIntoProgrammes } from '@/site/program/groupScreenings'

function createRow(row: Partial<ScreeningRow>): ScreeningRow {
  return {
    screeningId: 1,
    programmeId: 1,
    startsAt: parseBratislavaTime('2026-09-10T18:30:00'),
    format: [],
    language: 'original',
    subtitles: '',
    bookingUrl: '',
    eventNote: '',
    price: null,
    cinemaId: 'kino-lumiere',
    cinemaName: 'Kino Lumière',
    cinemaAddress: 'Špitálska 4, Bratislava',
    filmId: 1,
    publicId: 'k7f3q2abcd',
    filmPosition: 0,
    titleSk: 'Vlny',
    titleEn: '',
    originalTitle: 'Vlny',
    releaseYear: 2024,
    runtimeMinutes: 131,
    imdbId: null,
    csfdId: null,
    posterPath: null,
    directors: [],
    genres: [],
    ...row,
  }
}

describe('grouping a day into programmes', () => {
  it('bills a double feature once, both films in the order they play', () => {
    const [programme] = groupIntoProgrammes([
      createRow({ filmId: 7, filmPosition: 1, titleSk: 'Zakorenení vo vode' }),
      createRow({ filmId: 3, filmPosition: 0, titleSk: 'Pozdravy z Rodosu' }),
    ])

    expect(programme.films.map((film) => film.titleSk)).toEqual([
      'Pozdravy z Rodosu',
      'Zakorenení vo vode',
    ])
    expect(programme.cinemas[0].showings).toHaveLength(1)
  })

  it('keeps two programmes apart even where they share a film', () => {
    const listings = groupIntoProgrammes([
      createRow({ programmeId: 1, screeningId: 1 }),
      createRow({ programmeId: 2, screeningId: 2 }),
    ])

    expect(listings).toHaveLength(2)
  })

  it('groups a programme by cinema, cinemas in Slovak alphabetical order', () => {
    const [programme] = groupIntoProgrammes([
      createRow({ screeningId: 1, cinemaId: 'kino-mladost', cinemaName: 'Kino Mladosť' }),
      createRow({ screeningId: 2, cinemaId: 'edison-filmhub', cinemaName: 'Edison Filmhub' }),
      createRow({ screeningId: 3, cinemaId: 'kino-mladost', cinemaName: 'Kino Mladosť' }),
    ])

    expect(programme.cinemas.map((cinema) => cinema.name)).toEqual([
      'Edison Filmhub',
      'Kino Mladosť',
    ])
    expect(programme.cinemas[1].showings).toHaveLength(2)
  })

  it('puts a cinema’s showings in the order they start', () => {
    const [programme] = groupIntoProgrammes([
      createRow({ screeningId: 1, startsAt: parseBratislavaTime('2026-09-10T20:00:00') }),
      createRow({ screeningId: 2, startsAt: parseBratislavaTime('2026-09-10T17:15:00') }),
    ])

    expect(programme.cinemas[0].showings.map((showing) => showing.id)).toEqual([2, 1])
  })

  it('orders the programmes by the titles they are read under', () => {
    const listings = groupIntoProgrammes([
      createRow({ programmeId: 1, filmId: 1, titleSk: 'Čierny pes' }),
      createRow({ programmeId: 2, filmId: 2, titleSk: 'Anora' }),
      createRow({ programmeId: 3, filmId: 3, titleSk: 'Cena za šťastie' }),
    ])

    expect(listings.flatMap((listing) => listing.films.map((film) => film.titleSk))).toEqual([
      'Anora',
      'Cena za šťastie',
      'Čierny pes',
    ])
  })
})
