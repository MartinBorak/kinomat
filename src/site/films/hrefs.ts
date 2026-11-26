import { toQueryString } from 'kinomat-core/lib/hrefs'
import { type Language, toLanguagePrefix } from 'kinomat-core/lib/language'
import { type CityId, toCityPrefix } from 'kinomat-core/types/city'
import { type Temporal } from 'temporal-polyfill'

import { DEFAULT_ORDERING, type Ordering } from '@/site/films/ordering'
import {
  NO_FILTERS,
  type ProgramFilters,
  type Selection,
  toDaySegment,
  toFilterEntries,
} from '@/site/program/filters'

// A city's index, as a query and a genre narrow it and an order arranges it.
export function toFilmsHref(
  query: string,
  language: Language,
  city: CityId | null,
  ordering: Ordering = DEFAULT_ORDERING,
  genres: Selection = [],
): string {
  return `${toLanguagePrefix(language)}${toCityPrefix(city)}/filmy${toQueryString([
    ...(query === '' ? [] : [['q', query]]),
    ...(ordering === DEFAULT_ORDERING ? [] : [['zoradenie', ordering]]),
    // Written by the same rule the schedule's filters are, so one link reads like the other.
    ...toFilterEntries({ ...NO_FILTERS, genres }),
  ])}`
}

// What a film's link needs: its alias where it has one, its public id where it has none.
export type FilmLink = { publicId: string; alias: string | null }

/*
 * The name a film's page is reached by. The alias is the one a reader can read; the public id still
 * opens the page, and redirects to the alias, so a link saved before the film had one keeps working.
 */
export function toFilmSegment(film: FilmLink): string {
  return film.alias ?? film.publicId
}

// One film's page in a city. Without a day it opens on the first the film plays there.
export function toFilmHref(
  film: FilmLink,
  language: Language,
  city: CityId | null,
  date?: Temporal.PlainDate,
  filters: ProgramFilters = NO_FILTERS,
): string {
  return `${toFilmsHref('', language, city)}/${toFilmSegment(film)}${toDaySegment(date)}${toQueryString(
    toFilterEntries(filters),
  )}`
}
