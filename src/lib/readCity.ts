import { type CityId, isCityId } from 'kinomat-core/types/city'
import { notFound } from 'next/navigation'

// A segment naming no city of ours is a page that is not there.
export function readCity(segment: string): CityId {
  if (!isCityId(segment)) {
    notFound()
  }

  return segment
}
