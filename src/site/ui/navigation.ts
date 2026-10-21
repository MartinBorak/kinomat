import { type Language } from 'kinomat-core/lib/language'

import { aboutCopyByLanguage } from '@/site/about/copy'
import { toAboutHref } from '@/site/about/hrefs'
import { toCinemasHref } from '@/site/cinemas/hrefs'
import { toFilmsHref } from '@/site/films/hrefs'
import { toScheduleHref } from '@/site/program/filters'

const LABELS_BY_LANGUAGE: Record<Language, { cinemas: string; films: string; schedule: string }> = {
  sk: { cinemas: 'Kiná', films: 'Filmy', schedule: 'Program' },
  en: { cinemas: 'Cinemas', films: 'Films', schedule: 'Schedule' },
}

type NavItem = { label: string; href: string; isCurrent: boolean }

export type SiteSection = 'kina' | 'filmy' | 'program' | 'o-kinomate'

/*
 * The header's links, built in one place so that every page carries the reader's language across:
 * a link written as a bare path would drop back to Slovak on the next page.
 *
 * The About page is the fourth: it was a footer link alone, at the end of a day's listing, and a
 * reader asking where a price comes from should find the answer one tap away. Its label is the
 * page's own title.
 */
export function toSiteNavigation(language: Language, current: SiteSection | null): NavItem[] {
  const labels = LABELS_BY_LANGUAGE[language]

  return [
    { label: labels.cinemas, href: toCinemasHref(language), isCurrent: current === 'kina' },
    { label: labels.films, href: toFilmsHref('', language), isCurrent: current === 'filmy' },
    {
      label: labels.schedule,
      href: toScheduleHref(language),
      isCurrent: current === 'program',
    },
    {
      label: aboutCopyByLanguage[language].title,
      href: toAboutHref(language),
      isCurrent: current === 'o-kinomate',
    },
  ]
}
