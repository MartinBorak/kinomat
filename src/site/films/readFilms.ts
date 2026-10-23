import { getDatabase } from 'kinomat-core/db/appDatabase'
import { cacheLife } from 'next/cache'

import { cacheUntilMidnight } from '@/lib/cacheUntilMidnight'
import { tagSchedule } from '@/lib/tagSchedule'
import {
  findFilmPublicIdByAlias,
  findPlayingFilm,
  findPlayingFilms,
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

/*
 * The films search can offer, which are names and years and nothing that ages with the clock. So
 * this outlasts the minute: the landing page is rebuilt whenever it lapses, and a publish clears it.
 */
export async function readSuggestedFilms(): Promise<SuggestedFilm[]> {
  'use cache'
  cacheLife('hours')
  tagSchedule()

  return toSuggestedFilms(await readPlayingFilms())
}

export async function readPlayingFilm(publicId: string): Promise<FilmRow | null> {
  'use cache'
  cacheUntilMidnight()
  tagSchedule()

  return findPlayingFilm(getDatabase(), publicId)
}

export async function readFilmPublicIdByAlias(alias: string): Promise<string | null> {
  'use cache'
  cacheUntilMidnight()
  tagSchedule()

  return findFilmPublicIdByAlias(getDatabase(), alias)
}
