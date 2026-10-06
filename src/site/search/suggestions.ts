import { type Language } from 'kinomat-core/lib/language'
import { foldForSearch } from 'kinomat-core/lib/text'
import { CINEMAS } from 'kinomat-core/types/cinema'

import { toCinemaHref } from '@/site/cinemas/hrefs'
import { type FilmRow } from '@/site/films/findFilms'
import { toFilmHref } from '@/site/films/hrefs'
import { formatFilmTitle } from '@/site/films/labels'
import { searchCopyByLanguage } from '@/site/search/copy'

// One row of the search panel: what it shows, the other names it answers to, and where it leads.
export type Suggestion = { name: string; alternates: readonly string[]; meta: string; href: string }

// The street a cinema stands on, which is the address minus the city every one of them shares.
function toStreet(address: string): string {
  return address.split(',')[0]
}

export function toCinemaSuggestions(language: Language): Suggestion[] {
  return CINEMAS.map((cinema) => ({
    name: cinema.name,
    alternates: [],
    meta: toStreet(cinema.address),
    href: toCinemaHref(cinema.id, language),
  }))
}

// The fields the panel needs of a film, so a page whose language is chosen client-side can build its rows there.
export type SuggestedFilm = Pick<
  FilmRow,
  'publicId' | 'titleSk' | 'titleEn' | 'originalTitle' | 'releaseYear'
>

// Where the header's search fetches its films once focused, instead of every page carrying them.
export const SUGGESTED_FILMS_ROUTE = '/api/navrhy'

export function toSuggestedFilms(films: readonly FilmRow[]): SuggestedFilm[] {
  return films.map(({ publicId, titleSk, titleEn, originalTitle, releaseYear }) => ({
    publicId,
    titleSk,
    titleEn,
    originalTitle,
    releaseYear,
  }))
}

// A film shows the reader's own title but answers to every name it has, and leads to its own page.
export function toFilmSuggestions(
  films: readonly SuggestedFilm[],
  language: Language,
): Suggestion[] {
  return films.map((film) => {
    const name = formatFilmTitle(film, language)

    return {
      name,
      alternates: [film.titleSk, film.titleEn, film.originalTitle].filter(
        (title) => title !== '' && title !== name,
      ),
      meta: film.releaseYear === null ? '' : String(film.releaseYear),
      href: toFilmHref(film.publicId, language),
    }
  })
}

// A labelled block of the panel, since films and cinemas answer the same query differently.
export type SuggestionGroup = { label: string; items: Suggestion[] }

// The panel is a shortcut, not a result page: past a handful of rows it stops being one.
const MAX_MATCHES = 4

// No query means no matches, which is also what keeps the panel closed until something is typed.
export function matchSuggestions<T extends { name: string; alternates: readonly string[] }>(
  suggestions: readonly T[],
  query: string,
): T[] {
  const folded = foldForSearch(query.trim())

  if (folded === '') {
    return []
  }

  return suggestions
    .filter((suggestion) =>
      [suggestion.name, ...suggestion.alternates].some((title) =>
        foldForSearch(title).includes(folded),
      ),
    )
    .slice(0, MAX_MATCHES)
}

// The panel's groups, in the order given, minus the ones this query left empty.
export function findSuggestionGroups<T extends { name: string; alternates: readonly string[] }>(
  labelledSuggestions: readonly { label: string; suggestions: readonly T[] }[],
  query: string,
): { label: string; items: T[] }[] {
  return labelledSuggestions
    .map(({ label, suggestions }) => ({ label, items: matchSuggestions(suggestions, query) }))
    .filter((group) => group.items.length > 0)
}

// What every search on the site offers: the films playing, then the cinemas.
export function toLabelledSuggestions(films: readonly SuggestedFilm[], language: Language) {
  const copy = searchCopyByLanguage[language]

  return [
    { label: copy.filmsLabel, suggestions: toFilmSuggestions(films, language) },
    { label: copy.cinemasLabel, suggestions: toCinemaSuggestions(language) },
  ]
}
