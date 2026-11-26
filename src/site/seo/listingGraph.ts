import { formatGenre } from 'kinomat-core/db/findGenres'
import { toCsfdHref, toImdbHref } from 'kinomat-core/lib/catalogueHrefs'
import { type Language } from 'kinomat-core/lib/language'
import { formatBratislavaDateTime } from 'kinomat-core/lib/time'
import { findCinema } from 'kinomat-core/types/cinema'
import { CITY_BY_ID, type CityId } from 'kinomat-core/types/city'

import { toCinemaHref } from '@/site/cinemas/hrefs'
import { type FilmLink, toFilmHref } from '@/site/films/hrefs'
import { formatFilmTitle, formatOriginalTitle } from '@/site/films/labels'
import {
  type CinemaListing,
  type ListedFilm,
  type ProgrammeListing,
  type Showing,
} from '@/site/program/groupScreenings'
import { SITE_ORIGIN } from '@/site/seo/site'
import { toInstagramHref } from '@/site/ui/contacts'
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

// A film's own page in the listing's city, which is what its node is about and where a result leads.
function toFilmUrl(film: FilmLink, language: Language, city: CityId): string {
  return `${SITE_ORIGIN}${toFilmHref(film, language, city)}`
}

function toMovieNode(film: ListedFilm, language: Language, city: CityId): JsonLdNode {
  const originalTitle = formatOriginalTitle(film, language)
  const sameAs = [
    film.imdbId === null ? '' : toImdbHref(film.imdbId),
    film.csfdId === null ? '' : toCsfdHref(film.csfdId),
  ].filter((href) => href !== '')

  return {
    '@type': 'Movie',
    '@id': toFilmNodeId(film),
    url: toFilmUrl(film, language, city),
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

/*
 * Our page for the cinema is its url, and its own site what it is the same as. The address is
 * written street first and city last, so the street is what comes before the first comma.
 */
function toMovieTheaterNode(cinema: CinemaListing, language: Language): JsonLdNode {
  const website = findCinema(cinema.id)?.website

  return {
    '@type': 'MovieTheater',
    '@id': toCinemaNodeId(cinema),
    name: cinema.name,
    url: `${SITE_ORIGIN}${toCinemaHref(cinema, language)}`,
    sameAs: website,
    address: {
      '@type': 'PostalAddress',
      streetAddress: cinema.address.split(',')[0],
      addressLocality: CITY_BY_ID[cinema.cityId].name,
      addressCountry: 'SK',
    },
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
  city: CityId,
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
      ...films.map((film) => toMovieNode(film, language, city)),
      ...cinemas.map((cinema) => toMovieTheaterNode(cinema, language)),
      ...events,
    ],
  }
}

/*
 * A city's films as a list of their pages, in the order the page shows them: the summary page
 * Google's movie carousel reads, each item's own page carrying the film's Movie node.
 */
export function toFilmListGraph(
  films: readonly FilmLink[],
  language: Language,
  city: CityId,
): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'ItemList',
        itemListElement: films.map((film, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          url: toFilmUrl(film, language, city),
        })),
      },
    ],
  }
}

// The site itself, on its front page: the name a result shows for it, and who stands behind it.
export function toSiteGraph(language: Language): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${SITE_ORIGIN}/#website`,
        name: 'Kinomat',
        url: `${SITE_ORIGIN}/`,
        inLanguage: language,
        publisher: { '@id': `${SITE_ORIGIN}/#organization` },
      },
      {
        '@type': 'Organization',
        '@id': `${SITE_ORIGIN}/#organization`,
        name: 'Kinomat',
        url: `${SITE_ORIGIN}/`,
        logo: `${SITE_ORIGIN}/apple-icon.png`,
        sameAs: [toInstagramHref()],
      },
    ],
  }
}

// Inside a script tag "</script>" in a film title would end it; < reads the same to JSON and not to HTML.
export function serializeJsonLd(data: JsonLd): string {
  return JSON.stringify(data).replace(/</gu, '\\u003c')
}
