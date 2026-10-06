import { DEFAULT_LANGUAGE, isLanguage } from 'kinomat-core/lib/language'
import { type NextRequest, NextResponse } from 'next/server'

/*
 * Every public page lives under app/[lang], but the default language is written bare: /kina is
 * Slovak and /en/kina English. A bare path is rewritten to its /sk twin without the reader seeing
 * it, and the /sk spelling redirects to the bare one, so each page has exactly one URL.
 */
export function proxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl
  const [, first = ''] = pathname.split('/')

  // The reader should never see /sk: send them to the bare URL, which the last branch then serves.
  if (first === DEFAULT_LANGUAGE) {
    const bare = request.nextUrl.clone()
    bare.pathname = pathname.slice(first.length + 1) || '/'

    return NextResponse.redirect(bare, 308)
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
