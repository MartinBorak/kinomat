'use client'

import { type Language, LANGUAGES } from 'kinomat-core/lib/language'
import { type CityId } from 'kinomat-core/types/city'
import Link from 'next/link'
import { Fragment, useState } from 'react'

import { toHomeHref } from '@/site/landing/hrefs'
import { HeaderSearch } from '@/site/search/HeaderSearch'
import { BrandMark } from '@/site/ui/BrandMark'
import { CitySwitcher } from '@/site/ui/CitySwitcher'
import { type SiteSection, toSiteNavigation } from '@/site/ui/navigation'

/*
 * A page changes language by re-linking to itself. The links are handed over ready-made: a server
 * component can pass this header data, never a function.
 */
export type LanguageChange = { hrefByLanguage: Record<Language, string> }

type SiteHeaderProps = {
  language: Language
  // The city the page is in, or null for a page in none, whose links let the proxy pick the city.
  city: CityId | null
  languageChange: LanguageChange
  // The section this page belongs to, lit in the links; the landing page belongs to none.
  current?: SiteSection | null
  // The landing page carries no header search: its hero is the search.
  hasSearch?: boolean
}

const MENU_LABEL_BY_LANGUAGE: Record<Language, string> = {
  sk: 'Menu',
  en: 'Menu',
}

const LIT = 'text-accent'

function LanguageTab({
  language,
  isCurrent,
  change,
}: {
  language: Language
  isCurrent: boolean
  change: LanguageChange
}) {
  const label = language.toUpperCase()
  const className = `cursor-pointer ${isCurrent ? LIT : 'text-ink-faint hover:text-ink-soft'}`

  return (
    <Link href={change.hrefByLanguage[language]} className={className}>
      {label}
    </Link>
  )
}

// The bar every page wears: the mark, the sections, the language, and on a narrow screen a menu.
export function SiteHeader({
  language,
  city,
  languageChange,
  current = null,
  hasSearch = false,
}: SiteHeaderProps) {
  const navigation = toSiteNavigation(language, city, current)
  const menuLabel = MENU_LABEL_BY_LANGUAGE[language]
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <>
      <header className="border-line relative flex items-center justify-between gap-3 border-b px-[22px] py-4 md:gap-5 md:px-[6vw] md:py-[18px]">
        {/* The city stands under the wordmark until the bar has room for it beside the sections. */}
        <div className="flex flex-none flex-col items-start gap-1 xl:flex-row xl:items-center xl:gap-6">
          <Link
            href={toHomeHref(language, city)}
            className="flex flex-none items-center gap-3 md:gap-3.5"
          >
            <BrandMark />
            <span className="text-[19px] tracking-[0.16em] uppercase md:text-[22px]">Kinomat</span>
          </Link>

          {/* A page in no city, a film's or About, has no city to switch from. */}
          {city !== null && (
            <CitySwitcher
              language={language}
              city={city}
              current={current}
              className="pl-[46px] md:pl-[54px] xl:pl-0"
            />
          )}
        </div>

        {/* The rest takes the width the brand leaves, so the search grows into whatever is spare, and
            the height of the field whether or not it carries one - the bar is one bar on every page. */}
        <div className="flex min-w-0 flex-1 items-center justify-end gap-3 md:min-h-10 md:gap-7">
          {/* Below lg the sections leave no room for a field: there it waits inside the menu. */}
          {hasSearch && (
            // Keyed by city: the router keeps the header across cities, and its films are one city's.
            <HeaderSearch
              key={city}
              language={language}
              city={city}
              className="hidden min-w-[150px] flex-1 lg:block lg:max-w-[300px]"
              panelClassName="absolute top-full right-0 left-0 z-40 min-w-[320px]"
            />
          )}

          <nav
            aria-label={menuLabel}
            className="text-ink-soft hidden flex-none gap-[30px] text-[12.5px] font-light tracking-[0.14em] uppercase lg:flex"
          >
            {/* Filmy and Program are dynamic, so the default prefetch stops at their shell. */}
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                prefetch
                aria-current={item.isCurrent ? 'page' : undefined}
                className={item.isCurrent ? LIT : 'hover:text-accent'}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex flex-none items-center gap-2.5 text-[11px] tracking-[0.12em]">
            {LANGUAGES.map((tabLanguage, index) => (
              <Fragment key={tabLanguage}>
                {index > 0 && (
                  <span className="text-ink-faint opacity-40" aria-hidden>
                    /
                  </span>
                )}
                <LanguageTab
                  language={tabLanguage}
                  isCurrent={tabLanguage === language}
                  change={languageChange}
                />
              </Fragment>
            ))}
          </div>

          <button
            type="button"
            aria-label={menuLabel}
            aria-expanded={isMenuOpen}
            onClick={() => setIsMenuOpen((open) => !open)}
            className="-mr-3 flex size-11 flex-none cursor-pointer flex-col items-center justify-center gap-1 lg:hidden"
          >
            <span className="bg-ink-soft h-0.5 w-5 rounded-sm" />
            <span className="bg-ink-soft h-0.5 w-5 rounded-sm" />
          </button>
        </div>
      </header>

      {isMenuOpen && (
        <div className="border-line bg-surface-raised relative z-40 flex flex-col border-b lg:hidden">
          {hasSearch && (
            <div className="border-line border-b px-[22px] py-3.5">
              <HeaderSearch key={city} language={language} city={city} />
            </div>
          )}

          <nav aria-label={menuLabel} className="flex flex-col">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                prefetch
                aria-current={item.isCurrent ? 'page' : undefined}
                onClick={() => setIsMenuOpen(false)}
                className={`border-line border-b px-[22px] py-[15px] text-sm tracking-[0.14em] uppercase last:border-b-0 ${
                  item.isCurrent ? 'text-accent' : 'text-ink-soft'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </>
  )
}
