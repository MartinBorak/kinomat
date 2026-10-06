import { type FilmGenre, formatGenre } from 'kinomat-core/db/findGenres'
import { type Language, LOCALE_BY_LANGUAGE } from 'kinomat-core/lib/language'
import { formatTimeOfDay, toBratislavaDate } from 'kinomat-core/lib/time'
import { Temporal } from 'temporal-polyfill'

// A count in the shape the language gives it: Slovak has three, English two.
export type CountCopy = Partial<Record<Intl.LDMLPluralRule, string>> & { other: string }

// The title this reader knows the film by, falling back to Slovak, which every film has.
export function formatFilmTitle(
  film: { titleSk: string; titleEn: string },
  language: Language,
): string {
  return language === 'en' && film.titleEn !== '' ? film.titleEn : film.titleSk
}

// The name the film was made under, printed beside the reader's own only where it says something else.
export function formatOriginalTitle(
  film: { titleSk: string; titleEn: string; originalTitle: string },
  language: Language,
): string {
  return film.originalTitle === formatFilmTitle(film, language) ? '' : film.originalTitle
}

/*
 * Year and runtime, each printed only where it is known - and TMDB gives a concert film 0 minutes,
 * which is a gap in its record rather than a length.
 */
export function formatFilmMeta(
  film: { releaseYear: number | null; runtimeMinutes: number | null },
  copy: { minutes: string },
): string {
  return [
    film.releaseYear === null ? '' : String(film.releaseYear),
    film.runtimeMinutes === null || film.runtimeMinutes === 0
      ? ''
      : `${film.runtimeMinutes} ${copy.minutes}`,
  ]
    .filter((part) => part !== '')
    .join(' · ')
}

/*
 * What it is filed under. Kept out of the meta line above so a page can set it apart or drop it:
 * TMDB files a family film under five genres at once, which joined would swamp the year beside it.
 */
export function formatGenres(film: { genres: readonly FilmGenre[] }, language: Language): string {
  return film.genres.map((genre) => formatGenre(genre, language)).join(' · ')
}

// Who made it, where a catalogue says: "Réžia: Sean Baker". Empty where none of them names one.
export function formatDirectors(
  film: { directors: readonly string[] },
  copy: { directedBy: string },
): string {
  return film.directors.length === 0 ? '' : `${copy.directedBy}: ${film.directors.join(', ')}`
}

// "11 filmov" - the noun in the shape this count takes, which Slovak has three of.
export function formatCount(count: number, forms: CountCopy, language: Language): string {
  const category = new Intl.PluralRules(LOCALE_BY_LANGUAGE[language]).select(count)

  return `${count} ${forms[category] ?? forms.other}`
}

/*
 * When a film can next be seen. Today and tomorrow are named, since that is how a reader thinks of
 * them; a day further out is dated, because its weekday alone would not say which week.
 */
export function formatNextShowing(
  startsAt: Date,
  today: Temporal.PlainDate,
  copy: { today: string; tomorrow: string },
  language: Language,
): string {
  const date = toBratislavaDate(startsAt)
  const daysAway = today.until(date).days
  const locale = LOCALE_BY_LANGUAGE[language]
  const day =
    daysAway === 0
      ? copy.today
      : daysAway === 1
        ? copy.tomorrow
        : date.toLocaleString(locale, { weekday: 'short', day: 'numeric', month: 'numeric' })

  return `${day.charAt(0).toUpperCase()}${day.slice(1)} ${formatTimeOfDay(startsAt)}`
}
