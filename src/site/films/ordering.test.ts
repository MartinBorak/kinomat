import { type Language } from 'kinomat-core/lib/language'
import { parseBratislavaTime } from 'kinomat-core/lib/time'
import { describe, expect, it } from 'vitest'

import { type FilmRow } from '@/site/films/findFilms'
import { parseOrdering, sortFilms } from '@/site/films/ordering'

function createFilm(
  titleSk: string,
  time: string,
  titleEn = '',
  releaseYear: number | null = 2024,
): FilmRow {
  return {
    filmId: 1,
    publicId: 'k7f3q2abcd',
    titleSk,
    titleEn,
    originalTitle: titleSk,
    releaseYear,
    runtimeMinutes: 131,
    posterPath: null,
    directors: [],
    genres: [],
    screeningCount: 1,
    cinemaIds: ['kino-lumiere'],
    nextStartsAt: parseBratislavaTime(time),
    lastStartsAt: parseBratislavaTime(time),
  }
}

const FILMS = [
  createFilm('Zajatci', '2026-09-05T18:00:00', 'Captives', 2024),
  createFilm('Šiesta veta', '2026-09-07T20:00:00', '', 1962),
  createFilm('Autá', '2026-09-06T10:00:00', 'Cars', 2006),
]

function order(ordering: string, language: Language = 'sk', films: FilmRow[] = FILMS): string[] {
  return sortFilms(films, parseOrdering(ordering), language).map((film) => film.titleSk)
}

describe('ordering the films', () => {
  it('opens on the film screening soonest', () => {
    expect(order('cas')).toEqual(['Zajatci', 'Autá', 'Šiesta veta'])
  })

  it('turns that around on request', () => {
    expect(order('cas-desc')).toEqual(['Šiesta veta', 'Autá', 'Zajatci'])
  })

  // Š files between S and T in Slovak, which a plain code-point sort would put after Z.
  it('files a title the way the alphabet does', () => {
    expect(order('nazov')).toEqual(['Autá', 'Šiesta veta', 'Zajatci'])
    expect(order('nazov-desc')).toEqual(['Zajatci', 'Šiesta veta', 'Autá'])
  })

  // In English the same three films read Captives, Cars, Šiesta veta - a different alphabet order.
  it('files a film under the title the reader is shown', () => {
    expect(order('nazov', 'en')).toEqual(['Zajatci', 'Autá', 'Šiesta veta'])
  })

  it('files a film under the year it came out', () => {
    expect(order('rok')).toEqual(['Šiesta veta', 'Autá', 'Zajatci'])
    expect(order('rok-desc')).toEqual(['Zajatci', 'Autá', 'Šiesta veta'])
  })

  // Undated films end both year orders, since -1 would otherwise hand them the top of one.
  it('leaves a film nothing dates at the end either way round', () => {
    const withUndated = [...FILMS, createFilm('Neznámy', '2026-09-08T20:00:00', '', null)]

    expect(order('rok', 'sk', withUndated).at(-1)).toBe('Neznámy')
    expect(order('rok-desc', 'sk', withUndated).at(-1)).toBe('Neznámy')
  })

  it('falls back to the order it opens in when the URL names none it knows', () => {
    expect(order('podla-nalady')).toEqual(order('cas'))
  })
})
