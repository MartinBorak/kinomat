'use client'

import { type CityId, isCityId } from 'kinomat-core/types/city'
import { useEffect, useSyncExternalStore } from 'react'

import { CITY_COOKIE, CITY_COOKIE_MAX_AGE } from '@/lib/rememberedCity'

/*
 * Remembers the city of the page the reader is on, so a link without one, or the front page, brings
 * them back to it. Written here, once the page is in front of the reader, not by the proxy: the
 * proxy also answers the router's prefetches, and a header link to another city merely in view
 * would move the reader there.
 *
 * A film's page in another city is a look at where else it plays, or a link a friend sent, not a
 * move: it keeps a city already remembered, and names one only for a reader who had none.
 */
function readCookie(): string | undefined {
  return document.cookie
    .split('; ')
    .find((entry) => entry.startsWith(`${CITY_COOKIE}=`))
    ?.slice(CITY_COOKIE.length + 1)
}

// Nothing announces a cookie's change, and only this page writes it, so there is nothing to watch.
function subscribe(): () => void {
  return () => {}
}

/*
 * The city the reader has remembered: undefined until the page is in the browser, since the server
 * renders one page for every reader, and null for a reader who has none yet.
 */
export function useRememberedCity(): CityId | null | undefined {
  const value = useSyncExternalStore(
    subscribe,
    () => readCookie() ?? '',
    () => undefined,
  )

  if (value === undefined) {
    return undefined
  }

  return isCityId(value) ? value : null
}

export function RememberCity({ city, isOnlyIfNone }: { city: CityId; isOnlyIfNone: boolean }) {
  useEffect(() => {
    const remembered = readCookie()

    if (remembered === city || (isOnlyIfNone && remembered !== undefined)) {
      return
    }

    const secure = window.location.protocol === 'https:' ? '; Secure' : ''
    document.cookie = `${CITY_COOKIE}=${city}; Path=/; Max-Age=${CITY_COOKIE_MAX_AGE}; SameSite=Lax${secure}`
  }, [city, isOnlyIfNone])

  return null
}
