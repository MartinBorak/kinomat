import { fireEvent, render, screen } from '@testing-library/react'
import { type Language } from 'kinomat-core/lib/language'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { LandingPage } from '@/site/landing/LandingPage'

// The type-to-focus listener follows the URL, not the mounted page, so a test says where the URL is.
const url = vi.hoisted(() => ({ pathname: '/' }))
vi.mock('next/navigation', () => ({ usePathname: () => url.pathname }))

beforeEach(() => {
  url.pathname = '/'
})

const FILMS = [
  {
    publicId: 'k7f3q2abcd',
    titleSk: 'Vlny',
    titleEn: 'Waves',
    originalTitle: 'Vlny',
    releaseYear: 2024,
  },
]

function renderPage(language: Language = 'sk') {
  render(<LandingPage films={FILMS} language={language} />)
}

describe('the landing page', () => {
  it('greets in Slovak, since that is what the cinemas print', () => {
    renderPage()

    expect(screen.getByRole('heading', { name: 'Na čo ideš do kina?' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Kiná' })).toHaveAttribute('href', '/kina')
  })

  it('offers no suggestions until something is typed', () => {
    renderPage()

    expect(screen.queryByRole('link', { name: /Kino Lumière/ })).not.toBeInTheDocument()
  })

  it('suggests a cinema from a query typed without diacritics', () => {
    renderPage()

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'lumiere' } })

    expect(screen.getByRole('link', { name: /Kino Lumière/ })).toHaveAttribute(
      'href',
      '/kina/kino-lumiere',
    )
  })

  it('sends a film straight to its own page', () => {
    renderPage()

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'vlny' } })

    expect(screen.getByRole('link', { name: /Vlny/ })).toHaveAttribute('href', '/filmy/k7f3q2abcd')
  })

  /*
   * The rows outlive the query by one transition: a panel emptied the moment it is told to close
   * has nothing left to shrink, so they stay, inert, until the closing has played over them.
   */
  it('goes nowhere on an empty search', () => {
    renderPage()

    const form = screen.getByRole('textbox', { name: /film/i }).closest('form') as HTMLFormElement
    const empty = fireEvent.submit(form)

    fireEvent.change(screen.getByRole('textbox', { name: /film/i }), { target: { value: 'vlny' } })
    const typed = fireEvent.submit(form)

    // fireEvent.submit returns false when the handler called preventDefault.
    expect(empty).toBe(false)
    expect(typed).toBe(true)
  })

  it('clears the query, and closes the panel over the rows it was showing', () => {
    renderPage()

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'edison' } })
    fireEvent.click(screen.getByRole('button', { name: 'zmazať' }))

    expect(screen.getByRole('textbox')).toHaveValue('')
    expect(screen.getByRole('link', { name: /Edison/ }).closest('[inert]')).toBeInTheDocument()
  })

  // Not a toggle in state: the router keeps a left page mounted, so state would outlive the URL.
  it('switches language by linking to itself', () => {
    renderPage()

    expect(screen.getByRole('link', { name: 'EN' })).toHaveAttribute('href', '/en')
  })

  it('keeps English on every way off the page', () => {
    renderPage('en')

    fireEvent.change(screen.getByRole('textbox', { name: /film/i }), {
      target: { value: 'vlny' },
    })

    expect(screen.getByRole('link', { name: 'Cinemas' })).toHaveAttribute('href', '/en/kina')
    expect(screen.getByRole('link', { name: 'Kinomat' })).toHaveAttribute('href', '/en')
    // The Slovak query still finds the film, and the row shows the reader's own title for it.
    expect(screen.getByRole('link', { name: /Waves/ })).toHaveAttribute(
      'href',
      '/en/filmy/k7f3q2abcd',
    )
    expect(screen.getByRole('textbox', { name: /film/i }).closest('form')).toHaveAttribute(
      'action',
      '/en/filmy',
    )
  })

  // The mark in every header leads back here with the language, so arriving in English stays English.
  it('opens in the language the URL asked for', () => {
    renderPage('en')

    expect(screen.getByRole('heading', { name: 'What are you going to see?' })).toBeInTheDocument()
  })

  // Focused on the first letter rather than from the start, which would trap a keyboard reader.
  it('hands focus to the search when typing starts anywhere on the page', () => {
    renderPage()
    const field = screen.getByRole('textbox', { name: /film/i })

    expect(field).not.toHaveFocus()

    fireEvent.keyDown(document.body, { key: 'v' })

    expect(field).toHaveFocus()
  })

  it('leaves a shortcut where it was aimed', () => {
    renderPage()

    fireEvent.keyDown(document.body, { key: 'r', metaKey: true })
    fireEvent.keyDown(document.body, { key: 'Tab' })

    expect(screen.getByRole('textbox', { name: /film/i })).not.toHaveFocus()
  })

  // The router keeps a left page mounted, so the listener has to follow the URL off the page.
  it('grabs nothing once the URL points elsewhere', () => {
    url.pathname = '/program'
    renderPage()

    fireEvent.keyDown(document.body, { key: 'v' })

    expect(screen.getByRole('textbox', { name: /film/i })).not.toHaveFocus()
  })

  it('forgets the search once the reader leaves and comes back', () => {
    const { rerender } = render(<LandingPage films={FILMS} language="sk" />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'vlny' } })

    url.pathname = '/program'
    rerender(<LandingPage films={FILMS} language="sk" />)
    url.pathname = '/'
    rerender(<LandingPage films={FILMS} language="sk" />)

    expect(screen.getByRole('textbox')).toHaveValue('')
  })
})
