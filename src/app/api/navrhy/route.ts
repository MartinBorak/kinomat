import { readPlayingFilms } from '@/site/films/readFilms'
import { toSuggestedFilms } from '@/site/search/suggestions'

/*
 * The films the search panel can offer, fetched when a reader focuses the field rather than carried
 * by every page. Language-neutral rows, so both languages share one answer built client-side.
 */
export async function GET(): Promise<Response> {
  return Response.json(toSuggestedFilms(await readPlayingFilms()))
}
