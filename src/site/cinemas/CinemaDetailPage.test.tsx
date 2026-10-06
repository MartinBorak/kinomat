import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { type Language } from 'kinomat-core/lib/language'
import { parseBratislavaTime } from 'kinomat-core/lib/time'
import { findCinema } from 'kinomat-core/types/cinema'
import { Temporal } from 'temporal-polyfill'
import { describe, expect, it, vi } from 'vitest'

import { CinemaDetailPage } from '@/site/cinemas/CinemaDetailPage'
import { type ProgrammeListing } from '@/site/program/groupScreenings'

// The filters are read from the URL and written back to it, as they are on the schedule itself.
const url = vi.hoisted(() => ({ searchParams: new URLSearchParams() }))
vi.mock('next/navigation', () => ({ useSearchParams: () => url.searchParams }))

const TODAY = Temporal.PlainDate.from('2026-09-05')
const DAYS = [TODAY, TODAY.add({ days: 2 })]
const LUMIERE = findCinema('kino-lumiere')!

const WAVES: ProgrammeListing = {
  id: 1,
  films: [
    {
      id: 47,
      publicId: 'k7f3q2abcd',
      titleSk: 'Vlny',
      titleEn: 'Waves',
      originalTitle: 'Vlny',
      releaseYear: 2024,
      runtimeMinutes: 131,
      imdbId: null,
      csfdId: null,
      posterPath: null,
      directors: [],
      genres: [],
    },
  ],
  cinemas: [
    {
      id: LUMIERE.id,
      name: LUMIERE.name,
      address: LUMIERE.address,
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

function renderCinema(
  programmes: ProgrammeListing[],
  { date = TODAY, language = 'sk' as Language, search = '' } = {},
) {
  url.searchParams = new URLSearchParams(search)

  render(
    <CinemaDetailPage
      language={language}
      cinema={LUMIERE}
      date={date.toString()}
      today={TODAY.toString()}
      days={DAYS.map((day) => day.toString())}
      programmes={programmes}
    />,
  )
}

describe('one cinema’s page', () => {
  it('names the cinema, where it stands, and where to read it in its own words', () => {
    renderCinema([WAVES])

    expect(screen.getByRole('heading', { level: 1, name: 'Kino Lumière' })).toBeInTheDocument()
    expect(screen.getByText('Špitálska 4, Bratislava')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'stránka kina' })).toHaveAttribute(
      'href',
      'https://www.kino-lumiere.sk/',
    )
  })

  it('lists the day’s showings, the way the schedule does', () => {
    renderCinema([WAVES])

    expect(screen.getByRole('heading', { name: 'Vlny' })).toBeInTheDocument()
    expect(screen.getByText('20:15')).toBeInTheDocument()
    expect(screen.getByText('1 film')).toBeInTheDocument()
  })

  it('says the cinema’s name once, rather than on every card', () => {
    renderCinema([WAVES])

    expect(screen.getAllByText('Kino Lumière')).toHaveLength(1)
  })

  it('offers no menu for choosing a cinema, the page being one', () => {
    renderCinema([WAVES])

    expect(screen.queryByRole('button', { name: /Kiná/ })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Titulky/ })).toBeInTheDocument()
  })

  it('ignores a cinema filter a shared link carried in, which could only empty the page', () => {
    renderCinema([WAVES], { search: 'kino=kino-mladost' })

    expect(screen.getByRole('heading', { name: 'Vlny' })).toBeInTheDocument()
  })

  it('keeps the cinema in every day the strip offers', () => {
    renderCinema([WAVES])

    expect(screen.getByRole('link', { name: /Dnes/ })).toHaveAttribute(
      'href',
      '/kina/kino-lumiere?den=2026-09-05',
    )
    expect(screen.getByRole('link', { name: /7/ })).toHaveAttribute(
      'href',
      '/kina/kino-lumiere?den=2026-09-07',
    )
  })

  it('keeps the day the URL asked for when the language changes, and only that', () => {
    renderCinema([WAVES], { date: DAYS[1], search: 'den=2026-09-07' })

    expect(screen.getByRole('link', { name: 'EN' })).toHaveAttribute(
      'href',
      '/en/kina/kino-lumiere?den=2026-09-07',
    )
    cleanup()
    renderCinema([WAVES])

    expect(screen.getByRole('link', { name: 'EN' })).toHaveAttribute(
      'href',
      '/en/kina/kino-lumiere',
    )
  })

  it('writes a filter into the URL, keeping the cinema and the day', () => {
    const replaceState = vi.spyOn(window.history, 'replaceState')

    renderCinema([WAVES], { date: DAYS[1], search: 'den=2026-09-07' })
    fireEvent.click(screen.getByRole('button', { name: /Titulky/ }))
    fireEvent.click(screen.getByRole('checkbox', { name: 'Angličtina' }))

    expect(replaceState).toHaveBeenCalledWith(
      null,
      '',
      '/kina/kino-lumiere?den=2026-09-07&titulky=en',
    )
  })

  it('narrows the day to what is typed, since a cinema’s programme is worth searching', () => {
    renderCinema([WAVES], { search: 'q=anora' })

    expect(screen.getByText('Filtrom nič nevyhovuje')).toBeInTheDocument()
  })

  it('sends the reader to the cinema itself where the day holds nothing', () => {
    renderCinema([])

    expect(screen.getByText('Toto kino teraz nič nehrá')).toBeInTheDocument()
  })
})
