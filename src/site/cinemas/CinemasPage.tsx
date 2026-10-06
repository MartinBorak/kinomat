import { type Language, toHrefByLanguage } from 'kinomat-core/lib/language'
import { CINEMAS, type Cinema } from 'kinomat-core/types/cinema'
import Link from 'next/link'

import { CinemaLinks } from '@/site/cinemas/CinemaLinks'
import { toCinemaHref, toCinemasHref } from '@/site/cinemas/hrefs'
import { SiteFooter } from '@/site/ui/SiteFooter'
import { SiteHeader } from '@/site/ui/SiteHeader'
import { SitePage } from '@/site/ui/SitePage'

/*
 * Every cinema we aggregate, named and no more: there is no poster to show one by, and what it is
 * playing is a question its own page answers. The registry is the whole list, so nothing is queried.
 */
export function CinemasPage({ language }: { language: Language }) {
  // Alphabetical the way Slovak alphabetizes, so Č and Ľ fall where a reader looks for them.
  const listed = [...CINEMAS].sort((one, other) => one.name.localeCompare(other.name, 'sk'))

  return (
    <SitePage>
      <SiteHeader
        current="kina"
        language={language}
        languageChange={{ hrefByLanguage: toHrefByLanguage(toCinemasHref) }}
        hasSearch
      />

      <main className="relative flex flex-1 flex-col px-[22px] py-8 md:px-[6vw]">
        {/* 340px holds the cinemas at four columns through 1920, where a smaller one strands the last. */}
        <ul className="m-0 grid w-full list-none grid-cols-[repeat(auto-fill,minmax(340px,1fr))] gap-4 p-0">
          {listed.map((cinema) => (
            <CinemaCard key={cinema.id} cinema={cinema} language={language} />
          ))}
        </ul>
      </main>

      <SiteFooter language={language} />
    </SitePage>
  )
}

// The name leads to our page for the cinema; the two links under it lead to the cinema itself.
function CinemaCard({ cinema, language }: { cinema: Cinema; language: Language }) {
  return (
    <li className="border-accent/22 bg-surface-raised hover:border-accent/60 group relative flex flex-col gap-3 rounded-2xl border p-5 transition-[border-color,box-shadow] hover:shadow-[0_0_26px_oklch(0.85_0.09_245/0.22)]">
      <h2 className="m-0 text-[17px] leading-snug font-light">
        {/* The link is stretched over the whole card, so the card is what a reader clicks. */}
        <Link
          href={toCinemaHref(cinema.id, language)}
          className="group-hover:text-accent text-white after:absolute after:inset-0"
        >
          {cinema.name}
        </Link>
      </h2>

      <p className="text-ink-muted m-0 flex-1 text-[12px] font-light">{cinema.address}</p>

      {/* Above the stretched link, or the card would swallow the clicks meant for the cinema. */}
      <CinemaLinks cinema={cinema} language={language} className="relative" />
    </li>
  )
}
