import { DEFAULT_LANGUAGE, isLanguage } from 'kinomat-core/lib/language'
import { type NextRequest, NextResponse } from 'next/server'

/*
 * Every public page lives under app/[lang], but the default language is written bare: /kina is
 * Slovak and /en/kina English. A bare path is rewritten to its /sk twin without the reader seeing
 * it, and the /sk spelling redirects to the bare one, so each page has exactly one URL.
 */
// The listings that take a day; the reel takes one too, but in its query, and is no page to link to.
const DAY_LISTING = /^(?:\/en)?\/(?:program|filmy\/[^/]+|kina\/[^/]+)\/?$/
const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/

/*
 * A day was once ?den= in the query, and links shared then still say so. It is the last segment of
 * the path now, which is what lets a day be cached as a page, so such a link moves there for good.
 * A day that is not one is dropped, which opens the listing where a day-less link would.
 */
function toDayPath(request: NextRequest): URL | null {
  const day = request.nextUrl.searchParams.get('den')

  if (day === null || !DAY_LISTING.test(request.nextUrl.pathname)) {
    return null
  }

  const moved = request.nextUrl.clone()
  moved.searchParams.delete('den')

  if (ISO_DAY.test(day)) {
    moved.pathname = `${moved.pathname.replace(/\/$/, '')}/${day}`
  }

  return moved
}

export function proxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl
  const [, first = ''] = pathname.split('/')

  // The reader should never see /sk: send them to the bare URL, which the last branch then serves.
  if (first === DEFAULT_LANGUAGE) {
    const bare = request.nextUrl.clone()
    bare.pathname = pathname.slice(first.length + 1) || '/'

    return NextResponse.redirect(bare, 308)
  }

  const dayPath = toDayPath(request)

  if (dayPath !== null) {
    return NextResponse.redirect(dayPath, 308)
  }

  // /en already names a page under app/[lang].
  if (isLanguage(first)) {
    return NextResponse.next()
  }

  // No page lives outside app/[lang], so the bare URL needs a language filled in behind the scenes.
  const prefixed = request.nextUrl.clone()
  prefixed.pathname = `/${DEFAULT_LANGUAGE}${pathname}`

  return NextResponse.rewrite(prefixed)
}

// The api, Next's own files and anything with an extension are not pages in a language.
export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)'],
}
