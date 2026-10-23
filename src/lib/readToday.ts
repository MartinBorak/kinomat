import { getBratislavaToday } from 'kinomat-core/lib/time'

import { cacheUntilMidnight } from '@/lib/cacheUntilMidnight'
import { tagSchedule } from '@/lib/tagSchedule'

/*
 * Today, read once for everyone rather than per request. Reading the clock is what would otherwise
 * make every listing that anchors to it uncacheable, so the clock is read inside the cache instead.
 */
export async function readToday(): Promise<string> {
  'use cache'
  cacheUntilMidnight()
  tagSchedule()

  return getBratislavaToday().toString()
}
