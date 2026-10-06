import { type Language } from 'kinomat-core/lib/language'

import { type CountCopy } from '@/site/films/labels'
import { type Dimension } from '@/site/program/filters'

/*
 * One filter menu in words: its name, what its pill says while nothing is ticked, and the plural
 * that a count of ticks follows. Slovak declines them apart - all the cinemas but any of the audio
 * - so each dimension is written out rather than composed from a noun and a quantifier.
 */
export type FilterCopy = { name: string; all: string; plural: string }

/*
 * The words the filter bar itself is made of, apart from the view it sits in: Filmy wears the same
 * bar for the one dimension it offers, and a genre is called the same thing on either page.
 */
export type FilterBarCopy = {
  filters: Record<Dimension, FilterCopy>
  selectNone: string
  resetFilters: string
  showFilters: string
}

export type ProgramCopy = FilterBarCopy & {
  pageTitle: string
  pageDescription: string
  today: string
  tomorrow: string
  days: string
  originalAudio: string
  subtitles: string
  free: string
  minutes: string
  directedBy: string
  // Slovak counts in three shapes; the plural category a runtime picks says which one to print.
  films: CountCopy
  showings: CountCopy
  emptyTitle: string
  emptyHint: string
  filteredEmptyTitle: string
  filteredEmptyHint: string
  beyondHorizonTitle: string
  beyondHorizonHint: string
}

export const filterCopyByLanguage: Record<Language, FilterBarCopy> = {
  sk: {
    filters: {
      cinemas: { name: 'Kiná', all: 'Všetky kiná', plural: 'Kiná' },
      audio: { name: 'Zvuk', all: 'Ľubovoľný zvuk', plural: 'Zvuky' },
      subtitles: { name: 'Titulky', all: 'Ľubovoľné titulky', plural: 'Titulky' },
      formats: { name: 'Technológia', all: 'Všetky technológie', plural: 'Technológie' },
      genres: { name: 'Žáner', all: 'Všetky žánre', plural: 'Žánre' },
    },
    selectNone: 'zrušiť výber',
    resetFilters: 'zrušiť filtre',
    showFilters: 'Filtre',
  },
  en: {
    filters: {
      cinemas: { name: 'Cinemas', all: 'All cinemas', plural: 'Cinemas' },
      audio: { name: 'Audio', all: 'Any audio', plural: 'Audio' },
      subtitles: { name: 'Subtitles', all: 'Any subtitles', plural: 'Subtitles' },
      formats: { name: 'Format', all: 'All formats', plural: 'Formats' },
      genres: { name: 'Genre', all: 'All genres', plural: 'Genres' },
    },
    selectNone: 'clear selection',
    resetFilters: 'clear filters',
    showFilters: 'Filters',
  },
}

export const programCopyByLanguage: Record<Language, ProgramCopy> = {
  sk: {
    ...filterCopyByLanguage.sk,
    pageTitle: 'Program',
    pageDescription:
      'Program všetkých bratislavských kín na dnes a najbližšie dni, podľa kina, zvuku, titulkov a žánru.',
    today: 'Dnes',
    tomorrow: 'Zajtra',
    days: 'Dni',
    originalAudio: 'originál',
    subtitles: 'titulky',
    free: 'zadarmo',
    minutes: 'min',
    directedBy: 'Réžia',
    films: { one: 'film', few: 'filmy', many: 'filmu', other: 'filmov' },
    showings: {
      one: 'predstavenie',
      few: 'predstavenia',
      many: 'predstavenia',
      other: 'predstavení',
    },
    emptyTitle: 'Na tento deň nič nehrá',
    emptyHint: 'Skús iný dátum.',
    filteredEmptyTitle: 'Filtrom nič nevyhovuje',
    filteredEmptyHint: 'Skús ich uvoľniť alebo vybrať iný deň.',
    beyondHorizonTitle: 'Tak ďaleko dopredu kiná ešte neplánujú',
    beyondHorizonHint: 'Vyber si deň z ponuky vyššie.',
  },
  en: {
    ...filterCopyByLanguage.en,
    pageTitle: 'Schedule',
    pageDescription:
      'Showtimes across all Bratislava cinemas for today and the days ahead, by cinema, audio, subtitles and genre.',
    today: 'Today',
    tomorrow: 'Tomorrow',
    days: 'Days',
    originalAudio: 'original',
    subtitles: 'subtitles',
    free: 'free',
    minutes: 'min',
    directedBy: 'Directed by',
    films: { one: 'film', other: 'films' },
    showings: { one: 'showing', other: 'showings' },
    emptyTitle: 'Nothing is on this day',
    emptyHint: 'Try another date.',
    filteredEmptyTitle: 'Nothing matches the filters',
    filteredEmptyHint: 'Try loosening them or picking another day.',
    beyondHorizonTitle: 'The cinemas have not planned that far ahead',
    beyondHorizonHint: 'Pick a day from the strip above.',
  },
}
