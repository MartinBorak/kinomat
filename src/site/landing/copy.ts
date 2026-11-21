import { type Language } from 'kinomat-core/lib/language'
import { type SupportedCity } from 'kinomat-core/types/city'

export type LandingCopy = {
  kicker: (city: SupportedCity) => string
  headline: string
  search: string
  undecided: string
  browseSchedule: string
  pageDescription: (city: SupportedCity) => string
}

// Every string the page shows, in both languages: one dictionary rather than an i18n framework.
export const copyByLanguage: Record<Language, LandingCopy> = {
  sk: {
    kicker: (city) => `Všetky kiná ${city.slovakLocative} na jednom mieste`,
    headline: 'Na aký film ideš?',
    search: 'Hľadať',
    undecided: 'Ešte nevieš?',
    browseSchedule: 'Pozri si program',
    pageDescription: (city) =>
      `Program všetkých ${city.slovakPluralAdjective} kín na jednom mieste. Filmy, kiná a časy premietania na najbližšie dni.`,
  },
  en: {
    kicker: (city) => `Every cinema in ${city.name} in one place`,
    headline: 'What are you going to see?',
    search: 'Search',
    undecided: 'Not sure yet?',
    browseSchedule: 'See the schedule',
    pageDescription: (city) =>
      `Showtimes from every cinema in ${city.name} in one place. Films, cinemas and times for the days ahead.`,
  },
}
