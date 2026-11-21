import { isCityId } from 'kinomat-core/types/city'
import { type NextRequest } from 'next/server'

import { readRememberedCity } from '@/lib/rememberedCity'
import { readSuggestedFilms } from '@/site/films/readFilms'
import { CITY_PARAMETER, type SuggestedFilms } from '@/site/search/suggestions'

/*
 * The films the search panel can offer in a city, fetched when a reader focuses the field rather
 * than carried by every page. Language-neutral rows, so both languages share one answer built
 * client-side. A page in no city asks without one and is answered for the reader's own, which the
 * answer names so the panel offers that city's cinemas beside its films.
 */
export async function GET(request: NextRequest): Promise<Response> {
  const asked = request.nextUrl.searchParams.get(CITY_PARAMETER) ?? ''
  const city = isCityId(asked) ? asked : readRememberedCity(request)
  const answer: SuggestedFilms = { city, films: await readSuggestedFilms(city) }

  return Response.json(answer)
}
