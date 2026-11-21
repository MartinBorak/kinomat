import { type Language } from 'kinomat-core/lib/language'
import { type CityId } from 'kinomat-core/types/city'

import { aboutCopyByLanguage } from '@/site/about/copy'
import { toAboutHref } from '@/site/about/hrefs'
import { toCinemasHref } from '@/site/cinemas/hrefs'
import { toFilmsHref } from '@/site/films/hrefs'
import { NO_FILTERS, toProgramHref, toScheduleHref } from '@/site/program/filters'

const LABELS_BY_LANGUAGE: Record<Language, { cinemas: string; films: string; schedule: string }> = {
  sk: { cinemas: 'Kiná', films: 'Filmy', schedule: 'Program' },
  en: { cinemas: 'Cinemas', films: 'Films', schedule: 'Schedule' },
}

type NavItem = { label: string; href: string; isCurrent: boolean }

export type SiteSection = 'kina' | 'filmy' | 'program' | 'ffi' | 'o-kinomate'

/*
 * The header's links, built in one place so that every page carries the reader's language across:
 * a link written as a bare path would drop back to Slovak on the next page.
 *
 * The About page is the fourth: it was a footer link alone, at the end of a day's listing, and a
 * reader asking where a price comes from should find the answer one tap away. Its label is the
 * page's own title.
 *
 * A page outside any city links the city's sections bare, and the proxy fills in the reader's city.
 */
export function toSiteNavigation(
  language: Language,
  city: CityId | null,
  current: SiteSection | null,
): NavItem[] {
  const labels = LABELS_BY_LANGUAGE[language]

  return [
    { label: labels.cinemas, href: toCinemasHref(language, city), isCurrent: current === 'kina' },
    { label: labels.films, href: toFilmsHref('', language, city), isCurrent: current === 'filmy' },
    {
      label: labels.schedule,
      href: toScheduleHref(language, city),
      isCurrent: current === 'program',
    },
    // Only while the festival runs, 18 to 24 November 2026; remove it, and its page, afterwards.
    {
      label: 'FFi',
      href: toProgramHref(undefined, language, null, NO_FILTERS, 'ffi'),
      isCurrent: current === 'ffi',
    },
    {
      label: aboutCopyByLanguage[language].title,
      href: toAboutHref(language),
      isCurrent: current === 'o-kinomate',
    },
  ]
}
