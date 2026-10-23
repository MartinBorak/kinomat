import { notFound } from 'next/navigation'
import { Temporal } from 'temporal-polyfill'

// Written the one way a link writes it, so a day has one URL and one cache entry rather than several.
function isIsoDay(segment: string): boolean {
  try {
    return Temporal.PlainDate.from(segment).toString() === segment
  } catch {
    return false
  }
}

/*
 * The day a listing's URL names in its last segment: /program opens on the first day with something
 * on, /program/2026-10-24 on that one. Anything else in its place names no page, so a mistyped day is
 * a 404 rather than an entry of its own in the cache.
 */
export function readDaySegment(segments: string[] | undefined): string | undefined {
  if (segments === undefined) {
    return undefined
  }

  const [segment] = segments

  if (segments.length !== 1 || !isIsoDay(segment)) {
    notFound()
  }

  return segment
}
