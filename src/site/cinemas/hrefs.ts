import { toQueryString } from 'kinomat-core/lib/hrefs'
import { type Language, toLanguagePrefix } from 'kinomat-core/lib/language'
import { type Cinema } from 'kinomat-core/types/cinema'
import { type Temporal } from 'temporal-polyfill'

import { NO_FILTERS, type ProgramFilters, toFilterEntries } from '@/site/program/filters'

// The list of cinemas, which nothing but the language narrows.
export function toCinemasHref(language: Language): string {
  return `${toLanguagePrefix(language)}/kina`
}

// One cinema's own page. Without a day it opens on its first day with something on.
export function toCinemaHref(
  cinemaId: string,
  language: Language,
  date?: Temporal.PlainDate,
  filters: ProgramFilters = NO_FILTERS,
): string {
  return `${toLanguagePrefix(language)}/kina/${cinemaId}${toQueryString([
    ...(date === undefined ? [] : [['den', date.toString()]]),
    ...toFilterEntries(filters),
  ])}`
}

/*
 * Where the cinema stands, in whichever map app the reader's device opens this with. The name goes
 * in front of the address because it is what disambiguates a shopping centre's several entrances.
 */
export function toMapHref(cinema: Cinema): string {
  const query = encodeURIComponent(`${cinema.name}, ${cinema.address}`)

  return `https://www.google.com/maps/search/?api=1&query=${query}`
}
