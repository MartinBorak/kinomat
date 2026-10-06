import { type Language } from 'kinomat-core/lib/language'

import { type CountCopy } from '@/site/films/labels'
import { type Ordering } from '@/site/films/ordering'

export type FilmsCopy = {
  pageTitle: string
  pageDescription: string
  today: string
  tomorrow: string
  minutes: string
  directedBy: string
  films: CountCopy
  cinemas: CountCopy
  orderingLabel: string
  orderings: Record<Ordering, string>
  emptyTitle: string
  emptyHint: string
  noMatchTitle: string
  noMatchHint: string
}

export const filmsCopyByLanguage: Record<Language, FilmsCopy> = {
  sk: {
    pageTitle: 'Filmy',
    pageDescription:
      'Všetky filmy, ktoré práve hrajú v bratislavských kinách, s dátumami a kinami.',
    today: 'Dnes',
    tomorrow: 'Zajtra',
    minutes: 'min',
    directedBy: 'Réžia',
    films: { one: 'film', few: 'filmy', many: 'filmu', other: 'filmov' },
    cinemas: { one: 'kino', few: 'kiná', many: 'kina', other: 'kín' },
    orderingLabel: 'Zoradiť',
    orderings: {
      cas: 'Od najskoršieho',
      'cas-desc': 'Od najneskoršieho',
      nazov: 'Názov A-Z',
      'nazov-desc': 'Názov Z-A',
      rok: 'Od najstaršieho',
      'rok-desc': 'Od najnovšieho',
    },
    emptyTitle: 'Momentálne nehrá nič',
    emptyHint: 'Skús to znova, keď kiná zverejnia program.',
    noMatchTitle: 'Taký film teraz nehrá',
    noMatchHint: 'Skús kratší názov alebo ho napíš inak.',
  },
  en: {
    pageTitle: 'Films',
    pageDescription: 'Every film now playing in Bratislava’s cinemas, with dates and venues.',
    today: 'Today',
    tomorrow: 'Tomorrow',
    minutes: 'min',
    directedBy: 'Directed by',
    films: { one: 'film', other: 'films' },
    cinemas: { one: 'cinema', other: 'cinemas' },
    orderingLabel: 'Sort',
    orderings: {
      cas: 'Soonest first',
      'cas-desc': 'Furthest away first',
      nazov: 'Title A-Z',
      'nazov-desc': 'Title Z-A',
      rok: 'Oldest first',
      'rok-desc': 'Newest first',
    },
    emptyTitle: 'Nothing is playing right now',
    emptyHint: 'Try again once the cinemas publish their schedule.',
    noMatchTitle: 'That film is not playing',
    noMatchHint: 'Try a shorter title or a different spelling.',
  },
}
