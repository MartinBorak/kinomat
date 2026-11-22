import { type Language } from 'kinomat-core/lib/language'
import { CITIES, type CityId } from 'kinomat-core/types/city'

import { aboutCopyByLanguage } from '@/site/about/copy'
import { toAboutHref } from '@/site/about/hrefs'
import { toCinemasHref } from '@/site/cinemas/hrefs'
import { toFilmsHref } from '@/site/films/hrefs'
import { toHomeHref } from '@/site/landing/hrefs'
import { NO_FILTERS, toProgramHref, toScheduleHref } from '@/site/program/filters'

const LABELS_BY_LANGUAGE: Record<Language, { cinemas: string; films: string; schedule: string }> = {
  sk: { cinemas: 'Kiná', films: 'Filmy', schedule: 'Program' },
  en: { cinemas: 'Cinemas', films: 'Films', schedule: 'Schedule' },
}

export const CITY_LABEL_BY_LANGUAGE: Record<Language, string> = { sk: 'Mesto', en: 'City' }

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
    /*
     * Only while the festival runs, 18 to 24 November 2026; remove it, and its page, afterwards.
     * It plays in Bratislava alone, so only that city's pages, and the festival's own, offer it.
     */
    ...(city === 'bratislava' || current === 'ffi'
      ? [
          {
            label: 'FFi',
            href: toProgramHref(undefined, language, null, NO_FILTERS, 'ffi'),
            isCurrent: current === 'ffi',
          },
        ]
      : []),
    {
      label: aboutCopyByLanguage[language].title,
      href: toAboutHref(language),
      isCurrent: current === 'o-kinomate',
    },
  ]
}

// The section a page belongs to, in another city: a cinema's own page is one city's only, so its list.
function toSectionHref(language: Language, city: CityId, current: SiteSection | null): string {
  switch (current) {
    case 'kina':
      return toCinemasHref(language, city)
    case 'filmy':
      return toFilmsHref('', language, city)
    case 'program':
      return toScheduleHref(language, city)
    default:
      return toHomeHref(language, city)
  }
}

/*
 * The city menu's links, each to the section the reader is in. The day and the filters stay behind,
 * since a day or a cinema chosen in one city names nothing in the next.
 */
export function toCityNavigation(
  language: Language,
  city: CityId,
  current: SiteSection | null,
): NavItem[] {
  return CITIES.map((other) => ({
    label: other.name,
    href: toSectionHref(language, other.id, current),
    isCurrent: other.id === city,
  }))
}
