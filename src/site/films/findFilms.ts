import { and, asc, eq, exists, gte, or, type SQL, sql } from 'drizzle-orm'
import { type Database } from 'kinomat-core/db/client'
import { type FilmGenre, selectFilmGenres } from 'kinomat-core/db/findGenres'
import { films, programmeFilms, screenings } from 'kinomat-core/db/schema'
import { toBratislavaDate, toBratislavaDayStart } from 'kinomat-core/lib/time'
import { type CityId } from 'kinomat-core/types/city'
import { FINISHED_FILM_DAYS } from 'kinomat-core/types/film'

import { isInCity } from '@/site/program/findScreenings'

/*
 * A film and where it stands in what is on: its own fields, plus a summary of the showings still to
 * come. Grouped by film rather than by programme, which is what makes Filmy a different question
 * from the schedule's - a double feature reaches this view as its two films, each listed alone.
 */
export type FilmRow = {
  filmId: number
  // The name a link uses, since the row's own id is a serial one and a rebuild hands those out afresh.
  publicId: string
  // The readable name its link uses instead, where it has one.
  alias: string | null
  titleSk: string
  titleEn: string
  originalTitle: string
  releaseYear: number | null
  runtimeMinutes: number | null
  posterPath: string | null
  directors: string[]
  genres: FilmGenre[]
  screeningCount: number
  cinemaIds: string[]
  nextStartsAt: Date
  lastStartsAt: Date
}

function selectPlaying(database: Database, now: Date, scope: SQL | undefined) {
  return database
    .select({
      filmId: films.id,
      publicId: films.publicId,
      alias: films.alias,
      titleSk: films.titleSk,
      titleEn: films.titleEn,
      originalTitle: films.originalTitle,
      releaseYear: films.releaseYear,
      runtimeMinutes: films.runtimeMinutes,
      posterPath: films.posterPath,
      directors: films.directors,
      genres: selectFilmGenres(),
      // Distinct, since the same film twice on one bill would otherwise count its showings twice.
      screeningCount: sql<number>`count(distinct ${screenings.id})::int`,
      cinemaIds: sql<
        string[]
      >`array_agg(distinct ${screenings.cinemaId} order by ${screenings.cinemaId})`,
      // An aggregate is outside the column it came from, so it is handed that column's own parser.
      nextStartsAt: sql`min(${screenings.startsAt})`.mapWith(screenings.startsAt),
      lastStartsAt: sql`max(${screenings.startsAt})`.mapWith(screenings.startsAt),
    })
    .from(films)
    .innerJoin(programmeFilms, eq(programmeFilms.filmId, films.id))
    .innerJoin(screenings, eq(screenings.programmeId, programmeFilms.programmeId))
    .where(and(gte(screenings.startsAt, now), scope))
    .groupBy(films.id)
    .orderBy(sql`min(${screenings.startsAt})`, asc(films.titleSk))
}

/*
 * Every film with a showing still to come, the soonest one first. The horizon is whatever the
 * cinemas have published, since a film is in this list exactly as long as it can still be seen.
 */
export async function findPlayingFilms(
  database: Database,
  now: Date = new Date(),
): Promise<FilmRow[]> {
  return selectPlaying(database, now, undefined)
}

// The same, in one city: its count, cinemas and next showing are that city's alone.
export async function findCityFilms(
  database: Database,
  city: CityId,
  now: Date = new Date(),
): Promise<FilmRow[]> {
  return selectPlaying(database, now, isInCity(database, city))
}

/*
 * The alias a public id is sent on to, playing or not: the page it lands on is the one to say
 * that. Null for an id no film has, or a film without an alias, whose page the id itself is.
 */
export async function findFilmAlias(database: Database, publicId: string): Promise<string | null> {
  const [film] = await database
    .select({ alias: films.alias })
    .from(films)
    .where(eq(films.publicId, publicId))
    .limit(1)

  return film?.alias ?? null
}

// What a film's page needs of the film itself; its showings are read per city and day.
export type FilmPageRow = Pick<
  FilmRow,
  'filmId' | 'publicId' | 'alias' | 'titleSk' | 'titleEn' | 'originalTitle' | 'posterPath'
> & {
  // False for a film that has stopped, whose page says so for FINISHED_FILM_DAYS.
  isPlaying: boolean
}

/*
 * One film by either name its page answers to, while it plays and for FINISHED_FILM_DAYS after its
 * last showing; the pipeline keeps the row exactly that long. Both columns are unique, so this is
 * two rows at most - one film's alias spelled like another's public id - and the alias wins, since
 * it is the name links use.
 */
export async function findFilmPage(
  database: Database,
  segment: string,
  now: Date = new Date(),
): Promise<FilmPageRow | null> {
  const cutoff = toBratislavaDayStart(toBratislavaDate(now).subtract({ days: FINISHED_FILM_DAYS }))
  const hasShowingToCome = exists(
    database
      .select({ one: sql`1` })
      .from(programmeFilms)
      .innerJoin(screenings, eq(screenings.programmeId, programmeFilms.programmeId))
      .where(and(eq(programmeFilms.filmId, films.id), gte(screenings.startsAt, now))),
  )
  const rows = await database
    .select({
      filmId: films.id,
      publicId: films.publicId,
      alias: films.alias,
      titleSk: films.titleSk,
      titleEn: films.titleEn,
      originalTitle: films.originalTitle,
      posterPath: films.posterPath,
      isPlaying: sql<boolean>`${hasShowingToCome}`,
    })
    .from(films)
    .where(
      and(
        or(eq(films.alias, segment), eq(films.publicId, segment)),
        or(hasShowingToCome, gte(films.lastScreeningAt, cutoff)),
      ),
    )

  return rows.find((row) => row.alias === segment) ?? rows[0] ?? null
}
