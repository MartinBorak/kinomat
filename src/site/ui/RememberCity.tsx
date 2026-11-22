'use client'

import { type CityId } from 'kinomat-core/types/city'
import { useEffect } from 'react'

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
export function RememberCity({ city, isOnlyIfNone }: { city: CityId; isOnlyIfNone: boolean }) {
  useEffect(() => {
    const remembered = document.cookie
      .split('; ')
      .find((entry) => entry.startsWith(`${CITY_COOKIE}=`))
      ?.slice(CITY_COOKIE.length + 1)

    if (remembered === city || (isOnlyIfNone && remembered !== undefined)) {
      return
    }

    const secure = window.location.protocol === 'https:' ? '; Secure' : ''
    document.cookie = `${CITY_COOKIE}=${city}; Path=/; Max-Age=${CITY_COOKIE_MAX_AGE}; SameSite=Lax${secure}`
  }, [city, isOnlyIfNone])

  return null
}
