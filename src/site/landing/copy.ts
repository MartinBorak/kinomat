import { type Language } from 'kinomat-core/lib/language'

export type LandingCopy = {
  kicker: string
  headline: string
  search: string
  pageDescription: string
}

// Every string the page shows, in both languages: one dictionary rather than an i18n framework.
export const copyByLanguage: Record<Language, LandingCopy> = {
  sk: {
    kicker: 'Všetky kiná v Bratislave na jednom mieste',
    headline: 'Na čo ideš do kina?',
    search: 'Hľadať',
    pageDescription:
      'Program všetkých bratislavských kín na jednom mieste, od Cinema City a Cinemaxu po Lumière, Mladosť či Nostalgiu. Filmy, kiná a časy premietania na najbližšie dni.',
  },
  en: {
    kicker: 'Every cinema in Bratislava in one place',
    headline: 'What are you going to see?',
    search: 'Search',
    pageDescription:
      'Showtimes from every cinema in Bratislava in one place, from Cinema City and Cinemax to Lumière, Mladosť and Nostalgia. Films, cinemas and times for the days ahead.',
  },
}
