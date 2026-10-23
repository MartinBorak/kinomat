import { useSyncExternalStore } from 'react'

const MINUTE_MS = 60 * 1000

// Often enough that a showing leaves the listing within a minute of starting.
function subscribe(onChange: () => void): () => void {
  const timer = setInterval(onChange, MINUTE_MS / 4)

  return () => clearInterval(timer)
}

// The minute rather than the millisecond, so a render sees one value until the clock moves on.
function readMinute(): number {
  return Math.floor(Date.now() / MINUTE_MS)
}

// The cached page was rendered some time ago, so the server's answer is no time at all.
function readNoMinute(): null {
  return null
}

/*
 * The reader's clock, to the minute, from the moment the page is in the browser. Before then it is
 * null: the HTML was cached hours ago, and hydrating it against another time would not match it.
 */
export function useNow(): Date | null {
  const minute = useSyncExternalStore(subscribe, readMinute, readNoMinute)

  return minute === null ? null : new Date(minute * MINUTE_MS)
}
