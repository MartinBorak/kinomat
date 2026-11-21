import { type Language, toLanguagePrefix } from 'kinomat-core/lib/language'
import { type CityId, toCityPrefix } from 'kinomat-core/types/city'

// The city's front page, in the reader's language: what the mark in the header leads back to.
export function toHomeHref(language: Language, city: CityId | null): string {
  return `${toLanguagePrefix(language)}${toCityPrefix(city)}` || '/'
}
