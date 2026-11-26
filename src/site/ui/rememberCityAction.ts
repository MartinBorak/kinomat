'use server'

import { isCityId } from 'kinomat-core/types/city'
import { cookies } from 'next/headers'

import { CITY_COOKIE, CITY_COOKIE_MAX_AGE } from '@/lib/rememberedCity'

/*
 * Remembers the reader's city, written by the server rather than by document.cookie for the
 * router's sake: the front page's URL names no city, so what the router holds for it is one city's,
 * and a cookie set by a server action is what tells the router to drop everything it holds. Anyone
 * can call this, so it writes only a city we cover.
 */
export async function rememberCity(city: string): Promise<void> {
  if (!isCityId(city)) {
    return
  }

  ;(await cookies()).set(CITY_COOKIE, city, {
    path: '/',
    maxAge: CITY_COOKIE_MAX_AGE,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  })
}
