import { foldForSearch } from 'kinomat-core/lib/text'

// The three names one film can be looked up under: what the cinemas print, and what the world calls it.
type Titled = { titleSk: string; titleEn: string; originalTitle: string }

function toTitles(film: Titled): string[] {
  return [film.titleSk, film.titleEn, film.originalTitle].filter((title) => title !== '')
}

/*
 * The films a query names, in the order they arrived. An empty query keeps every one of them: this
 * is an index that a search narrows, not a panel that a search opens.
 */
export function matchFilms<T extends Titled>(films: readonly T[], query: string): T[] {
  const folded = foldForSearch(query.trim())

  if (folded === '') {
    return [...films]
  }

  return films.filter((film) =>
    toTitles(film).some((title) => foldForSearch(title).includes(folded)),
  )
}
