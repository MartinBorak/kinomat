import { getDatabase } from 'kinomat-core/db/appDatabase'
import { cacheLife } from 'next/cache'

import { tagSchedule } from '@/lib/tagSchedule'
import { findPlayingFilm, findPlayingFilms, type FilmRow } from '@/site/films/findFilms'

/*
 * What the pages read, as opposed to what the queries in findFilms take: a connection cannot be a
 * cache key, so it is taken here rather than passed in, and the horizon is read here for the same
 * reason. Everyone asking on the same minute is one query, since everyone gets the same answer.
 */

export async function readPlayingFilms(): Promise<FilmRow[]> {
  'use cache'
  cacheLife('minutes')
  tagSchedule()

  return findPlayingFilms(getDatabase())
}

export async function readPlayingFilm(publicId: string): Promise<FilmRow | null> {
  'use cache'
  cacheLife('minutes')
  tagSchedule()

  return findPlayingFilm(getDatabase(), publicId)
}
