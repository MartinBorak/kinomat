import { fireEvent, render, screen } from '@testing-library/react'
import { type Language } from 'kinomat-core/lib/language'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { HeaderSearch } from '@/site/search/HeaderSearch'
import { SUGGESTED_FILMS_ROUTE, type SuggestedFilm } from '@/site/search/suggestions'

const FILMS: SuggestedFilm[] = [
  {
    publicId: 'k7f3q2abcd',
    titleSk: 'Vlny',
    titleEn: 'Waves',
    originalTitle: 'Vlny',
    releaseYear: 2024,
  },
]

const fetchFilms = vi.fn()

beforeEach(() => {
  fetchFilms.mockReset().mockResolvedValue(Response.json(FILMS))
  vi.stubGlobal('fetch', fetchFilms)
})

function renderSearch(language: Language = 'sk') {
  render(<HeaderSearch language={language} />)

  return screen.getByRole('textbox')
}

describe('the header’s search', () => {
  it('offers nothing and fetches nothing until something is typed', () => {
    renderSearch()

    expect(screen.queryByRole('link', { name: /Vlny/ })).not.toBeInTheDocument()
    expect(fetchFilms).not.toHaveBeenCalled()
  })

  it('fetches the films once, at the focus', () => {
    const field = renderSearch()

    fireEvent.focus(field)
    fireEvent.change(field, { target: { value: 'vlny' } })

    expect(fetchFilms).toHaveBeenCalledExactlyOnceWith(SUGGESTED_FILMS_ROUTE)
  })

  it('offers both a film and a cinema, the way the landing page does', async () => {
    const field = renderSearch()

    fireEvent.change(field, { target: { value: 'lumiere' } })

    expect(await screen.findByRole('link', { name: /Kino Lumière/ })).toHaveAttribute(
      'href',
      '/kina/kino-lumiere',
    )

    fireEvent.change(field, { target: { value: 'vlny' } })

    expect(await screen.findByRole('link', { name: /Vlny/ })).toHaveAttribute(
      'href',
      '/filmy/k7f3q2abcd',
    )
  })

  it('keeps a reader who is reading in English there', async () => {
    const field = renderSearch('en')

    fireEvent.change(field, { target: { value: 'lumiere' } })

    expect(await screen.findByRole('link', { name: /Kino Lumière/ })).toHaveAttribute(
      'href',
      '/en/kina/kino-lumiere',
    )
    // The submission goes to the films view in the same language, or it would answer in Slovak.
    expect(field.closest('form')).toHaveAttribute('action', '/en/filmy')
  })

  // Closed over the rows it was showing, as on the landing page: the closing plays over them.
  it('closes on escape, and on a click anywhere else', async () => {
    const field = renderSearch()

    fireEvent.change(field, { target: { value: 'lumiere' } })
    await screen.findByRole('link', { name: /Kino Lumière/ })
    fireEvent.keyDown(document, { key: 'Escape' })

    expect(
      screen.getByRole('link', { name: /Kino Lumière/ }).closest('[inert]'),
    ).toBeInTheDocument()

    fireEvent.change(field, { target: { value: 'lumiere' } })
    fireEvent.pointerDown(document.body)

    expect(
      screen.getByRole('link', { name: /Kino Lumière/ }).closest('[inert]'),
    ).toBeInTheDocument()
  })

  it('sends what nobody picked to the films view, which searches for it', async () => {
    const field = renderSearch()

    fireEvent.change(field, { target: { value: 'vlny' } })
    await screen.findByRole('link', { name: /Vlny/ })

    expect(field.closest('form')).toHaveAttribute('action', '/filmy')
    expect(field).toHaveAttribute('name', 'q')
  })
})
