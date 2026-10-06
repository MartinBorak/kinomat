import { SCHEDULE_TAG } from 'kinomat-core/lib/scheduleTag'
import { cacheTag } from 'next/cache'

// Called inside a cached read; nothing else has any use for it.
export function tagSchedule(): void {
  cacheTag(SCHEDULE_TAG)
}
