'use client'

import { type Language, toHrefByLanguage } from 'kinomat-core/lib/language'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

import { toFilmsHref } from '@/site/films/hrefs'
import { copyByLanguage } from '@/site/landing/copy'
import { toHomeHref } from '@/site/landing/hrefs'
import { searchCopyByLanguage } from '@/site/search/copy'
import { SuggestionPanel } from '@/site/search/SuggestionPanel'
import {
  findSuggestionGroups,
  type SuggestedFilm,
  toLabelledSuggestions,
} from '@/site/search/suggestions'
import { SiteFooter } from '@/site/ui/SiteFooter'
import { SiteHeader } from '@/site/ui/SiteHeader'

/*
 * Eight rows and the field need 728px between the header and the footer. A window with that much
 * keeps the hero as it was; a shorter one has the hero give up its padding and some of its size,
 * which is the whole difference between reading the last suggestion and scrolling for it.
 */
const COMPACT_HERO =
  '[@media(max-height:820px)]:gap-[18px] md:[@media(max-height:820px)]:gap-5 md:[@media(max-height:820px)]:pt-6 md:[@media(max-height:820px)]:pb-8'
const COMPACT_TITLES = '[@media(max-height:820px)]:gap-2 md:[@media(max-height:820px)]:gap-2.5'
const COMPACT_HEADLINE =
  '[@media(max-height:820px)]:text-[27px] md:[@media(max-height:820px)]:text-[clamp(26px,3vw,36px)]'

type LandingPageProps = {
  films: readonly SuggestedFilm[]
  language: Language
}

/*
 * The language comes from the URL, as on every other page, and is not held in state: the router
 * keeps a page mounted, hidden, after leaving it, so state seeded on arrival would outlive the URL
 * that seeded it and greet a reader coming back in English in Slovak.
 */
export function LandingPage({ films, language }: LandingPageProps) {
  const [query, setQuery] = useState('')
  const searchInput = useRef<HTMLInputElement>(null)
  const pathname = usePathname()

  /*
   * A letter typed onto the page lands in the search, the page's one question - but the field does
   * not hold focus from the start, which would trap a keyboard reader in it. Focused on keydown,
   * the field is who the letter is delivered to. The router keeps a left page mounted, so the
   * listener leaves with the URL rather than with the page.
   */
  useEffect(() => {
    if (pathname !== toHomeHref(language)) {
      return
    }

    function focusSearchOnTyping(event: KeyboardEvent) {
      const isTyping =
        !event.defaultPrevented &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey &&
        event.key.length === 1
      const isElsewhere =
        event.target instanceof HTMLElement &&
        event.target.closest('input, textarea, select, [contenteditable]') !== null

      if (isTyping && !isElsewhere) {
        searchInput.current?.focus()
      }
    }

    document.addEventListener('keydown', focusSearchOnTyping)

    return () => document.removeEventListener('keydown', focusSearchOnTyping)
  }, [pathname, language])

  // The kept-mounted page would greet a returning reader with their last search; it leaves with the URL.
  useEffect(() => {
    if (pathname !== toHomeHref(language)) {
      return
    }

    return () => setQuery('')
  }, [pathname, language])

  const copy = copyByLanguage[language]
  const searchCopy = searchCopyByLanguage[language]
  const groups = findSuggestionGroups(toLabelledSuggestions(films, language), query)
  // What the panel being open means everywhere else on the page, the hero making room for it.
  const isOpen = groups.length > 0

  return (
    <div className="relative flex min-h-full flex-1 flex-col">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_45%_at_50%_-10%,oklch(0.86_0.08_245/0.15),transparent_68%)] md:bg-[radial-gradient(85%_55%_at_50%_-12%,oklch(0.86_0.08_245/0.15),transparent_68%)]"
      />

      <SiteHeader
        language={language}
        languageChange={{ hrefByLanguage: toHrefByLanguage(toHomeHref) }}
      />

      <main
        className={`relative flex flex-1 flex-col justify-center gap-[26px] px-[22px] pb-16 transition-all duration-[320ms] ease-[cubic-bezier(0.22,0.9,0.24,1)] md:items-center md:gap-[34px] md:px-[6vw] md:pt-[72px] md:pb-[88px] ${
          isOpen ? COMPACT_HERO : ''
        }`}
      >
        <div
          className={`flex flex-col gap-3.5 transition-all duration-[320ms] ease-[cubic-bezier(0.22,0.9,0.24,1)] md:items-center md:gap-5 ${
            isOpen ? COMPACT_TITLES : ''
          }`}
        >
          <p className="text-accent/85 text-[10px] font-light tracking-[0.3em] uppercase md:text-center md:text-[10.5px]">
            {copy.kicker}
          </p>
          <h1
            className={`animate-hum m-0 text-[38px] leading-[1.08] font-light tracking-[0.01em] text-pretty transition-[font-size] duration-[320ms] ease-[cubic-bezier(0.22,0.9,0.24,1)] [text-shadow:0_0_24px_oklch(0.85_0.09_245/0.4),0_0_70px_oklch(0.78_0.11_260/0.2)] md:text-center md:text-[clamp(34px,6vw,64px)] md:leading-[1.05] ${
              isOpen ? COMPACT_HEADLINE : ''
            }`}
          >
            {copy.headline}
          </h1>
        </div>

        <form
          action={toFilmsHref('', language)}
          // An empty search names nothing to look for, so the button does nothing rather than navigate.
          onSubmit={(event) => query.trim() === '' && event.preventDefault()}
          className="relative flex w-full flex-col gap-3 md:max-w-[660px] md:flex-row md:flex-wrap"
        >
          {/* The panel stands under the field rather than off the form, so it needs no room measured
              for the button beside it. */}
          <div className="relative min-w-0 md:flex-[3_1_280px]">
            <div className="bg-field border-accent/45 focus-within:border-accent/75 relative flex h-[60px] items-center gap-3.5 rounded-full border px-6 shadow-[0_0_20px_oklch(0.85_0.09_245/0.14)] transition-[border-color,box-shadow] duration-[240ms] focus-within:shadow-[0_0_34px_oklch(0.85_0.09_245/0.26)]">
              {/* A second glow rather than the field's own, so what breathes is an opacity. */}
              <div
                aria-hidden
                className="animate-breathe pointer-events-none absolute inset-0 rounded-full shadow-[0_0_36px_3px_oklch(0.85_0.09_245/0.34)]"
              />
              <input
                ref={searchInput}
                name="q"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={searchCopy.heroPlaceholder}
                aria-label={searchCopy.heroPlaceholder}
                spellCheck={false}
                autoComplete="off"
                className="min-w-0 flex-1 border-none bg-transparent text-base font-light text-white outline-none placeholder:text-[oklch(0.64_0.014_250)]"
              />
              {query !== '' && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="text-ink-faint hover:text-ink flex-none cursor-pointer px-1.5 py-1 text-[11px] tracking-[0.08em]"
                >
                  {searchCopy.clear}
                </button>
              )}
            </div>

            {/*
             * Opening it grows the form rather than hanging over the page, so the centred column
             * glides up to make room and every row stays on screen - eight of them being 445px that
             * a laptop has nowhere to put below a field standing at the middle of the window.
             */}
            <SuggestionPanel query={query} groups={groups} />
          </div>

          <button
            type="submit"
            className="bg-accent text-accent-ink h-[60px] flex-none cursor-pointer rounded-full border-none text-xs font-semibold tracking-[0.16em] uppercase shadow-[0_0_26px_oklch(0.85_0.09_245/0.4)] transition-shadow hover:shadow-[0_0_38px_oklch(0.85_0.09_245/0.6)] md:max-w-[180px] md:flex-[1_0_132px]"
          >
            {copy.search}
          </button>
        </form>
      </main>

      <SiteFooter language={language} />
    </div>
  )
}
