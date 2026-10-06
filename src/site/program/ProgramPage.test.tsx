import { fireEvent, render, screen } from '@testing-library/react'
import { type Language } from 'kinomat-core/lib/language'
import { parseBratislavaTime } from 'kinomat-core/lib/time'
import { Temporal } from 'temporal-polyfill'
import { describe, expect, it, vi } from 'vitest'

import { type ProgrammeListing, type Showing } from '@/site/program/groupScreenings'
import { ProgramPage } from '@/site/program/ProgramPage'

/*
 * The filters are read from the URL and written back to it, so a test says what the URL holds and
 * then reads what the page did to it. Nothing here re-renders on the write: that is the browser's.
 */
const url = vi.hoisted(() => ({ searchParams: new URLSearchParams() }))
vi.mock('next/navigation', () => ({ useSearchParams: () => url.searchParams }))

const TODAY = Temporal.PlainDate.from('2026-09-05')
const DAYS = [TODAY, TODAY.add({ days: 1 }), TODAY.add({ days: 2 })].map((day) => day.toString())

const WAVES: ProgrammeListing = {
  id: 1,
  films: [
    {
      id: 1,
      publicId: 'k7f3q2abcd',
      titleSk: 'Vlny',
      titleEn: 'Waves',
      originalTitle: 'Vlny',
      releaseYear: 2024,
      runtimeMinutes: 131,
      imdbId: 'tt27665778',
      csfdId: null,
      posterPath: '/kfUKP5IgzgLQyQD1MDt99yq9Af0.jpg',
      directors: [],
      genres: [],
    },
  ],
  cinemas: [
    {
      id: 'kino-lumiere',
      name: 'Kino Lumière',
      address: 'Špitálska 4, Bratislava',
      showings: [
        {
          id: 1,
          startsAt: parseBratislavaTime('2026-09-05T20:15:00'),
          format: ['2d'],
          language: 'sk',
          subtitles: 'en',
          bookingUrl: 'https://kino.lumiere.sk/vstupenky/1',
          eventNote: '',
          price: null,
        },
      ],
    },
  ],
}

// The same day said differently in one field of every showing, which is where a menu reads its own.
function toShowingWith(programme: ProgrammeListing, said: Partial<Showing>): ProgrammeListing {
  return {
    ...programme,
    cinemas: programme.cinemas.map((cinema) => ({
      ...cinema,
      showings: cinema.showings.map((showing) => ({ ...showing, ...said })),
    })),
  }
}

function renderProgram(
  programmes: ProgrammeListing[],
  { date = TODAY, language = 'sk' as Language, search = '' } = {},
) {
  url.searchParams = new URLSearchParams(search)

  render(
    <ProgramPage
      language={language}
      date={date.toString()}
      today={TODAY.toString()}
      days={DAYS}
      programmes={programmes}
    />,
  )
}

describe('the Program view', () => {
  it('shows a showing with the cinema, the time and the way out to booking it', () => {
    renderProgram([WAVES])

    expect(screen.getByRole('heading', { name: 'Vlny' })).toBeInTheDocument()
    expect(screen.getByText('2024 · 131 min')).toBeInTheDocument()
    expect(screen.getByText('Kino Lumière')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /20:15/ })).toHaveAttribute(
      'href',
      'https://kino.lumiere.sk/vstupenky/1',
    )
  })

  it('links a film to the catalogues that hold it, and to no others', () => {
    renderProgram([WAVES])

    expect(screen.getByRole('link', { name: 'IMDb' })).toHaveAttribute(
      'href',
      'https://www.imdb.com/title/tt27665778/',
    )
    expect(screen.queryByRole('link', { name: 'ČSFD' })).not.toBeInTheDocument()
  })

  it('leads from a film and a cinema it plays at to their own pages', () => {
    renderProgram([WAVES])

    expect(screen.getByRole('link', { name: 'Vlny' })).toHaveAttribute('href', '/filmy/k7f3q2abcd')
    expect(screen.getByRole('link', { name: 'Kino Lumière' })).toHaveAttribute(
      'href',
      '/kina/kino-lumiere',
    )
  })

  it('keeps the reader’s language on the way there', () => {
    renderProgram([WAVES], { language: 'en' })

    expect(screen.getByRole('link', { name: 'Waves' })).toHaveAttribute(
      'href',
      '/en/filmy/k7f3q2abcd',
    )
    expect(screen.getByRole('link', { name: 'Kino Lumière' })).toHaveAttribute(
      'href',
      '/en/kina/kino-lumiere',
    )
  })

  it('offers every day something is on, the one being read marked as current', () => {
    renderProgram([WAVES])

    expect(screen.getByRole('link', { name: /Dnes/ })).toHaveAttribute('aria-current', 'date')
    expect(screen.getByRole('link', { name: /Zajtra/ })).toHaveAttribute(
      'href',
      '/program?den=2026-09-06',
    )
  })

  // Hidden from the accessibility tree: it stands inside a link the film's own title repeats.
  it('shows the poster from TMDB, and says whose data it is', () => {
    renderProgram([WAVES])

    expect(screen.getByRole('presentation', { hidden: true })).toHaveAttribute(
      'src',
      expect.stringContaining(encodeURIComponent('/kfUKP5IgzgLQyQD1MDt99yq9Af0.jpg')),
    )
    expect(
      screen.getByText(
        'Tento produkt používa TMDB API, ale nie je schválený ani certifikovaný službou TMDB.',
      ),
    ).toBeInTheDocument()
  })

  // TMDB's own wording, which is what an English reader gets rather than our translation of it.
  it('says whose data it is in the language the reader is reading', () => {
    renderProgram([WAVES], { language: 'en' })

    expect(
      screen.getByText('This product uses the TMDB API but is not endorsed or certified by TMDB.'),
    ).toBeInTheDocument()
  })

  it('counts what is on in the shape Slovak gives the number', () => {
    renderProgram([WAVES])

    expect(screen.getByText('1 film')).toBeInTheDocument()
  })

  it('says a day is empty and a day past the horizon differently', () => {
    renderProgram([], { date: TODAY.add({ days: 1 }) })
    expect(screen.getByText('Na tento deň nič nehrá')).toBeInTheDocument()

    renderProgram([], { date: TODAY.add({ days: 40 }) })
    expect(screen.getByText('Tak ďaleko dopredu kiná ešte neplánujú')).toBeInTheDocument()
  })

  it('reads in English when the URL asks for it, and keeps the day it asked for', () => {
    renderProgram([WAVES], { language: 'en', search: 'den=2026-09-05' })

    expect(screen.getByRole('heading', { name: 'Waves (Vlny)' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'SK' })).toHaveAttribute(
      'href',
      '/program?den=2026-09-05',
    )
  })

  // A day-less URL opens on the first day with something on, and switching language must not freeze that.
  it('leaves the day out of the language link where the URL named none', () => {
    renderProgram([WAVES], { language: 'en' })

    expect(screen.getByRole('link', { name: 'SK' })).toHaveAttribute('href', '/program')
  })
})

describe('filtering the Program view', () => {
  it('shows the day as the URL leaves it, and says so when that is nothing', () => {
    renderProgram([WAVES], { search: 'kino=edison-filmhub' })

    expect(screen.queryByRole('heading', { name: 'Vlny' })).not.toBeInTheDocument()
    expect(screen.getByText('Filtrom nič nevyhovuje')).toBeInTheDocument()
    expect(screen.getByText('0 filmov')).toBeInTheDocument()
  })

  it('offers only what the day actually holds', () => {
    renderProgram([WAVES])

    fireEvent.click(screen.getByRole('button', { name: 'Kiná: Všetky kiná' }))

    expect(screen.getByRole('checkbox', { name: 'Kino Lumière' })).not.toBeChecked()
    expect(screen.queryByRole('checkbox', { name: 'Edison Filmhub' })).not.toBeInTheDocument()
  })

  /*
   * A menu with nothing in it is a pill that opens onto an empty box: the day simply says nothing
   * about that dimension, which every cinema showing a subtitle-less film does.
   */
  it('leaves out a menu the day offers nothing for', () => {
    renderProgram([toShowingWith(WAVES, { subtitles: '' })])

    expect(screen.getByRole('button', { name: /^Zvuk/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Titulky/ })).not.toBeInTheDocument()
  })

  // Except where a link brought one: a filter nobody can see is a filter nobody can undo.
  it('keeps an empty menu that the URL is filtering on', () => {
    renderProgram([toShowingWith(WAVES, { subtitles: '' })], { search: 'titulky=en' })

    expect(screen.getByRole('button', { name: /^Titulky/ })).toBeInTheDocument()
  })

  it('writes a ticked box back to the URL rather than asking the server again', () => {
    const replaceState = vi.spyOn(window.history, 'replaceState')
    renderProgram([WAVES])

    fireEvent.click(screen.getByRole('button', { name: 'Titulky: Ľubovoľné titulky' }))
    fireEvent.click(screen.getByRole('checkbox', { name: 'Angličtina' }))

    expect(replaceState).toHaveBeenCalledWith(null, '', '/program?titulky=en')
  })

  it('carries the filters onto every other day, so changing day keeps them', () => {
    renderProgram([WAVES], { search: 'kino=kino-lumiere&q=vlny' })

    expect(screen.getByRole('link', { name: /Zajtra/ })).toHaveAttribute(
      'href',
      '/program?den=2026-09-06&q=vlny&kino=kino-lumiere',
    )
  })
})
