import { toQueryString } from 'kinomat-core/lib/hrefs'
import { type Language, toLanguagePrefix } from 'kinomat-core/lib/language'
import { type Cinema } from 'kinomat-core/types/cinema'
import { type CityId, toCityPrefix } from 'kinomat-core/types/city'
import { type Temporal } from 'temporal-polyfill'

import {
  NO_FILTERS,
  type ProgramFilters,
  toDaySegment,
  toFilterEntries,
} from '@/site/program/filters'

// A city's list of cinemas.
export function toCinemasHref(language: Language, city: CityId | null): string {
  return `${toLanguagePrefix(language)}${toCityPrefix(city)}/kina`
}

// One cinema's own page, under its own city. Without a day it opens on its first day with something on.
export function toCinemaHref(
  cinema: Pick<Cinema, 'id' | 'cityId'>,
  language: Language,
  date?: Temporal.PlainDate,
  filters: ProgramFilters = NO_FILTERS,
): string {
  return `${toCinemasHref(language, cinema.cityId)}/${cinema.id}${toDaySegment(date)}${toQueryString(
    toFilterEntries(filters),
  )}`
}

/*
 * Where the cinema stands, in whichever map app the reader's device opens this with. The name goes
 * in front of the address because it is what disambiguates a shopping centre's several entrances.
 */
export function toMapHref(cinema: Cinema): string {
  const query = encodeURIComponent(`${cinema.name}, ${cinema.address}`)

  return `https://www.google.com/maps/search/?api=1&query=${query}`
}
