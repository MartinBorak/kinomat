import { type Language } from 'kinomat-core/lib/language'
import { type SupportedCity } from 'kinomat-core/types/city'

export type CinemasCopy = {
  pageTitle: string
  pageDescription: (city: SupportedCity) => string
  website: string
  map: string
  emptyTitle: string
  emptyHint: string
}

export const cinemasCopyByLanguage: Record<Language, CinemasCopy> = {
  sk: {
    pageTitle: 'Kiná',
    pageDescription: (city) => `Všetky kiná ${city.slovakLocative} a čo v nich práve hrajú.`,
    website: 'stránka kina',
    map: 'mapa',
    emptyTitle: 'Toto kino teraz nič nehrá',
    emptyHint: 'Skús jeho vlastnú stránku, možno program ešte nezverejnilo.',
  },
  en: {
    pageTitle: 'Cinemas',
    pageDescription: (city) => `Every cinema in ${city.name} and what is playing in each.`,
    website: 'cinema site',
    map: 'map',
    emptyTitle: 'This cinema has nothing on',
    emptyHint: 'Try its own site - it may not have published a schedule yet.',
  },
}
