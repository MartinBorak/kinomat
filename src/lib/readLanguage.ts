import { isLanguage, type Language } from 'kinomat-core/lib/language'
import { notFound } from 'next/navigation'

// A segment naming no language of ours is a page that is not there; the proxy never sends one.
export function readLanguage(segment: string): Language {
  if (!isLanguage(segment)) {
    notFound()
  }

  return segment
}
