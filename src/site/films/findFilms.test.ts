import { billFilms } from 'kinomat-core/db/__fixtures__/billFilms'
import { databaseUrl, it } from 'kinomat-core/db/__fixtures__/testDatabase'
import { parseBratislavaTime } from 'kinomat-core/lib/time'
import { describe, expect } from 'vitest'

import { findPlayingFilms } from '@/site/films/findFilms'

const NOW = parseBratislavaTime('2026-09-10T09:00:00')

describe.skipIf(!databaseUrl)('reading what is playing', () => {
  it('lists a film once, however many showings it has', async ({ database }) => {
    await billFilms(database, [
      { titles: ['Vlny'], times: ['2026-09-10T20:00:00', '2026-09-13T18:00:00'] },
    ])

    const rows = await findPlayingFilms(database, NOW)

    expect(rows.map((row) => row.titleSk)).toEqual(['Vlny'])
    expect(rows[0].screeningCount).toBe(2)
  })

  it('reports the first and last showing still to come', async ({ database }) => {
    await billFilms(database, [
      { titles: ['Vlny'], times: ['2026-09-10T20:00:00', '2026-09-13T18:00:00'] },
    ])

    const [row] = await findPlayingFilms(database, NOW)

    expect(row.nextStartsAt).toEqual(parseBratislavaTime('2026-09-10T20:00:00'))
    expect(row.lastStartsAt).toEqual(parseBratislavaTime('2026-09-13T18:00:00'))
  })

  it('counts only the showings still to come', async ({ database }) => {
    await billFilms(database, [
      { titles: ['Vlny'], times: ['2026-09-10T08:00:00', '2026-09-10T20:00:00'] },
    ])

    const [row] = await findPlayingFilms(database, NOW)

    expect(row.screeningCount).toBe(1)
    expect(row.nextStartsAt).toEqual(parseBratislavaTime('2026-09-10T20:00:00'))
  })

  it('drops a film whose every showing has started', async ({ database }) => {
    await billFilms(database, [
      { titles: ['Vlny'], times: ['2026-09-10T08:00:00'] },
      { titles: ['Dune'], times: ['2026-09-10T20:00:00'] },
    ])

    const rows = await findPlayingFilms(database, NOW)

    expect(rows.map((row) => row.titleSk)).toEqual(['Dune'])
  })

  /*
   * A film sold out is still playing. The schedule leaves its showings out, having no ticket to
   * offer for them, but the film keeps its page until the last of them is in the past.
   */
  it('keeps a film whose every showing is sold out', async ({ database }) => {
    await billFilms(database, [
      { titles: ['Vlny'], times: ['2026-09-10T20:00:00'], isSoldOut: true },
    ])

    const rows = await findPlayingFilms(database, NOW)

    expect(rows.map((row) => row.titleSk)).toEqual(['Vlny'])
  })

  it('names every cinema a film plays in, and each of them once', async ({ database }) => {
    await billFilms(database, [
      { titles: ['Vlny'], cinemaId: 'kino-lumiere', times: ['2026-09-10T20:00:00'] },
      {
        titles: ['Vlny'],
        cinemaId: 'kino-mladost',
        times: ['2026-09-11T18:00:00', '2026-09-12T18:00:00'],
      },
    ])

    const [row] = await findPlayingFilms(database, NOW)

    expect(row.cinemaIds).toEqual(['kino-lumiere', 'kino-mladost'])
  })

  it('lists a double feature as its two films, not as its bill', async ({ database }) => {
    await billFilms(database, [
      { titles: ['Pozdravy z Rodosu', 'Zakorenení vo vode'], times: ['2026-09-10T19:00:00'] },
    ])

    const rows = await findPlayingFilms(database, NOW)

    expect(rows.map((row) => row.titleSk)).toEqual(['Pozdravy z Rodosu', 'Zakorenení vo vode'])
    expect(rows.map((row) => row.screeningCount)).toEqual([1, 1])
  })

  it('puts the film screening soonest first', async ({ database }) => {
    await billFilms(database, [
      { titles: ['Vlny'], times: ['2026-09-13T18:00:00'] },
      { titles: ['Dune'], times: ['2026-09-10T20:00:00'] },
    ])

    const rows = await findPlayingFilms(database, NOW)

    expect(rows.map((row) => row.titleSk)).toEqual(['Dune', 'Vlny'])
  })
})
