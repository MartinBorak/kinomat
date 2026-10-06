import { type Language } from 'kinomat-core/lib/language'

export type CinemasCopy = {
  pageTitle: string
  pageDescription: string
  website: string
  map: string
  emptyTitle: string
  emptyHint: string
}

export const cinemasCopyByLanguage: Record<Language, CinemasCopy> = {
  sk: {
    pageTitle: 'Kiná',
    pageDescription: 'Všetky kiná v Bratislave a čo v nich práve hrajú.',
    website: 'stránka kina',
    map: 'mapa',
    emptyTitle: 'Toto kino teraz nič nehrá',
    emptyHint: 'Skús jeho vlastnú stránku, možno program ešte nezverejnilo.',
  },
  en: {
    pageTitle: 'Cinemas',
    pageDescription: 'Every cinema in Bratislava and what is playing in each.',
    website: 'cinema site',
    map: 'map',
    emptyTitle: 'This cinema has nothing on',
    emptyHint: 'Try its own site - it may not have published a schedule yet.',
  },
}
