import { type CityId, DEFAULT_CITY, isCityId } from 'kinomat-core/types/city'
import { type NextRequest } from 'next/server'

// Slovak like the rest of what the URL and the browser carry.
export const CITY_COOKIE = 'mesto'

// The city the reader last looked at, or the one Kinomat started in for a reader who has none yet.
export function readRememberedCity(request: NextRequest): CityId {
  const remembered = request.cookies.get(CITY_COOKIE)?.value ?? ''

  return isCityId(remembered) ? remembered : DEFAULT_CITY
}
