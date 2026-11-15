import { describe, expect, it } from 'vitest'

import { isExternalPoster, isOptimizablePoster, toPosterUrl } from '@/site/ui/posterUrl'

describe('toPosterUrl', () => {
  it('serves a TMDB path from TMDB at the card width', () => {
    expect(toPosterUrl('/kfUKP5IgzgLQyQD1MDt.jpg')).toBe(
      'https://image.tmdb.org/t/p/w500/kfUKP5IgzgLQyQD1MDt.jpg',
    )
  })

  // A poster TMDB does not have is one a person pointed at, and the address is used as written.
  it('leaves a whole address alone', () => {
    expect(toPosterUrl('https://example.org/posters/silentium.jpg')).toBe(
      'https://example.org/posters/silentium.jpg',
    )
  })
})

describe('isExternalPoster', () => {
  it('tells an address from a TMDB path', () => {
    expect(isExternalPoster('https://example.org/a.jpg')).toBe(true)
    expect(isExternalPoster('/a.jpg')).toBe(false)
  })
})

describe('isOptimizablePoster', () => {
  it('lets the optimizer fetch TMDB and the distributors it proxies', () => {
    expect(isOptimizablePoster('/a.jpg')).toBe(true)
    expect(
      isOptimizablePoster(
        'https://www.cinemart.sk/wp-content/uploads/2026/10/plag%C3%A1t_Odysea.jpg',
      ),
    ).toBe(true)
  })

  it('serves any other address as it is', () => {
    expect(isOptimizablePoster('https://example.org/a.jpg')).toBe(false)
  })
})
