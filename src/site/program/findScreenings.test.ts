import { billFilms } from 'kinomat-core/db/__fixtures__/billFilms'
import { databaseUrl, it } from 'kinomat-core/db/__fixtures__/testDatabase'
import { parseBratislavaTime } from 'kinomat-core/lib/time'
import { Temporal } from 'temporal-polyfill'
import { describe, expect } from 'vitest'

import {
  findFilmDays,
  findFilmScreeningsOnDay,
  findScheduledDays,
  findScreeningsOnDay,
} from '@/site/program/findScreenings'

const DAY = Temporal.PlainDate.from('2026-09-10')
// The clock the finders would otherwise read has long since passed the fixture's September.
const MORNING = parseBratislavaTime('2026-09-10T09:00:00')

describe.skipIf(!databaseUrl)('reading a day', () => {
  it('reads that day alone', async ({ database }) => {
    await billFilms(database, [
      { titles: ['Vlny'], times: ['2026-09-10T20:00:00', '2026-09-11T20:00:00'] },
    ])

    const rows = await findScreeningsOnDay(
      database,
      DAY,
      parseBratislavaTime('2026-09-10T09:00:00'),
    )

    expect(rows.map((row) => row.startsAt)).toEqual([parseBratislavaTime('2026-09-10T20:00:00')])
  })

  it('drops a showing that has already started, since it cannot be attended', async ({
    database,
  }) => {
    await billFilms(database, [
      { titles: ['Vlny'], times: ['2026-09-10T14:00:00', '2026-09-10T20:00:00'] },
    ])

    const rows = await findScreeningsOnDay(
      database,
      DAY,
      parseBratislavaTime('2026-09-10T18:00:00'),
    )

    expect(rows.map((row) => row.startsAt)).toEqual([parseBratislavaTime('2026-09-10T20:00:00')])
  })

  it('reports one row per film of the bill, in the order it plays', async ({ database }) => {
    await billFilms(database, [
      { titles: ['Pozdravy z Rodosu', 'Zakorenení vo vode'], times: ['2026-09-10T19:00:00'] },
    ])

    const rows = await findScreeningsOnDay(
      database,
      DAY,
      parseBratislavaTime('2026-09-10T09:00:00'),
    )

    expect(rows.map((row) => row.titleSk)).toEqual(['Pozdravy z Rodosu', 'Zakorenení vo vode'])
    expect(new Set(rows.map((row) => row.screeningId)).size).toBe(1)
    expect(rows[0].cinemaName).toBe('Kino Lumière')
  })

  it('offers the days something is on, and no day in between them', async ({ database }) => {
    await billFilms(database, [
      { titles: ['Vlny'], times: ['2026-09-10T20:00:00', '2026-09-13T18:00:00'] },
    ])

    const days = await findScheduledDays(database, DAY, MORNING)

    expect(days.map((day) => day.toString())).toEqual(['2026-09-10', '2026-09-13'])
  })

  /*
   * The strip is what the reader can still go to, so a day whose showings have all started is not
   * on it - otherwise picking it would open a page that is empty for a reason the strip denied.
   */
  it('offers no day whose every showing has already started', async ({ database }) => {
    await billFilms(database, [
      { titles: ['Vlny'], times: ['2026-09-10T08:00:00', '2026-09-11T20:00:00'] },
    ])

    const days = await findScheduledDays(database, DAY, parseBratislavaTime('2026-09-10T09:00:00'))

    expect(days.map((day) => day.toString())).toEqual(['2026-09-11'])
  })

  /*
   * A sold-out showing leads nowhere: Edison prints VYPREDANÉ where the booking link would be, and
   * a card that cannot be clicked only offers a seat that is gone.
   */
  it('drops a showing no ticket can be bought for', async ({ database }) => {
    await billFilms(database, [
      { titles: ['Vlny'], times: ['2026-09-10T18:00:00'], isSoldOut: true },
      { titles: ['Dune'], times: ['2026-09-10T20:00:00'] },
    ])

    const rows = await findScreeningsOnDay(
      database,
      DAY,
      parseBratislavaTime('2026-09-10T09:00:00'),
    )

    expect(rows.map((row) => row.titleSk)).toEqual(['Dune'])
  })

  it('offers no day whose every showing is sold out', async ({ database }) => {
    await billFilms(database, [
      { titles: ['Vlny'], times: ['2026-09-10T20:00:00'], isSoldOut: true },
      { titles: ['Vlny'], times: ['2026-09-13T18:00:00'] },
    ])

    const days = await findScheduledDays(database, DAY, MORNING)

    expect(days.map((day) => day.toString())).toEqual(['2026-09-13'])
  })

  it('offers a day once, however many showings fall on it', async ({ database }) => {
    await billFilms(database, [
      { titles: ['Vlny'], times: ['2026-09-10T18:00:00', '2026-09-10T21:00:00'] },
    ])

    const days = await findScheduledDays(database, DAY, MORNING)

    expect(days.map((day) => day.toString())).toEqual(['2026-09-10'])
  })
})

describe.skipIf(!databaseUrl)('reading one film', () => {
  it('reads that film alone, and nothing else on the same day', async ({ database }) => {
    const filmIdByTitle = await billFilms(database, [
      { titles: ['Vlny'], times: ['2026-09-10T20:00:00'] },
      { titles: ['Dune'], times: ['2026-09-10T18:00:00'] },
    ])

    const rows = await findFilmScreeningsOnDay(database, filmIdByTitle.get('Vlny')!, DAY, MORNING)

    expect(rows.map((row) => row.titleSk)).toEqual(['Vlny'])
  })

  /*
   * Asked about half of a double feature, the answer is the whole bill: the reader is buying a
   * ticket to both films, and a card that named only one would misdescribe the evening.
   */
  it('reads the whole bill a film is half of', async ({ database }) => {
    const filmIdByTitle = await billFilms(database, [
      { titles: ['Pozdravy z Rodosu', 'Zakorenení vo vode'], times: ['2026-09-10T19:00:00'] },
    ])

    const rows = await findFilmScreeningsOnDay(
      database,
      filmIdByTitle.get('Zakorenení vo vode')!,
      DAY,
      MORNING,
    )

    expect(rows.map((row) => row.titleSk)).toEqual(['Pozdravy z Rodosu', 'Zakorenení vo vode'])
  })

  it('offers the days that film is on, and no day another film fills', async ({ database }) => {
    const filmIdByTitle = await billFilms(database, [
      { titles: ['Vlny'], times: ['2026-09-10T20:00:00', '2026-09-13T18:00:00'] },
      { titles: ['Dune'], times: ['2026-09-11T18:00:00'] },
    ])

    const days = await findFilmDays(database, filmIdByTitle.get('Vlny')!, DAY, MORNING)

    expect(days.map((day) => day.toString())).toEqual(['2026-09-10', '2026-09-13'])
  })

  it('offers no day of this film whose showings have all started', async ({ database }) => {
    const filmIdByTitle = await billFilms(database, [
      { titles: ['Vlny'], times: ['2026-09-10T08:00:00', '2026-09-13T18:00:00'] },
    ])

    const days = await findFilmDays(database, filmIdByTitle.get('Vlny')!, DAY, MORNING)

    expect(days.map((day) => day.toString())).toEqual(['2026-09-13'])
  })

  it('offers a day the film plays on either of two bills only once', async ({ database }) => {
    const filmIdByTitle = await billFilms(database, [
      { titles: ['Vlny'], times: ['2026-09-10T20:00:00'] },
      { titles: ['Vlny', 'Dune'], times: ['2026-09-10T17:00:00'] },
    ])

    const days = await findFilmDays(database, filmIdByTitle.get('Vlny')!, DAY, MORNING)

    expect(days.map((day) => day.toString())).toEqual(['2026-09-10'])
  })
})
