import { and, asc, eq, gte, inArray, lt, type SQL, sql } from 'drizzle-orm'
import { IS_BOOKABLE } from 'kinomat-core/db/bookableScreenings'
import { type Database } from 'kinomat-core/db/client'
import { type FilmGenre, selectFilmGenres } from 'kinomat-core/db/findGenres'
import { cinemas, films, programmeFilms, screenings } from 'kinomat-core/db/schema'
import { BRATISLAVA_TIME_ZONE, toBratislavaDayStart } from 'kinomat-core/lib/time'
import { type CinemaId } from 'kinomat-core/types/cinema'
import { type PriceRange } from 'kinomat-core/types/priceRange'
import { Temporal } from 'temporal-polyfill'

/*
 * One screening paired with one film of its programme, so a double feature arrives as two rows and
 * the bill can be put back together without a second query. Flat on purpose: Filmy and Kiná group
 * the same rows their own way.
 */
export type ScreeningRow = {
  screeningId: number
  programmeId: number
  startsAt: Date
  format: string[]
  language: string
  subtitles: string
  bookingUrl: string
  eventNote: string
  price: PriceRange | null
  cinemaId: string
  cinemaName: string
  cinemaAddress: string
  filmId: number
  publicId: string
  filmPosition: number
  titleSk: string
  titleEn: string
  originalTitle: string
  releaseYear: number | null
  runtimeMinutes: number | null
  imdbId: string | null
  csfdId: string | null
  posterPath: string | null
  directors: string[]
  genres: FilmGenre[]
}

// The programmes this film is billed on, which for a double feature is the whole bill, not its half.
function selectProgrammesOf(database: Database, filmId: number) {
  return database
    .select({ id: programmeFilms.programmeId })
    .from(programmeFilms)
    .where(eq(programmeFilms.filmId, filmId))
}

/*
 * Where a showing has to start to be worth listing: from this instant on the day that is today,
 * from midnight on any later one. A showing under way cannot be attended, and a day already over
 * holds nothing, which needs no rule of its own.
 */
function isStillToCome(from: Temporal.PlainDate, now: Date): SQL | undefined {
  const dayStart = toBratislavaDayStart(from)

  return gte(screenings.startsAt, now > dayStart ? now : dayStart)
}

function isOnDay(date: Temporal.PlainDate, now: Date): SQL | undefined {
  return and(
    isStillToCome(date, now),
    lt(screenings.startsAt, toBratislavaDayStart(date.add({ days: 1 }))),
  )
}

// Numeric arrives as the decimal string it is stored as; both ends are set or neither is.
function toPrice(priceMin: string | null, priceMax: string | null): PriceRange | null {
  return priceMin === null || priceMax === null
    ? null
    : { min: Number(priceMin), max: Number(priceMax) }
}

async function selectScreenings(
  database: Database,
  where: SQL | undefined,
): Promise<ScreeningRow[]> {
  const rows = await database
    .select({
      screeningId: screenings.id,
      programmeId: screenings.programmeId,
      startsAt: screenings.startsAt,
      format: screenings.format,
      language: screenings.language,
      subtitles: screenings.subtitles,
      bookingUrl: screenings.bookingUrl,
      eventNote: screenings.eventNote,
      priceMin: screenings.priceMin,
      priceMax: screenings.priceMax,
      cinemaId: screenings.cinemaId,
      cinemaName: cinemas.name,
      cinemaAddress: cinemas.address,
      filmId: films.id,
      publicId: films.publicId,
      filmPosition: programmeFilms.position,
      titleSk: films.titleSk,
      titleEn: films.titleEn,
      originalTitle: films.originalTitle,
      releaseYear: films.releaseYear,
      runtimeMinutes: films.runtimeMinutes,
      imdbId: films.imdbId,
      csfdId: films.csfdId,
      posterPath: films.posterPath,
      directors: films.directors,
      genres: selectFilmGenres(),
    })
    .from(screenings)
    .innerJoin(cinemas, eq(cinemas.id, screenings.cinemaId))
    .innerJoin(programmeFilms, eq(programmeFilms.programmeId, screenings.programmeId))
    .innerJoin(films, eq(films.id, programmeFilms.filmId))
    .where(and(where, IS_BOOKABLE))
    .orderBy(asc(screenings.startsAt), asc(programmeFilms.position))

  return rows.map(({ priceMin, priceMax, ...row }) => ({
    ...row,
    price: toPrice(priceMin, priceMax),
  }))
}

// The whole of one Bratislava calendar day, still to come.
export async function findScreeningsOnDay(
  database: Database,
  date: Temporal.PlainDate,
  now: Date = new Date(),
): Promise<ScreeningRow[]> {
  return selectScreenings(database, isOnDay(date, now))
}

/*
 * One film's day. The bill it is on comes back whole, so a double feature reads as the two films it
 * is rather than as the half this page is about.
 */
export async function findFilmScreeningsOnDay(
  database: Database,
  filmId: number,
  date: Temporal.PlainDate,
  now: Date = new Date(),
): Promise<ScreeningRow[]> {
  return selectScreenings(
    database,
    and(isOnDay(date, now), inArray(screenings.programmeId, selectProgrammesOf(database, filmId))),
  )
}

// One cinema's day, which is the whole of what it has on.
export async function findCinemaScreeningsOnDay(
  database: Database,
  cinemaId: CinemaId,
  date: Temporal.PlainDate,
  now: Date = new Date(),
): Promise<ScreeningRow[]> {
  return selectScreenings(database, and(isOnDay(date, now), eq(screenings.cinemaId, cinemaId)))
}

async function selectDays(
  database: Database,
  where: SQL | undefined,
): Promise<Temporal.PlainDate[]> {
  const days = await database
    .selectDistinct({
      // Text rather than a date, so no driver has to decide which instant a calendar day is.
      day: sql<string>`to_char(${screenings.startsAt} at time zone ${BRATISLAVA_TIME_ZONE}, 'YYYY-MM-DD')`,
    })
    .from(screenings)
    .where(and(where, IS_BOOKABLE))

  return days
    .map(({ day }) => day)
    .sort()
    .map((day) => Temporal.PlainDate.from(day))
}

/*
 * The days the date strip offers: the ones something is actually on, from today forward. Cinemas
 * publish 8 to 30 days ahead and skip days in between, so a generated range would offer empty ones.
 */
export async function findScheduledDays(
  database: Database,
  from: Temporal.PlainDate,
  now: Date = new Date(),
): Promise<Temporal.PlainDate[]> {
  return selectDays(database, isStillToCome(from, now))
}

// The days this one film is on, which is the whole of what its own strip has to offer.
export async function findFilmDays(
  database: Database,
  filmId: number,
  from: Temporal.PlainDate,
  now: Date = new Date(),
): Promise<Temporal.PlainDate[]> {
  return selectDays(
    database,
    and(
      isStillToCome(from, now),
      inArray(screenings.programmeId, selectProgrammesOf(database, filmId)),
    ),
  )
}

// The days this one cinema is open with something on, which its own strip offers and no others.
export async function findCinemaDays(
  database: Database,
  cinemaId: CinemaId,
  from: Temporal.PlainDate,
  now: Date = new Date(),
): Promise<Temporal.PlainDate[]> {
  return selectDays(database, and(isStillToCome(from, now), eq(screenings.cinemaId, cinemaId)))
}
