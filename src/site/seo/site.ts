import { LANGUAGES, type Language, toLanguagePrefix } from 'kinomat-core/lib/language'
import { type Metadata } from 'next'

// The one absolute name the site has; robots, the sitemap and every canonical must agree on it.
export const SITE_ORIGIN = 'https://kinomat.sk'

// '' + '/' would name nothing and '/en' + '/' would gain a slash Next never serves.
export function toLanguagePath(path: string, language: Language): string {
  const prefix = toLanguagePrefix(language)

  return path === '/' ? (prefix === '' ? '/' : prefix) : `${prefix}${path}`
}

/*
 * The same page in each language, told to search engines so the two variants read as one page
 * rather than as rivals; Slovak is the default a language-less visitor lands on.
 */
export function toAlternates(path: string, language: Language): Metadata['alternates'] {
  return {
    canonical: toLanguagePath(path, language),
    languages: {
      ...Object.fromEntries(LANGUAGES.map((lang) => [lang, toLanguagePath(path, lang)])),
      'x-default': toLanguagePath(path, 'sk'),
    },
  }
}
