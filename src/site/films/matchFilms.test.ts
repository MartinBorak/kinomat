import { describe, expect, it } from 'vitest'

import { matchFilms } from '@/site/films/matchFilms'

function film(titleSk: string, titleEn = '', originalTitle = '') {
  return { titleSk, titleEn, originalTitle }
}

const FILMS = [
  film('Vlny', 'Waves', 'Vlny'),
  film('Zajatci', 'Captives', 'Zajatci'),
  film('Šiesta veta'),
  film('Laimīgie', 'Born in the Jungle', 'Laimīgie'),
]

describe('matching films to a query', () => {
  it('keeps every film when nothing is typed', () => {
    expect(matchFilms(FILMS, '  ').map((match) => match.titleSk)).toEqual(
      FILMS.map((f) => f.titleSk),
    )
  })

  it('matches a Slovak title typed without its diacritics', () => {
    expect(matchFilms(FILMS, 'siesta').map((match) => match.titleSk)).toEqual(['Šiesta veta'])
  })

  it('matches the English title of a film the cinemas print in Slovak', () => {
    expect(matchFilms(FILMS, 'captives').map((match) => match.titleSk)).toEqual(['Zajatci'])
  })

  it('matches the original title, whatever language it is in', () => {
    expect(matchFilms(FILMS, 'laimigie').map((match) => match.titleSk)).toEqual(['Laimīgie'])
  })

  it('matches part of a title, since a search is typed a letter at a time', () => {
    expect(matchFilms(FILMS, 'za').map((match) => match.titleSk)).toEqual(['Zajatci'])
  })

  it('keeps the order it was given, so the soonest showing stays first', () => {
    expect(matchFilms(FILMS, 'a').map((match) => match.titleSk)).toEqual([
      'Vlny',
      'Zajatci',
      'Šiesta veta',
      'Laimīgie',
    ])
  })

  it('finds nothing where nothing matches', () => {
    expect(matchFilms(FILMS, 'dune')).toEqual([])
  })
})
