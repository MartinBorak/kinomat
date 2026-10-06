import { type FilmGenre } from 'kinomat-core/db/findGenres'
import { parseBratislavaTime } from 'kinomat-core/lib/time'
import { Temporal } from 'temporal-polyfill'
import { describe, expect, it } from 'vitest'

import { filmsCopyByLanguage } from '@/site/films/copy'
import {
  formatCount,
  formatDirectors,
  formatFilmMeta,
  formatFilmTitle,
  formatGenres,
  formatNextShowing,
  formatOriginalTitle,
} from '@/site/films/labels'
import { programCopyByLanguage } from '@/site/program/copy'

const SLOVAK = programCopyByLanguage.sk
const ENGLISH = programCopyByLanguage.en

type LabelledFilm = {
  titleSk: string
  titleEn: string
  originalTitle: string
  releaseYear: number | null
  runtimeMinutes: number | null
  directors: string[]
  genres: FilmGenre[]
}

const DRAMA: FilmGenre = { id: 18, nameSk: 'Dráma', nameEn: 'Drama' }

function createFilm(film: Partial<LabelledFilm> = {}): LabelledFilm {
  return {
    titleSk: 'Vlny',
    titleEn: 'Waves',
    originalTitle: 'Vlny',
    releaseYear: 2024,
    runtimeMinutes: 131,
    directors: ['Jiří Mádl'],
    genres: [DRAMA],
    ...film,
  }
}

describe('labelling a film', () => {
  it('shows the English title only where there is one', () => {
    expect(formatFilmTitle(createFilm(), 'en')).toBe('Waves')
    expect(formatFilmTitle(createFilm({ titleEn: '' }), 'en')).toBe('Vlny')
    expect(formatFilmTitle(createFilm(), 'sk')).toBe('Vlny')
  })

  it('names the original title only where it is not the one already shown', () => {
    const foreign = createFilm({
      originalTitle: 'Vildmænd',
      titleSk: 'Divoch',
      titleEn: 'Wild Men',
    })

    expect(formatOriginalTitle(foreign, 'sk')).toBe('Vildmænd')
    expect(formatOriginalTitle(foreign, 'en')).toBe('Vildmænd')
    expect(formatOriginalTitle(createFilm(), 'sk')).toBe('')
    expect(formatOriginalTitle(createFilm({ originalTitle: 'Waves' }), 'en')).toBe('')
    expect(formatOriginalTitle(createFilm({ originalTitle: '' }), 'sk')).toBe('')
  })

  it('prints only the parts of the meta line that are known', () => {
    expect(formatFilmMeta(createFilm(), SLOVAK)).toBe('2024 · 131 min')
    expect(formatFilmMeta(createFilm({ runtimeMinutes: null }), SLOVAK)).toBe('2024')
    expect(formatFilmMeta(createFilm({ runtimeMinutes: 0 }), SLOVAK)).toBe('2024')
    expect(formatFilmMeta(createFilm({ releaseYear: null, runtimeMinutes: null }), SLOVAK)).toBe('')
  })

  it('names the genres in the language the page is read in', () => {
    const filed = createFilm({ genres: [DRAMA, { id: 35, nameSk: 'Komédia', nameEn: 'Comedy' }] })

    expect(formatGenres(filed, 'sk')).toBe('Dráma · Komédia')
    expect(formatGenres(filed, 'en')).toBe('Drama · Comedy')
    expect(formatGenres(createFilm({ genres: [] }), 'sk')).toBe('')
  })

  it('names the directors where a catalogue states any', () => {
    expect(formatDirectors(createFilm(), SLOVAK)).toBe('Réžia: Jiří Mádl')
    expect(
      formatDirectors(createFilm({ directors: ['A. Wachowski', 'L. Wachowski'] }), ENGLISH),
    ).toBe('Directed by: A. Wachowski, L. Wachowski')
    expect(formatDirectors(createFilm({ directors: [] }), SLOVAK)).toBe('')
  })

  it('counts films in the shape Slovak gives the number', () => {
    expect(formatCount(1, SLOVAK.films, 'sk')).toBe('1 film')
    expect(formatCount(3, SLOVAK.films, 'sk')).toBe('3 filmy')
    expect(formatCount(11, SLOVAK.films, 'sk')).toBe('11 filmov')
    expect(formatCount(11, ENGLISH.films, 'en')).toBe('11 films')
  })
})

describe('saying when a film can next be seen', () => {
  const today = Temporal.PlainDate.from('2026-09-10')
  const copy = filmsCopyByLanguage.sk

  it('names today and tomorrow rather than dating them', () => {
    expect(formatNextShowing(parseBratislavaTime('2026-09-10T20:00:00'), today, copy, 'sk')).toBe(
      'Dnes 20:00',
    )
    expect(formatNextShowing(parseBratislavaTime('2026-09-11T18:30:00'), today, copy, 'sk')).toBe(
      'Zajtra 18:30',
    )
  })

  it('dates a day further out, since its weekday alone would not say which week', () => {
    expect(formatNextShowing(parseBratislavaTime('2026-09-12T18:30:00'), today, copy, 'sk')).toBe(
      'So 12. 9. 18:30',
    )
  })

  // A show past midnight belongs to the Bratislava day it starts on, not to the UTC one.
  it('reads a late show in Bratislava time', () => {
    expect(formatNextShowing(parseBratislavaTime('2026-09-11T00:30:00'), today, copy, 'sk')).toBe(
      'Zajtra 00:30',
    )
  })
})
