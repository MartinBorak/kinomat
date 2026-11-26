import { type Language } from 'kinomat-core/lib/language'
import { type SupportedCity } from 'kinomat-core/types/city'

import { type CountCopy } from '@/site/films/labels'
import { type Ordering } from '@/site/films/ordering'

export type FilmsCopy = {
  pageTitle: string
  heading: (city: SupportedCity) => string
  pageDescription: (city: SupportedCity) => string
  // A film's own page, which has its title and its city to go on and nothing that ages.
  filmDescription: (title: string, city: SupportedCity) => string
  filmTitle: (title: string, city: SupportedCity) => string
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
  // A film's page in a city it is not playing in, and the line naming where it plays.
  notInCityTitle: (city: SupportedCity) => string
  notInCityHint: string
  showingIn: string
}

export const filmsCopyByLanguage: Record<Language, FilmsCopy> = {
  sk: {
    pageTitle: 'Filmy',
    heading: (city) => `Filmy v ${city.slovakPluralAdjective} kinách`,
    pageDescription: (city) =>
      `Všetky filmy, ktoré práve hrajú v ${city.slovakPluralAdjective} kinách, s dátumami a kinami.`,
    filmTitle: (title, city) => `${title} v kinách ${city.slovakLocative}`,
    filmDescription: (title, city) =>
      `Kedy a kde hrá ${title} ${city.slovakLocative}: časy premietaní, kiná, jazyk a titulky na jednom mieste.`,
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
    notInCityTitle: (city) => `Tento film ${city.slovakLocative} nehrá`,
    notInCityHint: 'Pozri, kde hrá inde.',
    showingIn: 'Hrá v',
  },
  en: {
    pageTitle: 'Films',
    heading: (city) => `Films showing in ${city.name}`,
    pageDescription: (city) =>
      `Every film now playing in ${city.name}’s cinemas, with dates and venues.`,
    filmTitle: (title, city) => `${title}: showtimes in ${city.name}`,
    filmDescription: (title, city) =>
      `When and where ${title} is showing in ${city.name}: times, cinemas, language and subtitles in one place.`,
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
    notInCityTitle: (city) => `This film is not showing in ${city.name}`,
    notInCityHint: 'See where else it is on.',
    showingIn: 'Showing in',
  },
}
