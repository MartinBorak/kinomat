import { DEFAULT_LANGUAGE, isLanguage } from 'kinomat-core/lib/language'
import { findCinema } from 'kinomat-core/types/cinema'
import { CITIES, type CityId, DEFAULT_CITY, isCityId } from 'kinomat-core/types/city'
import { type NextRequest, NextResponse } from 'next/server'

/*
 * Every public page lives under app/[lang], but the default language is written bare: /kina is
 * Slovak and /en/kina English. A bare path is rewritten to its /sk twin without the reader seeing
 * it, and the /sk spelling redirects to the bare one, so each page has exactly one URL.
 *
 * The listings live under a city too, /kosice/program, and a listing asked for without one goes to
 * the city the reader last looked at, which a cookie remembers.
 */
const CITY_SEGMENT = CITIES.map((city) => city.id).join('|')
// The listings that take a day; the reel takes one too, but in its query, and is no page to link to.
const DAY_LISTING_PATTERN = new RegExp(
  `^(?:/en)?(?:(?:/(?:${CITY_SEGMENT}))?/(?:program|kina/[^/]+)|/filmy/[^/]+)/?$`,
)
const ISO_DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/
// A city's pages, spelled without the city: its front page, its schedule, its cinemas, its films.
const CITYLESS_LISTING_PATTERN = /^\/(?:|program(?:\/.*)?|kina(?:\/.*)?|filmy\/?)$/

const CITY_COOKIE = 'mesto'
// A year: the city a reader lives in changes rarely, and every visit to one renews it.
const CITY_COOKIE_MAX_AGE = 60 * 60 * 24 * 365

/*
 * A day was once ?den= in the query, and links shared then still say so. It is the last segment of
 * the path now, which is what lets a day be cached as a page, so such a link moves there for good.
 * A day that is not one is dropped, which opens the listing where a day-less link would.
 */
function toDayPath(request: NextRequest): URL | null {
  const day = request.nextUrl.searchParams.get('den')

  if (day === null || !DAY_LISTING_PATTERN.test(request.nextUrl.pathname)) {
    return null
  }

  const moved = request.nextUrl.clone()
  moved.searchParams.delete('den')

  if (ISO_DAY_PATTERN.test(day)) {
    moved.pathname = `${moved.pathname.replace(/\/$/, '')}/${day}`
  }

  return moved
}

function readRememberedCity(request: NextRequest): CityId {
  const remembered = request.cookies.get(CITY_COOKIE)?.value ?? ''

  return isCityId(remembered) ? remembered : DEFAULT_CITY
}

/*
 * A city's page asked for without its city, sent to one: a cinema to its own, anything else to the
 * city the reader last looked at. Null for a page that is in a city already, or in none.
 */
function toCityPath(request: NextRequest, languagePrefix: string, path: string): URL | null {
  if (!CITYLESS_LISTING_PATTERN.test(path)) {
    return null
  }

  const [, section, cinemaId = ''] = path.split('/')
  const city =
    section === 'kina'
      ? (findCinema(cinemaId)?.cityId ?? readRememberedCity(request))
      : readRememberedCity(request)
  const moved = request.nextUrl.clone()
  moved.pathname = `${languagePrefix}/${city}${path === '/' ? '' : path}`

  return moved
}

// Remembered on every visit to a city's page, so a reader who arrived from a search is kept there.
function rememberCity(request: NextRequest, response: NextResponse, city: CityId): NextResponse {
  if (request.cookies.get(CITY_COOKIE)?.value !== city) {
    response.cookies.set(CITY_COOKIE, city, {
      path: '/',
      maxAge: CITY_COOKIE_MAX_AGE,
      sameSite: 'lax',
      httpOnly: true,
      secure: request.nextUrl.protocol === 'https:',
    })
  }

  return response
}

export function proxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl
  const [, first = ''] = pathname.split('/')

  // The reader should never see /sk: send them to the bare URL, which the last branch then serves.
  if (first === DEFAULT_LANGUAGE) {
    const bare = request.nextUrl.clone()
    bare.pathname = pathname.slice(first.length + 1) || '/'

    return NextResponse.redirect(bare, 308)
  }

  const dayPath = toDayPath(request)

  if (dayPath !== null) {
    return NextResponse.redirect(dayPath, 308)
  }

  const languagePrefix = isLanguage(first) ? `/${first}` : ''
  const path = pathname.slice(languagePrefix.length) || '/'
  const cityPath = toCityPath(request, languagePrefix, path)

  // Temporary, since where it leads depends on the reader's cookie, not on the URL.
  if (cityPath !== null) {
    return NextResponse.redirect(cityPath, 307)
  }

  const [, city = ''] = path.split('/')
  // /en already names a page under app/[lang]; a bare URL needs a language filled in behind the scenes.
  const prefixed = request.nextUrl.clone()
  prefixed.pathname = `/${DEFAULT_LANGUAGE}${pathname}`
  const response = isLanguage(first) ? NextResponse.next() : NextResponse.rewrite(prefixed)

  return isCityId(city) ? rememberCity(request, response, city) : response
}

// The api, Next's own files and anything with an extension are not pages in a language.
export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)'],
}
