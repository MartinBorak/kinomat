import { type Language, LOCALE_BY_LANGUAGE } from 'kinomat-core/lib/language'
import { SLOVAK_LANGUAGE_ADJECTIVES } from 'kinomat-core/lib/slovakLanguageAdjectives'
import { type PriceRange } from 'kinomat-core/types/priceRange'
import { Temporal } from 'temporal-polyfill'

import { type ProgramCopy } from '@/site/program/copy'

const LANGUAGE_NAMES_BY_LANGUAGE: Record<Language, Intl.DisplayNames> = {
  sk: new Intl.DisplayNames(['sk'], { type: 'language' }),
  en: new Intl.DisplayNames(['en'], { type: 'language' }),
}

// A cinema prints "originál" as readily as a code, so a word that is not a language stays a word.
function toLanguageName(code: string, language: Language): string {
  try {
    return LANGUAGE_NAMES_BY_LANGUAGE[language].of(code.toLowerCase()) ?? code
  } catch {
    return code
  }
}

// Sources write one code or several ("en, sk"), and a showing in two languages is heard in both.
function toLanguageNames(codes: string, language: Language): string {
  return codes
    .split(',')
    .map((code) => toLanguageName(code.trim(), language))
    .join(', ')
}

function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1)
}

/*
 * What the showing is heard in. 'original' is the scrapers' word for a film left in its own
 * language, and it is a claim about the showing rather than a language code, so it reads as one.
 */
export function formatAudio(code: string, copy: ProgramCopy, language: Language): string {
  return code === 'original' ? copy.originalAudio : toLanguageNames(code, language)
}

/*
 * Both languages want the adjective first ("slovenské titulky", "Slovak subtitles"). English can
 * take its language name as one; Slovak declines it, and Intl only ever names a language as a
 * noun, so an unlisted one keeps the noun wording rather than being given an invented ending.
 */
function toSubtitleAdjective(code: string, language: Language): string | undefined {
  return language === 'en'
    ? toLanguageName(code, language)
    : SLOVAK_LANGUAGE_ADJECTIVES[code]?.neuter
}

// Empty means the cinema printed no subtitles line, which is not the same as printing that there are none.
export function formatSubtitles(code: string, copy: ProgramCopy, language: Language): string {
  if (code === '') {
    return ''
  }

  // All or nothing: one unnamed language among several would leave the line half-declined.
  const adjectives = code.split(',').map((one) => toSubtitleAdjective(one.trim(), language))

  return adjectives.every((adjective) => adjective !== undefined)
    ? `${adjectives.join(', ')} ${copy.subtitles}`
    : `${copy.subtitles} ${toLanguageNames(code, language)}`
}

// A menu item is a label rather than prose, so what it names starts with a capital.
export function formatAudioOption(code: string, copy: ProgramCopy, language: Language): string {
  return capitalize(formatAudio(code, copy, language))
}

export function formatSubtitlesOption(code: string, language: Language): string {
  return capitalize(toLanguageName(code, language))
}

/*
 * Formats are stored as slugs ("4dx", "dolby-atmos"). Short tokens are acronyms and go up, longer
 * ones are words and take a capital, so 2D, IMAX and Dolby Atmos all fall out of the one rule.
 */
export function formatScreeningFormat(slug: string): string {
  return slug
    .split('-')
    .map((word) => (word.length <= 4 ? word.toUpperCase() : capitalize(word)))
    .join(' ')
}

/*
 * What a seat costs, as a cinema would print it: whole euros bare, anything else to the cent, and
 * two tiers as a range with the sign on both, "11,90 € – 12,90 €". A free showing is a word rather
 * than a zero, since "0 €" reads as a mistake.
 */
export function formatPrice(
  price: PriceRange | null,
  copy: ProgramCopy,
  language: Language,
): string {
  if (price === null) {
    return ''
  }

  if (price.max === 0) {
    return copy.free
  }

  const fractionDigits = Number.isInteger(price.min) && Number.isInteger(price.max) ? 0 : 2
  const format = new Intl.NumberFormat(LOCALE_BY_LANGUAGE[language], {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })

  return price.min === price.max
    ? format.format(price.max)
    : `${format.format(price.min)} – ${format.format(price.max)}`
}

/*
 * The three lines of a date chip. Today and tomorrow are named; every other day is its weekday.
 * Tomorrow stays named although it widens the English chip: late at night the strip starts there.
 */
export function formatDayChip(
  date: Temporal.PlainDate,
  today: Temporal.PlainDate,
  copy: ProgramCopy,
  language: Language,
): { weekday: string; day: string; month: string } {
  const daysAway = today.until(date).days
  const locale = LOCALE_BY_LANGUAGE[language]
  const weekday =
    daysAway === 0
      ? copy.today
      : daysAway === 1
        ? copy.tomorrow
        : date.toLocaleString(locale, { weekday: 'short' })

  return {
    weekday: capitalize(weekday),
    // Not the locale's own day, which in Slovak carries the ordinal dot a chip has no room for.
    day: String(date.day),
    month: date.toLocaleString(locale, { month: 'short' }),
  }
}
