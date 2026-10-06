import { type Language } from 'kinomat-core/lib/language'

export type SearchCopy = {
  heroPlaceholder: string
  // The header's field is a third the width of the hero's, so it asks the question in fewer words.
  headerPlaceholder: string
  clear: string
  filmsLabel: string
  cinemasLabel: string
}

// What the search says wherever it stands, so the hero and the header cannot drift apart.
export const searchCopyByLanguage: Record<Language, SearchCopy> = {
  sk: {
    heroPlaceholder: 'Napíš názov filmu alebo kina…',
    headerPlaceholder: 'Film alebo kino…',
    clear: 'zmazať',
    filmsLabel: 'Filmy',
    cinemasLabel: 'Kiná',
  },
  en: {
    heroPlaceholder: 'Type a film or cinema name…',
    headerPlaceholder: 'Film or cinema…',
    clear: 'clear',
    filmsLabel: 'Films',
    cinemasLabel: 'Cinemas',
  },
}
