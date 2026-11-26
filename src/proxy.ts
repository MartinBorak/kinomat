import { getDatabase } from 'kinomat-core/db/appDatabase'
import { DEFAULT_LANGUAGE, isLanguage } from 'kinomat-core/lib/language'
import { getBratislavaToday } from 'kinomat-core/lib/time'
import { findCinema } from 'kinomat-core/types/cinema'
import { CITIES, type CityId, isCityId } from 'kinomat-core/types/city'
import { isFilmPublicId } from 'kinomat-core/types/film'
import { type NextRequest, NextResponse } from 'next/server'

import { moveLegacyCity, readRememberedCity, writeCity } from '@/lib/rememberedCity'
import { findFilmAlias } from '@/site/films/findFilms'

/*
 * Every public page lives under app/[lang], but the default language is written bare: /kina is
 * Slovak and /en/kina English. A bare path is rewritten to its /sk twin without the reader seeing
 * it, and the /sk spelling redirects to the bare one, so each page has exactly one URL.
 *
 * The listings live under a city too, /kosice/program, and a listing asked for without one goes to
 * the city the reader last looked at, which a cookie remembers. The page writes it (RememberCity),
 * not this proxy, which also answers the router's prefetches of links to other cities.
 *
 * The front page is the exception both ways: its URL names no city, and it is served in the
 * reader's without a redirect. A city's own spelling of it, /kosice, is where the proxy does write
 * the cookie, since nothing on the site links there for the router to prefetch.
 */
const CITY_SEGMENT = CITIES.map((city) => city.id).join('|')
// The listings that take a day; the reel takes one too, but in its query, and is no page to link to.
const DAY_LISTING_PATTERN = new RegExp(
  `^(?:/en)?(?:/(?:${CITY_SEGMENT}))?/(?:program|kina/[^/]+|filmy/[^/]+)/?$`,
)
const ISO_DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/
// A listing with its day in the path, split into the listing and the day.
const DAY_PAGE_PATTERN = new RegExp(
  `^((?:/en)?/(?:${CITY_SEGMENT})/(?:program|kina/[^/]+|filmy/[^/]+))/(\\d{4}-\\d{2}-\\d{2})/?$`,
)
// A city's pages, spelled without the city: its schedule, cinemas, films and a film.
const CITYLESS_LISTING_PATTERN = /^\/(?:program|kina|filmy)(?:\/.*)?$/
// A film's page in a city, split around the name it was asked for by.
const FILM_PAGE_PATTERN = new RegExp(`^(/(?:${CITY_SEGMENT})/filmy/)([^/]+)(/.*)?$`)

/*
 * A day was once ?den= in the query, and links shared then still say so. It is the last segment of
 * the path now, which is what lets a day be cached as a page, so such a link moves there for good.
 * A day that is not one is dropped, which opens the listing where a day-less link would.
 */
function moveDayIntoPath(url: URL): void {
  const day = url.searchParams.get('den')

  if (day === null || !DAY_LISTING_PATTERN.test(url.pathname)) {
    return
  }

  url.searchParams.delete('den')

  if (ISO_DAY_PATTERN.test(day)) {
    url.pathname = `${url.pathname.replace(/\/$/, '')}/${day}`
  }
}

/*
 * The city a page asked for without one belongs in: a cinema's own, which the URL settles for good,
 * or else the one the reader last looked at, which only holds for now. Null for a page that is in a
 * city already, or in none.
 */
function findListingCity(
  request: NextRequest,
  path: string,
): { city: CityId; isPermanent: boolean } | null {
  if (!CITYLESS_LISTING_PATTERN.test(path)) {
    return null
  }

  const [, section, cinemaId = ''] = path.split('/')
  const cinemaCity = section === 'kina' ? findCinema(cinemaId)?.cityId : undefined

  return cinemaCity === undefined
    ? { city: readRememberedCity(request), isPermanent: false }
    : { city: cinemaCity, isPermanent: true }
}

/*
 * A film's page asked for by its public id, moved on to its alias, which is the address its links
 * use. Here rather than in the page, since a page that has begun streaming can no longer answer
 * with a redirect's status, and a crawler or a link preview reads the status. Whether it moved:
 * not for any other path, nor for a film without an alias, whose page the id itself is.
 */
async function moveFilmToAlias(url: URL, languagePrefix: string): Promise<boolean> {
  const path = url.pathname.slice(languagePrefix.length)
  const [, start, segment = '', rest = ''] = FILM_PAGE_PATTERN.exec(path) ?? []

  if (!isFilmPublicId(segment)) {
    return false
  }

  const alias = await findFilmAlias(getDatabase(), segment)

  if (alias === null) {
    return false
  }

  url.pathname = `${languagePrefix}${start}${alias}${rest}`

  return true
}

/*
 * A day already over, moved to its listing, which opens on the first day still to come. Such a day
 * lists nothing and never will again, which is what makes the move permanent. Bratislava's today,
 * since that is the calendar every listing keeps.
 */
function dropPastDay(url: URL): void {
  const [, listing, day] = DAY_PAGE_PATTERN.exec(url.pathname) ?? []

  if (listing !== undefined && day < getBratislavaToday().toString()) {
    url.pathname = listing
  }
}

// The city a front page's path names, /kosice or /kosice/, or null for any other path.
function readHomeCity(path: string): CityId | null {
  const segment = path.replace(/^\/|\/$/g, '')

  return isCityId(segment) ? segment : null
}

/*
 * The URL a request settles at, every correction made at once: a link from before the cities can
 * need a language prefix dropped, a day moved into the path, a city added, an id swapped for an
 * alias and a past day dropped, and taking them one redirect at a time would make a crawler follow
 * a chain. The move is permanent only when every step is: a city read from the reader's cookie, or
 * an alias that can be renamed, makes the whole of it temporary.
 */
export async function proxy(request: NextRequest): Promise<NextResponse> {
  const url = request.nextUrl.clone()
  let isPermanent = true

  // The reader should never see /sk: the bare URL is the Slovak one.
  if (url.pathname === `/${DEFAULT_LANGUAGE}` || url.pathname.startsWith(`/${DEFAULT_LANGUAGE}/`)) {
    url.pathname = url.pathname.slice(DEFAULT_LANGUAGE.length + 1) || '/'
  }

  moveDayIntoPath(url)

  const [, first = ''] = url.pathname.split('/')
  const languagePrefix = isLanguage(first) ? `/${first}` : ''
  const path = url.pathname.slice(languagePrefix.length) || '/'
  const homeCity = readHomeCity(path)

  // Temporary, since the city is the reader's to change; remembered, so the bare page is in it.
  if (homeCity !== null) {
    url.pathname = languagePrefix || '/'

    return writeCity(request, NextResponse.redirect(url, 307), homeCity)
  }

  const listingCity = findListingCity(request, path)

  if (listingCity !== null) {
    url.pathname = `${languagePrefix}/${listingCity.city}${path}`
    isPermanent &&= listingCity.isPermanent
  }

  if (await moveFilmToAlias(url, languagePrefix)) {
    isPermanent = false
  }

  dropPastDay(url)

  if (url.href !== request.nextUrl.href) {
    return NextResponse.redirect(url, isPermanent ? 308 : 307)
  }

  // The front page in the reader's city, which the URL keeps to itself.
  if (path === '/') {
    const home = request.nextUrl.clone()
    home.pathname = `${languagePrefix || `/${DEFAULT_LANGUAGE}`}/${readRememberedCity(request)}`

    return moveLegacyCity(request, NextResponse.rewrite(home))
  }

  // /en already names a page under app/[lang]; a bare URL needs a language filled in behind the scenes.
  const prefixed = request.nextUrl.clone()
  prefixed.pathname = `/${DEFAULT_LANGUAGE}${request.nextUrl.pathname}`

  const response = languagePrefix === '' ? NextResponse.rewrite(prefixed) : NextResponse.next()

  return moveLegacyCity(request, response)
}

// The api, Next's own files and anything with an extension are not pages in a language.
export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)'],
}
