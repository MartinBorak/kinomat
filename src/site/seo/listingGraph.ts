import { formatGenre } from 'kinomat-core/db/findGenres'
import { toCsfdHref, toImdbHref } from 'kinomat-core/lib/catalogueHrefs'
import { type Language } from 'kinomat-core/lib/language'
import { formatBratislavaDateTime } from 'kinomat-core/lib/time'
import { findCinema } from 'kinomat-core/types/cinema'

import { formatFilmTitle, formatOriginalTitle } from '@/site/films/labels'
import {
  type CinemaListing,
  type ListedFilm,
  type ProgrammeListing,
  type Showing,
} from '@/site/program/groupScreenings'
import { toPosterUrl } from '@/site/ui/posterUrl'

/*
 * schema.org as JSON-LD, which is how a search engine reads a listing as showtimes rather than as
 * prose. A field it does not know is left undefined, and JSON.stringify drops it on the way out.
 */
type JsonLdNode = Record<string, unknown>
export type JsonLd = { '@context': 'https://schema.org'; '@graph': JsonLdNode[] }

// Fragment ids, so an event names its film and cinema once each instead of restating them per showing.
function toFilmNodeId(film: ListedFilm): string {
  return `#film-${film.publicId}`
}
function toCinemaNodeId(cinema: CinemaListing): string {
  return `#cinema-${cinema.id}`
}

function toMovieNode(film: ListedFilm, language: Language): JsonLdNode {
  const originalTitle = formatOriginalTitle(film, language)
  const sameAs = [
    film.imdbId === null ? '' : toImdbHref(film.imdbId),
    film.csfdId === null ? '' : toCsfdHref(film.csfdId),
  ].filter((href) => href !== '')

  return {
    '@type': 'Movie',
    '@id': toFilmNodeId(film),
    name: formatFilmTitle(film, language),
    alternateName: originalTitle === '' ? undefined : originalTitle,
    datePublished: film.releaseYear === null ? undefined : String(film.releaseYear),
    // TMDB gives a concert film 0 minutes, which is a gap in its record rather than a length.
    duration:
      film.runtimeMinutes === null || film.runtimeMinutes === 0
        ? undefined
        : `PT${film.runtimeMinutes}M`,
    image: film.posterPath === null ? undefined : toPosterUrl(film.posterPath),
    director:
      film.directors.length === 0
        ? undefined
        : film.directors.map((name) => ({ '@type': 'Person', name })),
    genre:
      film.genres.length === 0
        ? undefined
        : film.genres.map((genre) => formatGenre(genre, language)),
    sameAs: sameAs.length === 0 ? undefined : sameAs,
  }
}

function toMovieTheaterNode(cinema: CinemaListing): JsonLdNode {
  return {
    '@type': 'MovieTheater',
    '@id': toCinemaNodeId(cinema),
    name: cinema.name,
    address: cinema.address,
    url: findCinema(cinema.id)?.website,
  }
}

function toScreeningEventNode(
  programme: ProgrammeListing,
  cinema: CinemaListing,
  showing: Showing,
  language: Language,
): JsonLdNode {
  const films = programme.films.map((film) => ({ '@id': toFilmNodeId(film) }))

  return {
    '@type': 'ScreeningEvent',
    name: programme.films.map((film) => formatFilmTitle(film, language)).join(' + '),
    startDate: formatBratislavaDateTime(showing.startsAt),
    location: { '@id': toCinemaNodeId(cinema) },
    workPresented: films.length === 1 ? films[0] : films,
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    eventStatus: 'https://schema.org/EventScheduled',
    inLanguage: showing.language === '' ? undefined : showing.language,
    subtitleLanguage: showing.subtitles === '' ? undefined : showing.subtitles,
    videoFormat: showing.format.length === 0 ? undefined : showing.format,
    description: showing.eventNote === '' ? undefined : showing.eventNote,
    url: showing.bookingUrl === '' ? undefined : showing.bookingUrl,
    offers: toOfferNode(showing),
  }
}

/*
 * The ticket as schema.org sells it: a price where the cinema states one, as a range where it
 * states two tiers, and only the booking link where it states none. Nothing, where it has neither.
 */
function toOfferNode(showing: Showing): JsonLdNode | undefined {
  const url = showing.bookingUrl === '' ? undefined : showing.bookingUrl

  if (showing.price === null) {
    return url === undefined ? undefined : { '@type': 'Offer', url }
  }

  return showing.price.min === showing.price.max
    ? { '@type': 'Offer', url, price: showing.price.min, priceCurrency: 'EUR' }
    : {
        '@type': 'AggregateOffer',
        url,
        lowPrice: showing.price.min,
        highPrice: showing.price.max,
        priceCurrency: 'EUR',
      }
}

function uniqueBy<T>(items: readonly T[], toKey: (item: T) => string): T[] {
  return [...new Map(items.map((item) => [toKey(item), item])).values()]
}

// A day's listing as one graph: every film and cinema once, and one event per showing pointing at them.
export function toListingGraph(
  programmes: readonly ProgrammeListing[],
  language: Language,
): JsonLd {
  const films = uniqueBy(
    programmes.flatMap((programme) => programme.films),
    (film) => film.publicId,
  )
  const cinemas = uniqueBy(
    programmes.flatMap((programme) => programme.cinemas),
    (cinema) => cinema.id,
  )
  const events = programmes.flatMap((programme) =>
    programme.cinemas.flatMap((cinema) =>
      cinema.showings.map((showing) => toScreeningEventNode(programme, cinema, showing, language)),
    ),
  )

  return {
    '@context': 'https://schema.org',
    '@graph': [
      ...films.map((film) => toMovieNode(film, language)),
      ...cinemas.map(toMovieTheaterNode),
      ...events,
    ],
  }
}

// Inside a script tag "</script>" in a film title would end it; < reads the same to JSON and not to HTML.
export function serializeJsonLd(data: JsonLd): string {
  return JSON.stringify(data).replace(/</gu, '\\u003c')
}
