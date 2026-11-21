import { and, asc, eq, gte, inArray, lt, type SQL, sql } from 'drizzle-orm'
import { IS_BOOKABLE } from 'kinomat-core/db/bookableScreenings'
import { type Database } from 'kinomat-core/db/client'
import { type FilmGenre, selectFilmGenres } from 'kinomat-core/db/findGenres'
import { cinemas, films, programmeFilms, screenings } from 'kinomat-core/db/schema'
import { BRATISLAVA_TIME_ZONE, toBratislavaDayStart } from 'kinomat-core/lib/time'
import { type CinemaId } from 'kinomat-core/types/cinema'
import { type CityId } from 'kinomat-core/types/city'
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
  cinemaCityId: CityId
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
      cinemaCityId: cinemas.cityId,
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

/*
 * A festival's films by public id, the days it runs and the cinemas it plays in. No cinema feed says
 * "festival", and FFi marks only its shorts, so the lineup is taken from the festival's own
 * programme by start time. A lineup film's showings elsewhere are its ordinary run.
 */
const FESTIVALS: Record<
  string,
  {
    firstDay: string
    lastDay: string
    cinemaIds: readonly string[]
    filmPublicIds: readonly string[]
  }
> = {
  ffi: {
    firstDay: '2026-11-18',
    lastDay: '2026-11-24',
    cinemaIds: ['kino-lumiere', 'edison-filmhub'],
    filmPublicIds: [
      'd276ae8c19e1', // Arco
      '13898150a63e', // Best Of FFi 1
      '170c6d59c710', // Best Of FFi 2
      '2429bc70fcf1', // Caravaggio
      'c4bcf75a7fa4', // Chica Checa
      'dd6979bd4b21', // Club Kid
      '616d06a26b43', // Downtown
      'a2d0d11f5c0c', // Dukla
      'c55793eb3950', // Dva sršne
      'ea241697ef0c', // Eva
      '1fdfc84d504f', // FFi kraťasy: Faceshopping
      '04b800f47158', // FFi kraťasy: Is It Cold In The Water?
      '94905dd26ab1', // FFi kraťasy: Just Like We Never Said Goodbye
      '1e79fb67035b', // FFi kraťasy: L.O.V.E.
      'd45bf03467f1', // FFi kraťasy: Slovenské premiéry
      '9d551bb93f03', // FFi kraťasy: Whole New World/Pretend World
      '1519dec88697', // Garance
      '7c6604aa211b', // Imaginárne lásky
      '2bfa5c31128e', // Iván a Hadúm
      'f374152ee6f4', // Jednorožce
      '105e09937d19', // Jim Queen
      'cf67b4375660', // La Gradiva
      'ed5eecb8184a', // La bola negra
      '4beac3ecd230', // Leviticus
      '9a2e5c3a811e', // London
      '612237163167', // Maspalomas
      '232c03780928', // Medvedia jaskyňa
      '60d2dc382d6a', // Melónová žena
      '0b3845a71ff9', // Muž, ktorého milujem
      '21c8a1e4d7d1', // Nádherné rána
      'bfcb92314310', // Palivo v tepnách
      'e3bb5b8d11d7', // Potichu
      '3cf3679626ea', // Priateľky
      '256c514210f0', // Rose
      '544d5ae0a50f', // Sesterstvo
      '46626b2f1319', // Sex a smrť v kempe Miasma
      '6eb40d88c5f4', // Slobodný v srdci
      'bb4ea3d719ae', // Som Mario
      '25172c07f713', // Veľké baby neplačú
      '9e0f55dc5f3a', // Vrah môjho brata
      '3fb67d35c6d2', // Víkend
      '45ee83b9d986', // Zbabelec
      'a0154833bcd8', // Zriedka sa budím zo sna
      '786c3eaf0478', // Šampión
      'dbeda3181758', // Život ženy
    ],
  },
}

// Every bill carrying a film of the festival's lineup, so a cinema that also runs one lists it.
function selectFestivalProgrammes(database: Database, festival: string) {
  const lineup = database
    .select({ id: films.id })
    .from(films)
    .where(inArray(films.publicId, [...(FESTIVALS[festival]?.filmPublicIds ?? [])]))

  return database
    .select({ id: programmeFilms.programmeId })
    .from(programmeFilms)
    .where(inArray(programmeFilms.filmId, lineup))
}

// The festival's days only: the same films before or after it are the ordinary run.
function isDuringFestival(festival: string): SQL | undefined {
  const dates = FESTIVALS[festival]

  if (dates === undefined) {
    return sql`false`
  }

  return and(
    gte(screenings.startsAt, toBratislavaDayStart(Temporal.PlainDate.from(dates.firstDay))),
    lt(
      screenings.startsAt,
      toBratislavaDayStart(Temporal.PlainDate.from(dates.lastDay).add({ days: 1 })),
    ),
  )
}

// The festival's own cinemas only.
function isAtFestivalCinema(festival: string): SQL | undefined {
  return inArray(screenings.cinemaId, [...(FESTIVALS[festival]?.cinemaIds ?? [])])
}

// The cinemas of one city, which is what its schedule and its films list.
export function isInCity(database: Database, city: CityId): SQL | undefined {
  return inArray(
    screenings.cinemaId,
    database.select({ id: cinemas.id }).from(cinemas).where(eq(cinemas.cityId, city)),
  )
}

// The whole of one calendar day in one city, still to come.
export async function findScreeningsOnDay(
  database: Database,
  city: CityId,
  date: Temporal.PlainDate,
  now: Date = new Date(),
): Promise<ScreeningRow[]> {
  return selectScreenings(database, and(isOnDay(date, now), isInCity(database, city)))
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

// A festival's day: every showing of its lineup in its cinemas, marked or not.
export async function findFestivalScreeningsOnDay(
  database: Database,
  festival: string,
  date: Temporal.PlainDate,
  now: Date = new Date(),
): Promise<ScreeningRow[]> {
  return selectScreenings(
    database,
    and(
      isOnDay(date, now),
      isAtFestivalCinema(festival),
      inArray(screenings.programmeId, selectFestivalProgrammes(database, festival)),
    ),
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
 * The days a city's date strip offers: the ones something is actually on there, from today forward. Cinemas
 * publish 8 to 30 days ahead and skip days in between, so a generated range would offer empty ones.
 */
export async function findScheduledDays(
  database: Database,
  city: CityId,
  from: Temporal.PlainDate,
  now: Date = new Date(),
): Promise<Temporal.PlainDate[]> {
  return selectDays(database, and(isStillToCome(from, now), isInCity(database, city)))
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

// The festival's days that still have one of its films on.
export async function findFestivalDays(
  database: Database,
  festival: string,
  from: Temporal.PlainDate,
  now: Date = new Date(),
): Promise<Temporal.PlainDate[]> {
  return selectDays(
    database,
    and(
      isStillToCome(from, now),
      isDuringFestival(festival),
      isAtFestivalCinema(festival),
      inArray(screenings.programmeId, selectFestivalProgrammes(database, festival)),
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
