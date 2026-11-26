import { getDatabase } from 'kinomat-core/db/appDatabase'
import { type CityId } from 'kinomat-core/types/city'
import { cacheLife } from 'next/cache'

import { cacheUntilMidnight } from '@/lib/cacheUntilMidnight'
import { tagSchedule } from '@/lib/tagSchedule'
import {
  findCityFilms,
  findFilmPage,
  findPlayingFilms,
  type FilmPageRow,
  type FilmRow,
} from '@/site/films/findFilms'
import { type SuggestedFilm, toSuggestedFilms } from '@/site/search/suggestions'

/*
 * What the pages read, as opposed to what the queries in findFilms take: a connection cannot be a
 * cache key, so it is taken here rather than passed in, and the horizon is read here for the same
 * reason. Everyone asking on the same minute is one query, since everyone gets the same answer.
 * The index says when each film is next on, which ages by the minute; a film's own page only asks
 * whether it plays at all, which is the day's question and lasts as long as its listing does.
 */

export async function readPlayingFilms(): Promise<FilmRow[]> {
  'use cache'
  cacheLife('minutes')
  tagSchedule()

  return findPlayingFilms(getDatabase())
}

export async function readCityFilms(city: CityId): Promise<FilmRow[]> {
  'use cache'
  cacheLife('minutes')
  tagSchedule()

  return findCityFilms(getDatabase(), city)
}

/*
 * The films search can offer in a city, which are names and years and nothing that ages with the
 * clock. So this outlasts the minute: the landing page is rebuilt whenever it lapses, and a publish
 * clears it.
 */
export async function readSuggestedFilms(city: CityId): Promise<SuggestedFilm[]> {
  'use cache'
  cacheLife('hours')
  tagSchedule()

  return toSuggestedFilms(await readCityFilms(city))
}

// By its alias or its public id, whichever the URL named; playing, or stopped not long ago.
export async function readFilmPage(segment: string): Promise<FilmPageRow | null> {
  'use cache'
  cacheUntilMidnight()
  tagSchedule()

  return findFilmPage(getDatabase(), segment)
}
