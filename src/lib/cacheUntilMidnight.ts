import { BRATISLAVA_TIME_ZONE } from 'kinomat-core/lib/time'
import { cacheLife } from 'next/cache'
import { Temporal } from 'temporal-polyfill'

// Under five minutes Next leaves an entry out of the prerender, so the last ones before midnight round up.
const SHORTEST_LIFETIME_SECONDS = 5 * 60

/*
 * A schedule changes in two ways: a publish, which clears it by tag, and midnight, which turns the
 * day over. A showing that starts in between is dropped in the browser rather than by rendering the
 * page again, so nothing else makes an entry stale, and a page is rendered about once a day.
 */
export function cacheUntilMidnight(): void {
  const now = Temporal.Now.zonedDateTimeISO(BRATISLAVA_TIME_ZONE)
  const midnight = now.toPlainDate().add({ days: 1 }).toZonedDateTime(BRATISLAVA_TIME_ZONE)
  const seconds = Math.max(
    Math.ceil(now.until(midnight).total('seconds')),
    SHORTEST_LIFETIME_SECONDS,
  )

  cacheLife({
    stale: SHORTEST_LIFETIME_SECONDS,
    revalidate: seconds,
    expire: seconds + SHORTEST_LIFETIME_SECONDS,
  })
}
