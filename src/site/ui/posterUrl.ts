import { DISTRIBUTOR_POSTER_PREFIXES } from '@/site/ui/posterHosts'

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

// Whether the optimizer may fetch it: TMDB's, or a distributor's it is allowed to proxy.
export function isOptimizablePoster(posterPath: string): boolean {
  return (
    !isExternalPoster(posterPath) ||
    DISTRIBUTOR_POSTER_PREFIXES.some((prefix) => posterPath.startsWith(prefix))
  )
}

// Where the poster is: TMDB's file for a TMDB path, or exactly the address a person wrote down.
export function toPosterUrl(posterPath: string): string {
  return isExternalPoster(posterPath) ? posterPath : `${TMDB_POSTER_URL}${posterPath}`
}
