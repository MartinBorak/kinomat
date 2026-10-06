import { getDatabase } from 'kinomat-core/db/appDatabase'
import { type CinemaId } from 'kinomat-core/types/cinema'
import { cacheLife } from 'next/cache'
import { Temporal } from 'temporal-polyfill'

import { tagSchedule } from '@/lib/tagSchedule'
import {
  findCinemaDays,
  findCinemaScreeningsOnDay,
  findFilmDays,
  findFilmScreeningsOnDay,
  findScheduledDays,
  findScreeningsOnDay,
  type ScreeningRow,
} from '@/site/program/findScreenings'

/*
 * What the pages read, as opposed to what the queries in findScreenings take. Days cross this line
 * as ISO strings because a cache key is serialized, and a Temporal date is not.
 */

async function toDayStrings(days: Promise<Temporal.PlainDate[]>): Promise<string[]> {
  return (await days).map((day) => day.toString())
}

export async function readScheduledDays(from: string): Promise<string[]> {
  'use cache'
  cacheLife('minutes')
  tagSchedule()

  return toDayStrings(findScheduledDays(getDatabase(), Temporal.PlainDate.from(from)))
}

export async function readScreeningsOnDay(day: string): Promise<ScreeningRow[]> {
  'use cache'
  cacheLife('minutes')
  tagSchedule()

  return findScreeningsOnDay(getDatabase(), Temporal.PlainDate.from(day))
}

export async function readFilmDays(filmId: number, from: string): Promise<string[]> {
  'use cache'
  cacheLife('minutes')
  tagSchedule()

  return toDayStrings(findFilmDays(getDatabase(), filmId, Temporal.PlainDate.from(from)))
}

export async function readFilmScreeningsOnDay(
  filmId: number,
  day: string,
): Promise<ScreeningRow[]> {
  'use cache'
  cacheLife('minutes')
  tagSchedule()

  return findFilmScreeningsOnDay(getDatabase(), filmId, Temporal.PlainDate.from(day))
}

export async function readCinemaDays(cinemaId: CinemaId, from: string): Promise<string[]> {
  'use cache'
  cacheLife('minutes')
  tagSchedule()

  return toDayStrings(findCinemaDays(getDatabase(), cinemaId, Temporal.PlainDate.from(from)))
}

export async function readCinemaScreeningsOnDay(
  cinemaId: CinemaId,
  day: string,
): Promise<ScreeningRow[]> {
  'use cache'
  cacheLife('minutes')
  tagSchedule()

  return findCinemaScreeningsOnDay(getDatabase(), cinemaId, Temporal.PlainDate.from(day))
}
