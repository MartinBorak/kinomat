import { type FilmGenre } from 'kinomat-core/db/findGenres'
import { type PriceRange } from 'kinomat-core/types/priceRange'

import { type ScreeningRow } from '@/site/program/findScreenings'

// A film as a listing names it: what it is called, when it was made, and where it can be read about.
export type ListedFilm = {
  id: number
  publicId: string
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

export type Showing = {
  id: number
  startsAt: Date
  format: string[]
  language: string
  subtitles: string
  bookingUrl: string
  eventNote: string
  price: PriceRange | null
}

export type CinemaListing = {
  id: string
  name: string
  address: string
  showings: Showing[]
}

// What is on, once: one bill of films and every cinema showing it that day.
export type ProgrammeListing = {
  id: number
  films: ListedFilm[]
  cinemas: CinemaListing[]
}

function toListedFilm(row: ScreeningRow): ListedFilm {
  return {
    id: row.filmId,
    publicId: row.publicId,
    titleSk: row.titleSk,
    titleEn: row.titleEn,
    originalTitle: row.originalTitle,
    releaseYear: row.releaseYear,
    runtimeMinutes: row.runtimeMinutes,
    imdbId: row.imdbId,
    csfdId: row.csfdId,
    posterPath: row.posterPath,
    directors: row.directors,
    genres: row.genres,
  }
}

// The bill in the order it is billed in, which is what makes a double feature a sequence.
function toBill(rows: readonly ScreeningRow[]): ListedFilm[] {
  const filmByPosition = new Map(rows.map((row) => [row.filmPosition, toListedFilm(row)]))

  return [...filmByPosition.entries()].sort(([a], [b]) => a - b).map(([, film]) => film)
}

// Each screening once, however many films its programme carries.
function toShowings(rows: readonly ScreeningRow[]): Showing[] {
  const showingById = new Map(
    rows.map((row) => [
      row.screeningId,
      {
        id: row.screeningId,
        startsAt: row.startsAt,
        format: row.format,
        language: row.language,
        subtitles: row.subtitles,
        bookingUrl: row.bookingUrl,
        eventNote: row.eventNote,
        price: row.price,
      },
    ]),
  )

  return [...showingById.values()].sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime())
}

function toCinemaListings(rows: readonly ScreeningRow[]): CinemaListing[] {
  return [...Map.groupBy(rows, (row) => row.cinemaId).values()]
    .map((cinemaRows) => ({
      id: cinemaRows[0].cinemaId,
      name: cinemaRows[0].cinemaName,
      address: cinemaRows[0].cinemaAddress,
      showings: toShowings(cinemaRows),
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'sk'))
}

// A programme is named by its films, so that is what two of them sort by.
function toSortKey(listing: ProgrammeListing): string {
  return listing.films.map((film) => film.titleSk).join(' ')
}

function compareBills(one: ProgrammeListing, other: ProgrammeListing): number {
  return toSortKey(one).localeCompare(toSortKey(other), 'sk')
}

/*
 * A day's rows as the view reads them: by programme rather than by film, since grouping by film
 * would list a double feature twice, once under each half, as if either screened alone.
 */
export function groupIntoProgrammes(rows: readonly ScreeningRow[]): ProgrammeListing[] {
  return [...Map.groupBy(rows, (row) => row.programmeId).values()]
    .map((programmeRows) => ({
      id: programmeRows[0].programmeId,
      films: toBill(programmeRows),
      cinemas: toCinemaListings(programmeRows),
    }))
    .sort(compareBills)
}
