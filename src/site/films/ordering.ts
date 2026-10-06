import { type Language, LOCALE_BY_LANGUAGE } from 'kinomat-core/lib/language'

import { type FilmRow } from '@/site/films/findFilms'
import { formatFilmTitle } from '@/site/films/labels'

type Compare = (one: FilmRow, other: FilmRow, language: Language) => number

type OrderingSpec = {
  compare: Compare
  isReversed: boolean
  // Films this order cannot place. They wait at the end, rather than at whichever end -1 sends them.
  isRanked?: (film: FilmRow) => boolean
}

function compareByShowing(one: FilmRow, other: FilmRow): number {
  return one.nextStartsAt.getTime() - other.nextStartsAt.getTime()
}

// Only ever asked about the dated films, since an undated one is held back by hasYear.
function compareByYear(one: FilmRow, other: FilmRow): number {
  return (one.releaseYear ?? 0) - (other.releaseYear ?? 0)
}

function hasYear(film: FilmRow): boolean {
  return film.releaseYear !== null
}

// By the title the reader is shown, in their own alphabet: Slovak files Š between S and T.
function compareByTitle(one: FilmRow, other: FilmRow, language: Language): number {
  return formatFilmTitle(one, language).localeCompare(
    formatFilmTitle(other, language),
    LOCALE_BY_LANGUAGE[language],
  )
}

/*
 * The six orders the page offers, keyed by what stands in the URL. Slovak names, like every other
 * parameter, and the default is the order the query already returns, so it stays out of the link.
 */
const ORDERINGS = {
  cas: { compare: compareByShowing, isReversed: false },
  'cas-desc': { compare: compareByShowing, isReversed: true },
  nazov: { compare: compareByTitle, isReversed: false },
  'nazov-desc': { compare: compareByTitle, isReversed: true },
  rok: { compare: compareByYear, isReversed: false, isRanked: hasYear },
  'rok-desc': { compare: compareByYear, isReversed: true, isRanked: hasYear },
} satisfies Record<string, OrderingSpec>

export type Ordering = keyof typeof ORDERINGS

export const ORDERINGS_IN_ORDER = Object.keys(ORDERINGS) as readonly Ordering[]

export const DEFAULT_ORDERING: Ordering = 'cas'

// An order nobody offers is not an error worth a page: the list falls back to the one it opens in.
export function parseOrdering(value: string | null): Ordering {
  return value !== null && value in ORDERINGS ? (value as Ordering) : DEFAULT_ORDERING
}

export function sortFilms(
  films: readonly FilmRow[],
  ordering: Ordering,
  language: Language,
): FilmRow[] {
  const spec: OrderingSpec = ORDERINGS[ordering]
  const { compare, isReversed, isRanked = () => true } = spec
  const direction = isReversed ? -1 : 1

  return [
    ...films.filter(isRanked).sort((one, other) => direction * compare(one, other, language)),
    ...films.filter((film) => !isRanked(film)),
  ]
}
