import { and, asc, eq, gte, type SQL, sql } from 'drizzle-orm'
import { type Database } from 'kinomat-core/db/client'
import { type FilmGenre, selectFilmGenres } from 'kinomat-core/db/findGenres'
import { films, programmeFilms, screenings } from 'kinomat-core/db/schema'

/*
 * A film and where it stands in what is on: its own fields, plus a summary of the showings still to
 * come. Grouped by film rather than by programme, which is what makes Filmy a different question
 * from the schedule's - a double feature reaches this view as its two films, each listed alone.
 */
export type FilmRow = {
  filmId: number
  // The name a link uses, since the row's own id is a serial one and a rebuild hands those out afresh.
  publicId: string
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

/*
 * The film an alias names, playing or not: the page it redirects to is the one to say that. The
 * alias column is unique, so this is one row or none.
 */
export async function findFilmPublicIdByAlias(
  database: Database,
  alias: string,
): Promise<string | null> {
  const [film] = await database
    .select({ publicId: films.publicId })
    .from(films)
    .where(eq(films.alias, alias))
    .limit(1)

  return film?.publicId ?? null
}

// One film, as long as it is still playing: a film nothing is billing has no page to stand on.
export async function findPlayingFilm(
  database: Database,
  publicId: string,
  now: Date = new Date(),
): Promise<FilmRow | null> {
  const [film] = await selectPlaying(database, now, eq(films.publicId, publicId))

  return film ?? null
}
