import { formatGenre } from 'kinomat-core/db/findGenres'
import { toQueryString } from 'kinomat-core/lib/hrefs'
import { type Language, toLanguagePrefix } from 'kinomat-core/lib/language'
import { foldForSearch } from 'kinomat-core/lib/text'
import { Temporal } from 'temporal-polyfill'

import { type ProgramCopy } from '@/site/program/copy'
import {
  type CinemaListing,
  type ProgrammeListing,
  type Showing,
} from '@/site/program/groupScreenings'
import {
  formatAudioOption,
  formatScreeningFormat,
  formatSubtitlesOption,
} from '@/site/program/labels'

/*
 * The values the reader ticked. Nothing ticked restricts nothing, since every box starts clear and
 * a menu that could show nothing is no use; so a dimension is absent from the URL until something
 * is chosen, and a link keeps meaning what it said once a cinema is added.
 */
export type Selection = readonly string[]

/*
 * The URL is where a filter lives, so its name is Slovak like the route and the day beside it.
 * Key order is the pill order in the bar.
 */
const PARAMETER_BY_DIMENSION = {
  cinemas: 'kino',
  genres: 'zaner',
  audio: 'zvuk',
  subtitles: 'titulky',
  formats: 'format',
} as const

export type Dimension = keyof typeof PARAMETER_BY_DIMENSION

export const DIMENSIONS = Object.keys(PARAMETER_BY_DIMENSION) as readonly Dimension[]

export type ProgramFilters = { query: string } & Record<Dimension, Selection>

export const NO_FILTERS: ProgramFilters = {
  query: '',
  cinemas: [],
  audio: [],
  subtitles: [],
  formats: [],
  genres: [],
}

// One choice a menu offers: the stored value it matches on, and what the reader is shown instead.
export type FilterOption = { value: string; label: string }

export type FilterOptions = Record<Dimension, readonly FilterOption[]>

// What a view that offers only some of the menus fills the rest in with.
export const NO_OPTIONS: FilterOptions = {
  cinemas: [],
  audio: [],
  subtitles: [],
  formats: [],
  genres: [],
}

/*
 * Sources write one code or several ("en, sk"), and the case is theirs: SK and sk are one language.
 */
export function toCodes(field: string): string[] {
  return field
    .split(',')
    .map((code) => code.trim().toLowerCase())
    .filter((code) => code !== '')
}

function toFormatCodes(formats: readonly string[]): string[] {
  return formats.map((format) => format.toLowerCase())
}

function parseSelection(value: string | null): Selection {
  return toCodes(value ?? '')
}

export function parseFilters(parameters: URLSearchParams): ProgramFilters {
  return {
    query: parameters.get('q') ?? '',
    cinemas: parseSelection(parameters.get(PARAMETER_BY_DIMENSION.cinemas)),
    audio: parseSelection(parameters.get(PARAMETER_BY_DIMENSION.audio)),
    subtitles: parseSelection(parameters.get(PARAMETER_BY_DIMENSION.subtitles)),
    formats: parseSelection(parameters.get(PARAMETER_BY_DIMENSION.formats)),
    genres: parseSelection(parameters.get(PARAMETER_BY_DIMENSION.genres)),
  }
}

// Only what the reader has actually chosen, which is what keeps a shared link short.
export function toFilterEntries(filters: ProgramFilters): string[][] {
  return [
    ...(filters.query === '' ? [] : [['q', filters.query]]),
    ...DIMENSIONS.filter((dimension) => filters[dimension].length > 0).map((dimension) => [
      PARAMETER_BY_DIMENSION[dimension],
      filters[dimension].join(','),
    ]),
  ]
}

/*
 * Everything the Program view reads out of its URL: the day, the language and the filters. A day is
 * a link rather than a click, and it carries the filters so that changing day does not drop them.
 * Without a day the schedule opens on the first day something is still on.
 */
export function toProgramHref(
  date: Temporal.PlainDate | undefined,
  language: Language,
  filters: ProgramFilters = NO_FILTERS,
): string {
  return `${toLanguagePrefix(language)}/program${toQueryString([
    ...(date === undefined ? [] : [['den', date.toString()]]),
    ...toFilterEntries(filters),
  ])}`
}

export function toScheduleHref(language: Language): string {
  return toProgramHref(undefined, language)
}

export function hasAnyFilter(filters: ProgramFilters): boolean {
  return filters.query !== '' || DIMENSIONS.some((dimension) => filters[dimension].length > 0)
}

// A row matches a dimension when it carries one of the chosen values, or when none were chosen.
export function matches(selection: Selection, values: readonly string[]): boolean {
  return selection.length === 0 || values.some((value) => selection.includes(value))
}

/*
 * A cinema that printed no subtitles line has no code to match, so it drops out once subtitles are
 * asked for - the blank means nobody said, which is not the same fact as "none".
 */
function filterShowings(showings: readonly Showing[], filters: ProgramFilters): Showing[] {
  return showings.filter(
    (showing) =>
      matches(filters.audio, toCodes(showing.language)) &&
      matches(filters.subtitles, toCodes(showing.subtitles)) &&
      matches(filters.formats, toFormatCodes(showing.format)),
  )
}

function filterCinemas(
  cinemas: readonly CinemaListing[],
  filters: ProgramFilters,
): CinemaListing[] {
  return cinemas
    .filter((cinema) => matches(filters.cinemas, [cinema.id]))
    .map((cinema) => ({ ...cinema, showings: filterShowings(cinema.showings, filters) }))
    .filter((cinema) => cinema.showings.length > 0)
}

// A query names a film, and a bill is named by any of the films on it, in either title.
function matchesQuery(programme: ProgrammeListing, query: string): boolean {
  const folded = foldForSearch(query.trim())

  return (
    folded === '' ||
    programme.films.some((film) =>
      [film.titleSk, film.titleEn, film.originalTitle].some((title) =>
        foldForSearch(title).includes(folded),
      ),
    )
  )
}

/*
 * Genre is a property of the film rather than of the showing, so it narrows the bill the way a
 * query does: a double feature stays whole when either of its films is of a chosen genre.
 */
function matchesGenres(programme: ProgrammeListing, selection: Selection): boolean {
  return programme.films.some((film) =>
    matches(
      selection,
      film.genres.map((genre) => String(genre.id)),
    ),
  )
}

/*
 * The day as the filters leave it. Showings are dropped first, then whatever is left empty by that:
 * a cinema with nothing on and a bill nobody is playing are not results with zero times in them.
 */
export function applyFilters(
  programmes: readonly ProgrammeListing[],
  filters: ProgramFilters,
): ProgrammeListing[] {
  return programmes
    .filter((programme) => matchesQuery(programme, filters.query))
    .filter((programme) => matchesGenres(programme, filters.genres))
    .map((programme) => ({ ...programme, cinemas: filterCinemas(programme.cinemas, filters) }))
    .filter((programme) => programme.cinemas.length > 0)
}

function toOptions(labelByValue: ReadonlyMap<string, string>): FilterOption[] {
  return [...labelByValue]
    .map(([value, label]) => ({ value, label }))
    .sort((one, other) => one.label.localeCompare(other.label, 'sk'))
}

function toShowings(programmes: readonly ProgrammeListing[]): Showing[] {
  return programmes.flatMap((programme) => programme.cinemas.flatMap((cinema) => cinema.showings))
}

/*
 * What the menus offer, read off the day itself rather than from a list kept by hand: a cinema
 * writes whichever language it likes, and an option nothing on the day matches is a dead end.
 */
export function deriveFilterOptions(
  programmes: readonly ProgrammeListing[],
  copy: ProgramCopy,
  language: Language,
): FilterOptions {
  const showings = toShowings(programmes)

  return {
    cinemas: toOptions(
      new Map(
        programmes.flatMap((programme) =>
          programme.cinemas.map((cinema) => [cinema.id, cinema.name] as const),
        ),
      ),
    ),
    audio: toOptions(
      new Map(
        showings.flatMap((showing) =>
          toCodes(showing.language).map(
            (code) => [code, formatAudioOption(code, copy, language)] as const,
          ),
        ),
      ),
    ),
    subtitles: toOptions(
      new Map(
        showings.flatMap((showing) =>
          toCodes(showing.subtitles).map(
            (code) => [code, formatSubtitlesOption(code, language)] as const,
          ),
        ),
      ),
    ),
    formats: toOptions(
      new Map(
        showings.flatMap((showing) =>
          toFormatCodes(showing.format).map((code) => [code, formatScreeningFormat(code)] as const),
        ),
      ),
    ),
    genres: toOptions(
      new Map(
        programmes.flatMap((programme) =>
          programme.films.flatMap((film) =>
            film.genres.map((genre) => [String(genre.id), formatGenre(genre, language)] as const),
          ),
        ),
      ),
    ),
  }
}

// The selection a click leaves behind, in the menu's own order rather than the order of ticking.
export function toggleValue(
  selection: Selection,
  options: readonly FilterOption[],
  value: string,
): Selection {
  return options
    .map((option) => option.value)
    .filter((other) => (other === value ? !selection.includes(value) : selection.includes(other)))
}
