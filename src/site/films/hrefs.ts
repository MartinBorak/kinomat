import { toQueryString } from 'kinomat-core/lib/hrefs'
import { type Language, toLanguagePrefix } from 'kinomat-core/lib/language'
import { type Temporal } from 'temporal-polyfill'

import { DEFAULT_ORDERING, type Ordering } from '@/site/films/ordering'
import {
  NO_FILTERS,
  type ProgramFilters,
  type Selection,
  toFilterEntries,
} from '@/site/program/filters'

// The index, as a query and a genre narrow it and an order arranges it.
export function toFilmsHref(
  query: string,
  language: Language,
  ordering: Ordering = DEFAULT_ORDERING,
  genres: Selection = [],
): string {
  return `${toLanguagePrefix(language)}/filmy${toQueryString([
    ...(query === '' ? [] : [['q', query]]),
    ...(ordering === DEFAULT_ORDERING ? [] : [['zoradenie', ordering]]),
    // Written by the same rule the schedule's filters are, so one link reads like the other.
    ...toFilterEntries({ ...NO_FILTERS, genres }),
  ])}`
}

// One film's own page. Without a day it opens on the first the film plays, which the server knows.
export function toFilmHref(
  publicId: string,
  language: Language,
  date?: Temporal.PlainDate,
  filters: ProgramFilters = NO_FILTERS,
): string {
  return `${toLanguagePrefix(language)}/filmy/${publicId}${toQueryString([
    ...(date === undefined ? [] : [['den', date.toString()]]),
    ...toFilterEntries(filters),
  ])}`
}
