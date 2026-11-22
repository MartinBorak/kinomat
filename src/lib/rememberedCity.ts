import { type CityId, DEFAULT_CITY, isCityId } from 'kinomat-core/types/city'
import { type NextRequest, type NextResponse } from 'next/server'

// Slovak like the rest of what the URL and the browser carry. The page writes it, see RememberCity.
export const CITY_COOKIE = 'vybrane-mesto'

/*
 * Until November 2026 the proxy wrote the city as an httpOnly cookie under this name, which a page
 * cannot overwrite. The proxy moves it to the new one; remove this once a year has let it expire.
 */
const LEGACY_CITY_COOKIE = 'mesto'

// A year: the city a reader lives in changes rarely, and every visit to one renews it.
export const CITY_COOKIE_MAX_AGE = 60 * 60 * 24 * 365

function readCookieCity(request: NextRequest, name: string): CityId | null {
  const value = request.cookies.get(name)?.value ?? ''

  return isCityId(value) ? value : null
}

// The city the reader last looked at, or the one Kinomat started in for a reader who has none yet.
export function readRememberedCity(request: NextRequest): CityId {
  return (
    readCookieCity(request, CITY_COOKIE) ??
    readCookieCity(request, LEGACY_CITY_COOKIE) ??
    DEFAULT_CITY
  )
}

// Carries a city from the legacy cookie to the new one, and drops the legacy one.
export function moveLegacyCity(request: NextRequest, response: NextResponse): NextResponse {
  if (!request.cookies.has(LEGACY_CITY_COOKIE)) {
    return response
  }

  const legacy = readCookieCity(request, LEGACY_CITY_COOKIE)

  if (legacy !== null && !request.cookies.has(CITY_COOKIE)) {
    response.cookies.set(CITY_COOKIE, legacy, {
      path: '/',
      maxAge: CITY_COOKIE_MAX_AGE,
      sameSite: 'lax',
      secure: request.nextUrl.protocol === 'https:',
    })
  }

  response.cookies.delete(LEGACY_CITY_COOKIE)

  return response
}
