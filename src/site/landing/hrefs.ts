import { type Language, toLanguagePrefix } from 'kinomat-core/lib/language'
import { type CityId } from 'kinomat-core/types/city'

/*
 * The front page, in the reader's language: what the mark in the header leads back to. It names no
 * city, since nobody shares a city's front page; the proxy serves the one the reader remembers.
 */
export function toHomeHref(language: Language): string {
  return toLanguagePrefix(language) || '/'
}

/*
 * A city's own address for the front page, which moves a reader there and lands on the bare one.
 * Nothing on the site links to it, which is what lets the proxy remember the city it names: no
 * prefetch can ask for it, only a reader following a link from elsewhere.
 */
export function toCityHomeHref(language: Language, city: CityId): string {
  return `${toLanguagePrefix(language)}/${city}`
}
