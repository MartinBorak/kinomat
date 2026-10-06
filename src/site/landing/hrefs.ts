import { type Language, toLanguagePrefix } from 'kinomat-core/lib/language'

// The front page, in the reader's language: what the mark in the header leads back to.
export function toHomeHref(language: Language): string {
  return toLanguagePrefix(language) || '/'
}
