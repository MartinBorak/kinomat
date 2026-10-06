import { type Language, toLanguagePrefix } from 'kinomat-core/lib/language'

export function toAboutHref(language: Language): string {
  return `${toLanguagePrefix(language)}/o-kinomate`
}
