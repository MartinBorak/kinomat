import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { SiteFooter } from '@/site/ui/SiteFooter'

describe('the site footer', () => {
  it('says how to reach us, on Instagram and by mail', () => {
    render(<SiteFooter language="sk" />)

    expect(screen.getByRole('link', { name: 'Instagram' })).toHaveAttribute(
      'href',
      'https://www.instagram.com/kinomat.sk/',
    )
    expect(screen.getByRole('link', { name: 'info@kinomat.sk' })).toHaveAttribute(
      'href',
      'mailto:info@kinomat.sk',
    )
  })

  // The city menu is closed until opened, so this row is every page's link to the other cities.
  it('links every city’s schedule, in the reader’s language', () => {
    render(<SiteFooter language="en" />)

    expect(screen.getByRole('link', { name: 'Košice' })).toHaveAttribute(
      'href',
      '/en/kosice/program',
    )
    expect(
      screen.getByRole('navigation', { name: 'Showtimes' }).querySelectorAll('a'),
    ).toHaveLength(8)
  })
})
