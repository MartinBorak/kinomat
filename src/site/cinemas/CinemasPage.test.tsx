import { render, screen, within } from '@testing-library/react'
import { CINEMAS } from 'kinomat-core/types/cinema'
import { describe, expect, it } from 'vitest'

import { CinemasPage } from '@/site/cinemas/CinemasPage'

// The card one cinema stands in, since every card carries links saying the same words as the rest.
function cardOf(name: string) {
  const card = screen.getByRole('heading', { name }).closest('li')

  return within(card!)
}

describe('the cinemas view', () => {
  it('lists every cinema we aggregate', () => {
    render(<CinemasPage language="sk" />)

    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(CINEMAS.length)
    expect(screen.getByRole('heading', { name: 'Kino Lumière' })).toBeInTheDocument()
  })

  it('names them in the order Slovak alphabetizes them in', () => {
    render(<CinemasPage language="sk" />)

    const names = screen
      .getAllByRole('heading', { level: 2 })
      .map((heading) => heading.textContent ?? '')

    expect(names).toEqual([...names].sort((one, other) => one.localeCompare(other, 'sk')))
  })

  it('sends a cinema’s name to its own page here', () => {
    render(<CinemasPage language="sk" />)

    expect(screen.getByRole('link', { name: 'Kino Lumière' })).toHaveAttribute(
      'href',
      '/kina/kino-lumiere',
    )
  })

  it('links out to the page the cinema publishes for itself', () => {
    render(<CinemasPage language="sk" />)

    const site = cardOf('Kino Lumière').getByRole('link', { name: 'stránka kina' })

    expect(site).toHaveAttribute('href', 'https://www.kino-lumiere.sk/')
    expect(site).toHaveAttribute('rel', 'noopener')
  })

  it('puts the address on a map, named so the right entrance is found', () => {
    render(<CinemasPage language="sk" />)

    expect(cardOf('Kino Lumière').getByRole('link', { name: 'mapa' })).toHaveAttribute(
      'href',
      'https://www.google.com/maps/search/?api=1&query=Kino%20Lumi%C3%A8re%2C%20%C5%A0pit%C3%A1lska%204%2C%20Bratislava',
    )
  })

  it('shows where the cinema stands, in every language', () => {
    render(<CinemasPage language="en" />)

    expect(cardOf('Kino Lumière').getByText('Špitálska 4, Bratislava')).toBeInTheDocument()
    expect(cardOf('Kino Lumière').getByRole('link', { name: 'cinema site' })).toBeInTheDocument()
  })

  it('stays on the list when the language changes', () => {
    render(<CinemasPage language="sk" />)

    expect(screen.getByRole('link', { name: 'EN' })).toHaveAttribute('href', '/en/kina')
  })
})
