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
})
