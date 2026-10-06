/*
 * TMDB serves posters at fixed widths. w500 is the smallest that still covers the card at twice the
 * pixel density, so the optimizer resizes down rather than up.
 */
export const TMDB_POSTER_URL = 'https://image.tmdb.org/t/p/w500'

// A whole address, which is what a person writes for a poster TMDB does not have.
const ABSOLUTE_URL_PATTERN = /^https?:\/\//iu

export function isExternalPoster(posterPath: string): boolean {
  return ABSOLUTE_URL_PATTERN.test(posterPath)
}

// Where the poster is: TMDB's file for a TMDB path, or exactly the address a person wrote down.
export function toPosterUrl(posterPath: string): string {
  return isExternalPoster(posterPath) ? posterPath : `${TMDB_POSTER_URL}${posterPath}`
}
