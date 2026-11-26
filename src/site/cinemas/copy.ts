import { type Language } from 'kinomat-core/lib/language'
import { type SupportedCity } from 'kinomat-core/types/city'

export type CinemasCopy = {
  pageTitle: string
  heading: (city: SupportedCity) => string
  pageDescription: (city: SupportedCity) => string
  // A cinema's own page; its name often says Kino already, so the sentence does not.
  cinemaDescription: (name: string, address: string) => string
  website: string
  map: string
  emptyTitle: string
  emptyHint: string
}

export const cinemasCopyByLanguage: Record<Language, CinemasCopy> = {
  sk: {
    pageTitle: 'Kiná',
    heading: (city) => `Kiná ${city.slovakLocative}`,
    pageDescription: (city) => `Všetky kiná ${city.slovakLocative} a čo v nich práve hrajú.`,
    cinemaDescription: (name, address) =>
      `${name}, ${address}: program na dnes a najbližšie dni, časy premietaní, jazyk a titulky.`,
    website: 'stránka kina',
    map: 'mapa',
    emptyTitle: 'Toto kino teraz nič nehrá',
    emptyHint: 'Skús jeho vlastnú stránku, možno program ešte nezverejnilo.',
  },
  en: {
    pageTitle: 'Cinemas',
    heading: (city) => `Cinemas in ${city.name}`,
    pageDescription: (city) => `Every cinema in ${city.name} and what is playing in each.`,
    cinemaDescription: (name, address) =>
      `${name}, ${address}: showtimes for today and the days ahead, with language and subtitles.`,
    website: 'cinema site',
    map: 'map',
    emptyTitle: 'This cinema has nothing on',
    emptyHint: 'Try its own site - it may not have published a schedule yet.',
  },
}
