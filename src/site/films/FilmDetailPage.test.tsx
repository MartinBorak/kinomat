import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { type Language } from 'kinomat-core/lib/language'
import { parseBratislavaTime } from 'kinomat-core/lib/time'
import { type CityId } from 'kinomat-core/types/city'
import { Temporal } from 'temporal-polyfill'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { FilmDetailPage } from '@/site/films/FilmDetailPage'
import { type ProgrammeListing } from '@/site/program/groupScreenings'

// The filters are read from the URL and written back to it, as they are on the schedule itself.
const url = vi.hoisted(() => ({ searchParams: new URLSearchParams() }))
vi.mock('next/navigation', () => ({ useSearchParams: () => url.searchParams }))

/*
 * The listing drops what has started by the reader's clock, so the clock stands on the morning of
 * TODAY, before any of its showings. Only Date is faked: the clock's own timer keeps running.
 */
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(parseBratislavaTime('2026-09-05T08:00:00'))
})
afterEach(() => {
  vi.useRealTimers()
})

const TODAY = Temporal.PlainDate.from('2026-09-05')
const DAYS = [TODAY, TODAY.add({ days: 2 })]
const PUBLIC_ID = 'k7f3q2abcd'

const WAVES: ProgrammeListing = {
  id: 1,
  films: [
    {
      id: 47,
      publicId: PUBLIC_ID,
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
      id: 'kino-lumiere',
      name: 'Kino Lumière',
      address: 'Špitálska 4, Bratislava',
      cityId: 'bratislava',
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

function renderFilm(
  programmes: ProgrammeListing[],
  {
    date = TODAY,
    isDayNamed = false,
    language = 'sk' as Language,
    search = '',
    days = DAYS,
    otherCities = [] as CityId[],
  } = {},
) {
  url.searchParams = new URLSearchParams(search)

  render(
    <FilmDetailPage
      language={language}
      city="bratislava"
      otherCities={otherCities}
      publicId={PUBLIC_ID}
      date={date.toString()}
      isDayNamed={isDayNamed}
      today={TODAY.toString()}
      days={days.map((day) => day.toString())}
      programmes={programmes}
    />,
  )
}

describe('one film’s page', () => {
  it('lists the day’s showings, the way the schedule does', () => {
    renderFilm([WAVES])

    expect(screen.getByRole('heading', { name: 'Vlny' })).toBeInTheDocument()
    expect(screen.getByText('Kino Lumière')).toBeInTheDocument()
    expect(screen.getByText('20:15')).toBeInTheDocument()
  })

  // The header still searches the whole site; what the film's own listing has no use for is a filter.
  it('offers no search of its listing, since the film is the whole question', () => {
    renderFilm([WAVES])

    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument()
  })

  // Its own title is the page the reader is on; the cinema under it is not.
  it('makes no link of the film it is about, and one of the cinema playing it', () => {
    renderFilm([WAVES])

    expect(screen.queryByRole('link', { name: 'Vlny' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Kino Lumière' })).toHaveAttribute(
      'href',
      '/bratislava/kina/kino-lumiere',
    )
  })

  it('keeps the film in every day the strip offers', () => {
    renderFilm([WAVES])

    expect(screen.getByRole('link', { name: /Dnes/ })).toHaveAttribute(
      'href',
      `/bratislava/filmy/${PUBLIC_ID}/2026-09-05`,
    )
    expect(screen.getByRole('link', { name: /7/ })).toHaveAttribute(
      'href',
      `/bratislava/filmy/${PUBLIC_ID}/2026-09-07`,
    )
  })

  it('keeps the day the URL asked for when the language changes, and only that', () => {
    renderFilm([WAVES], { date: DAYS[1], isDayNamed: true })

    expect(screen.getByRole('link', { name: 'EN' })).toHaveAttribute(
      'href',
      `/en/bratislava/filmy/${PUBLIC_ID}/2026-09-07`,
    )
    cleanup()
    renderFilm([WAVES])

    expect(screen.getByRole('link', { name: 'EN' })).toHaveAttribute(
      'href',
      `/en/bratislava/filmy/${PUBLIC_ID}`,
    )
  })

  it('counts the showings on the day, not the films', () => {
    renderFilm([WAVES])

    expect(screen.getByText('1 predstavenie')).toBeInTheDocument()
  })

  it('narrows the day to a chosen cinema, as the schedule does', () => {
    renderFilm([WAVES], { search: 'kino=kino-mladost' })

    expect(screen.getByText('Filtrom nič nevyhovuje')).toBeInTheDocument()
    expect(screen.queryByText('Kino Lumière')).not.toBeInTheDocument()
  })

  it('writes a filter into the URL, keeping the film and the day', () => {
    const replaceState = vi.spyOn(window.history, 'replaceState')

    renderFilm([WAVES], { date: DAYS[1], isDayNamed: true })
    fireEvent.click(screen.getByRole('button', { name: /Titulky/ }))
    fireEvent.click(screen.getByRole('checkbox', { name: 'Angličtina' }))

    expect(replaceState).toHaveBeenCalledWith(
      null,
      '',
      `/bratislava/filmy/${PUBLIC_ID}/2026-09-07?titulky=en`,
    )
  })

  it('carries the filters over into every day of the strip', () => {
    renderFilm([WAVES], { search: 'kino=kino-lumiere' })

    expect(screen.getByRole('link', { name: /Dnes/ })).toHaveAttribute(
      'href',
      `/bratislava/filmy/${PUBLIC_ID}/2026-09-05?kino=kino-lumiere`,
    )
  })

  it('says nothing is on where a day holds no showing of it', () => {
    renderFilm([])

    expect(screen.getByText('Na tento deň nič nehrá')).toBeInTheDocument()
  })
  // Each other city's page opens on that city's own first day, so the link names no day.
  it('names the other cities it plays in, each a link to its page there', () => {
    renderFilm([WAVES], { date: DAYS[1], isDayNamed: true, otherCities: ['kosice', 'nitra'] })

    expect(screen.getByText('Hrá aj v:')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Košice' })).toHaveAttribute(
      'href',
      `/kosice/filmy/${PUBLIC_ID}`,
    )
    expect(screen.getByRole('link', { name: 'Nitra' })).toHaveAttribute(
      'href',
      `/nitra/filmy/${PUBLIC_ID}`,
    )
  })

  it('says the film is not on in this city, and where it is instead', () => {
    renderFilm([], { days: [], otherCities: ['kosice'] })

    expect(screen.getByText('Tento film v Bratislave nehrá')).toBeInTheDocument()
    expect(screen.getByText('Hrá v:')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Košice' })).toBeInTheDocument()
  })
})
