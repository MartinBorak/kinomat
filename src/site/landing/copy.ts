import { type Language } from 'kinomat-core/lib/language'
import { type SupportedCity } from 'kinomat-core/types/city'

export type LandingCopy = {
  kicker: (city: SupportedCity) => string
  headline: string
  search: string
  undecided: string
  browseSchedule: string
  // The front page is one URL for every city, so what a search engine reads of it names them all.
  pageTitle: string
  pageDescription: string
}

// Every string the page shows, in both languages: one dictionary rather than an i18n framework.
export const copyByLanguage: Record<Language, LandingCopy> = {
  sk: {
    kicker: (city) => `Všetky kiná ${city.slovakLocative} na jednom mieste`,
    headline: 'Na aký film ideš?',
    search: 'Hľadať',
    undecided: 'Ešte nevieš?',
    browseSchedule: 'Pozri si program',
    pageTitle: 'Kinomat – program kín na Slovensku',
    pageDescription:
      'Program všetkých kín v Bratislave, Košiciach, Žiline a ďalších slovenských mestách na jednom mieste. Filmy, kiná a časy premietania na najbližšie dni.',
  },
  en: {
    kicker: (city) => `Every cinema in ${city.name} in one place`,
    headline: 'What are you going to see?',
    search: 'Search',
    undecided: 'Not sure yet?',
    browseSchedule: 'See the schedule',
    pageTitle: 'Kinomat – cinema showtimes across Slovakia',
    pageDescription:
      'Showtimes from every cinema in Bratislava, Košice, Žilina and other Slovak cities in one place. Films, cinemas and times for the days ahead.',
  },
}
