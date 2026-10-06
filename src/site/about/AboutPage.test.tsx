import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { AboutPage } from '@/site/about/AboutPage'

vi.mock('next/navigation', () => ({ useSearchParams: () => new URLSearchParams() }))

describe('the about page', () => {
  it('says where the data comes from and what is kept about a reader', () => {
    render(<AboutPage language="sk" />)

    expect(screen.getByRole('heading', { name: 'O Kinomate' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Odkiaľ je program' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Súkromie' })).toBeInTheDocument()
    // Once in the article and once in the footer: the page and the site both say how to reach us.
    expect(screen.getAllByRole('link', { name: 'info@kinomat.sk' })).toHaveLength(2)
  })

  it('keeps the reader’s language in the link that switches it', () => {
    render(<AboutPage language="en" />)

    expect(screen.getByRole('heading', { name: 'About Kinomat' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'SK' })).toHaveAttribute('href', '/o-kinomate')
  })
})
