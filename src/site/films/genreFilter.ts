import { type FilmGenre, formatGenre } from 'kinomat-core/db/findGenres'
import { type Language } from 'kinomat-core/lib/language'

import { type FilterOption, matches, type Selection } from '@/site/program/filters'

type Filed = { genres: readonly FilmGenre[] }

// A film's genres as the URL spells them, which is TMDB's ids rather than either language's names.
function toGenreValues(film: Filed): string[] {
  return film.genres.map((genre) => String(genre.id))
}

/*
 * The genres of the films in hand, named for the reader. Derived from the list itself rather than
 * from the whole vocabulary, so the menu never offers a genre nothing on the page is filed under.
 */
export function deriveGenreOptions(
  films: readonly Filed[],
  language: Language,
): readonly FilterOption[] {
  const labelByValue = new Map(
    films.flatMap((film) =>
      film.genres.map((genre) => [String(genre.id), formatGenre(genre, language)] as const),
    ),
  )

  return [...labelByValue]
    .map(([value, label]) => ({ value, label }))
    .sort((one, other) => one.label.localeCompare(other.label, 'sk'))
}

export function filterByGenre<T extends Filed>(films: readonly T[], selection: Selection): T[] {
  return films.filter((film) => matches(selection, toGenreValues(film)))
}
