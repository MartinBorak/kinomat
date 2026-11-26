import { billFilms } from 'kinomat-core/db/__fixtures__/billFilms'
import { toFilmValues } from 'kinomat-core/db/__fixtures__/filmValues'
import { databaseUrl, it } from 'kinomat-core/db/__fixtures__/testDatabase'
import { films } from 'kinomat-core/db/schema'
import { parseBratislavaTime } from 'kinomat-core/lib/time'
import { toFilmPublicId } from 'kinomat-core/types/film'
import { describe, expect } from 'vitest'

import { findFilmPage, findPlayingFilms } from '@/site/films/findFilms'

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

  // The page answers to both names, so the alias is its address and an old id link still finds it.
  it('finds a playing film by its alias or its public id, and nothing for a name no film has', async ({
    database,
  }) => {
    await billFilms(database, [{ titles: ['Vlny'], times: ['2026-09-10T20:00:00'] }])
    await database.update(films).set({ alias: 'vlny' })
    const publicId = toFilmPublicId(toFilmValues({ titleSk: 'Vlny' }))

    expect((await findFilmPage(database, 'vlny', NOW))?.publicId).toBe(publicId)
    expect((await findFilmPage(database, publicId, NOW))?.alias).toBe('vlny')
    expect(await findFilmPage(database, 'duna', NOW)).toBeNull()
  })

  // Its page outlasts its last showing by thirty days, saying it has stopped, and then is gone.
  it('finds a film that stopped for thirty days after its last showing', async ({ database }) => {
    await billFilms(database, [{ titles: ['Vlny'], times: ['2026-09-10T20:00:00'] }])
    await database
      .update(films)
      .set({ alias: 'vlny', lastScreeningAt: parseBratislavaTime('2026-09-10T20:00:00') })

    expect(await findFilmPage(database, 'vlny', NOW)).toMatchObject({ isPlaying: true })
    expect(
      await findFilmPage(database, 'vlny', parseBratislavaTime('2026-10-10T23:00:00')),
    ).toMatchObject({ isPlaying: false })
    expect(
      await findFilmPage(database, 'vlny', parseBratislavaTime('2026-10-11T09:00:00')),
    ).toBeNull()
  })
})
