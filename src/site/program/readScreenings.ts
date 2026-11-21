import { getDatabase } from 'kinomat-core/db/appDatabase'
import { type CinemaId } from 'kinomat-core/types/cinema'
import { type CityId } from 'kinomat-core/types/city'
import { Temporal } from 'temporal-polyfill'

import { cacheUntilMidnight } from '@/lib/cacheUntilMidnight'
import { tagSchedule } from '@/lib/tagSchedule'
import {
  findCinemaDays,
  findCinemaScreeningsOnDay,
  findFestivalDays,
  findFestivalScreeningsOnDay,
  findFilmCities,
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

export async function readScheduledDays(city: CityId, from: string): Promise<string[]> {
  'use cache'
  cacheUntilMidnight()
  tagSchedule()

  return toDayStrings(findScheduledDays(getDatabase(), city, Temporal.PlainDate.from(from)))
}

export async function readScreeningsOnDay(city: CityId, day: string): Promise<ScreeningRow[]> {
  'use cache'
  cacheUntilMidnight()
  tagSchedule()

  return findScreeningsOnDay(getDatabase(), city, Temporal.PlainDate.from(day))
}

export async function readFilmDays(filmId: number, city: CityId, from: string): Promise<string[]> {
  'use cache'
  cacheUntilMidnight()
  tagSchedule()

  return toDayStrings(findFilmDays(getDatabase(), filmId, city, Temporal.PlainDate.from(from)))
}

export async function readFilmCities(filmId: number): Promise<CityId[]> {
  'use cache'
  cacheUntilMidnight()
  tagSchedule()

  return findFilmCities(getDatabase(), filmId)
}

export async function readFilmScreeningsOnDay(
  filmId: number,
  city: CityId,
  day: string,
): Promise<ScreeningRow[]> {
  'use cache'
  cacheUntilMidnight()
  tagSchedule()

  return findFilmScreeningsOnDay(getDatabase(), filmId, city, Temporal.PlainDate.from(day))
}

export async function readFestivalDays(festival: string, from: string): Promise<string[]> {
  'use cache'
  cacheUntilMidnight()
  tagSchedule()

  return toDayStrings(findFestivalDays(getDatabase(), festival, Temporal.PlainDate.from(from)))
}

export async function readFestivalScreeningsOnDay(
  festival: string,
  day: string,
): Promise<ScreeningRow[]> {
  'use cache'
  cacheUntilMidnight()
  tagSchedule()

  return findFestivalScreeningsOnDay(getDatabase(), festival, Temporal.PlainDate.from(day))
}

export async function readCinemaDays(cinemaId: CinemaId, from: string): Promise<string[]> {
  'use cache'
  cacheUntilMidnight()
  tagSchedule()

  return toDayStrings(findCinemaDays(getDatabase(), cinemaId, Temporal.PlainDate.from(from)))
}

export async function readCinemaScreeningsOnDay(
  cinemaId: CinemaId,
  day: string,
): Promise<ScreeningRow[]> {
  'use cache'
  cacheUntilMidnight()
  tagSchedule()

  return findCinemaScreeningsOnDay(getDatabase(), cinemaId, Temporal.PlainDate.from(day))
}
