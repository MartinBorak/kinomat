import { fireEvent, render, screen } from '@testing-library/react'
import { type Language } from 'kinomat-core/lib/language'
import { parseBratislavaTime } from 'kinomat-core/lib/time'
import { Temporal } from 'temporal-polyfill'
import { describe, expect, it, vi } from 'vitest'

import { FilmsPage } from '@/site/films/FilmsPage'
import { type FilmRow } from '@/site/films/findFilms'

// The query is read from the URL and written back to it, the way the schedule's filters are.
const url = vi.hoisted(() => ({ searchParams: new URLSearchParams() }))
vi.mock('next/navigation', () => ({ useSearchParams: () => url.searchParams }))

const TODAY = Temporal.PlainDate.from('2026-09-05')
const DRAMA = { id: 18, nameSk: 'Dráma', nameEn: 'Drama' }
const COMEDY = { id: 35, nameSk: 'Komédia', nameEn: 'Comedy' }
const PUBLIC_ID = 'k7f3q2abcd'

function createFilm(film: Partial<FilmRow> = {}): FilmRow {
  return {
    filmId: 1,
    publicId: PUBLIC_ID,
    titleSk: 'Vlny',
    titleEn: 'Waves',
    originalTitle: 'Vlny',
    releaseYear: 2024,
    runtimeMinutes: 131,
    posterPath: null,
    directors: [],
    genres: [],
    screeningCount: 3,
    cinemaIds: ['kino-lumiere'],
    nextStartsAt: parseBratislavaTime('2026-09-05T20:15:00'),
    lastStartsAt: parseBratislavaTime('2026-09-07T18:00:00'),
    ...film,
  }
}

function renderFilms(films: FilmRow[], { language = 'sk' as Language, search = '' } = {}) {
  url.searchParams = new URLSearchParams(search)

  render(<FilmsPage language={language} today={TODAY.toString()} films={films} />)
}

describe('the films view', () => {
  it('lists what is playing, with when it can next be seen', () => {
    renderFilms([createFilm()])

    expect(screen.getByRole('heading', { name: 'Vlny' })).toBeInTheDocument()
    expect(screen.getByText('Dnes 20:15')).toBeInTheDocument()
    expect(screen.getByText('1 kino')).toBeInTheDocument()
    expect(screen.getByText('1 film')).toBeInTheDocument()
  })

  it('sends a film to its own page, named by the id a link can keep', () => {
    renderFilms([createFilm()])

    expect(screen.getByRole('link', { name: /Vlny/ })).toHaveAttribute(
      'href',
      `/filmy/${PUBLIC_ID}`,
    )
  })

  it('shows only what the query in the URL names', () => {
    renderFilms(
      [
        createFilm(),
        createFilm({ filmId: 2, titleSk: 'Zajatci', titleEn: '', originalTitle: 'Zajatci' }),
      ],
      {
        search: 'q=zajatci',
      },
    )

    expect(screen.getByRole('heading', { name: 'Zajatci' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Vlny' })).not.toBeInTheDocument()
  })

  it('says the film is not playing rather than that nothing is', () => {
    renderFilms([createFilm()], { search: 'q=dune' })

    expect(screen.getByText('Taký film teraz nehrá')).toBeInTheDocument()
  })

  it('lists only the films of a genre the URL names, offering every genre playing', () => {
    renderFilms(
      [
        createFilm({ genres: [DRAMA] }),
        createFilm({
          filmId: 2,
          titleSk: 'Autá',
          titleEn: '',
          originalTitle: 'Autá',
          genres: [COMEDY],
        }),
      ],
      { search: 'zaner=35' },
    )

    expect(screen.getByRole('heading', { name: 'Autá' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Vlny' })).not.toBeInTheDocument()
    // The menu is derived from every film playing, so the one just filtered out is still on offer.
    expect(screen.getByRole('button', { name: 'Žáner: Komédia' })).toBeInTheDocument()
  })

  it('says nothing is playing when the schedule itself is empty', () => {
    renderFilms([])

    expect(screen.getByText('Momentálne nehrá nič')).toBeInTheDocument()
  })

  it('writes what is typed into the URL, since that is where the query lives', () => {
    const replaceState = vi.spyOn(window.history, 'replaceState')

    renderFilms([createFilm()])
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'vlny' } })

    expect(replaceState).toHaveBeenCalledWith(null, '', '/filmy?q=vlny')
  })

  it('reorders the grid by what the URL asks for', () => {
    renderFilms(
      [
        createFilm({ filmId: 1, titleSk: 'Vlny' }),
        createFilm({ filmId: 2, titleSk: 'Autá', titleEn: '', originalTitle: 'Autá' }),
      ],
      { search: 'zoradenie=nazov' },
    )

    expect(screen.getAllByRole('heading').map((heading) => heading.textContent)).toEqual([
      'Autá',
      'Vlny',
    ])
  })

  it('writes a chosen order into the URL, keeping the query', () => {
    const replaceState = vi.spyOn(window.history, 'replaceState')

    renderFilms([createFilm()], { search: 'q=vlny' })
    fireEvent.change(screen.getByRole('combobox', { name: 'Zoradiť' }), {
      target: { value: 'nazov-desc' },
    })

    expect(replaceState).toHaveBeenCalledWith(null, '', '/filmy?q=vlny&zoradenie=nazov-desc')
  })

  it('keeps the order when the language changes', () => {
    renderFilms([createFilm()], { search: 'zoradenie=nazov' })

    expect(screen.getByRole('link', { name: 'EN' })).toHaveAttribute(
      'href',
      '/en/filmy?zoradenie=nazov',
    )
  })

  it('keeps the query when the language changes', () => {
    renderFilms([createFilm()], { search: 'q=vlny' })

    expect(screen.getByRole('link', { name: 'EN' })).toHaveAttribute('href', '/en/filmy?q=vlny')
  })

  it('reads a film under its English title once the page is in English', () => {
    renderFilms([createFilm()], { language: 'en' })

    expect(screen.getByRole('heading', { name: 'Waves (Vlny)' })).toBeInTheDocument()
    expect(screen.getByText('Today 20:15')).toBeInTheDocument()
  })
})
