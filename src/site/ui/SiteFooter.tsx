import { type Language } from 'kinomat-core/lib/language'
import Link from 'next/link'

import { aboutCopyByLanguage } from '@/site/about/copy'
import { toAboutHref } from '@/site/about/hrefs'
import { CONTACTS, toInstagramHref, toMailHref } from '@/site/ui/contacts'
import { TmdbAttribution } from '@/site/ui/TmdbAttribution'

// Drawn rather than downloaded: the glyph is a rounded square, a lens and a flash, in the text's colour.
function InstagramGlyph() {
  return (
    <svg
      aria-hidden
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
    </svg>
  )
}

type SiteFooterProps = {
  language: Language
}

// The one footer every page ends in: who made this, whose data it shows, and how to reach us.
export function SiteFooter({ language }: SiteFooterProps) {
  // On a phone the three sections stack with air between them; within one, rows sit tight.
  return (
    <footer className="border-line text-ink-faint relative flex flex-col items-center gap-4 border-t px-[22px] py-[18px] text-[10px] font-light tracking-[0.16em] uppercase md:flex-row md:justify-between md:px-[6vw] md:py-5">
      <div className="flex items-center gap-x-4">
        <span>© 2026 Kinomat</span>
        <Link href={toAboutHref(language)} className="hover:text-accent">
          {aboutCopyByLanguage[language].title}
        </Link>
      </div>
      {/* On every page, film or none: the site is the application TMDB's notice is about. */}
      <TmdbAttribution language={language} className="order-last md:order-none" />
      <div className="flex items-center gap-x-4">
        <a href={toMailHref()} className="hover:text-accent normal-case">
          {CONTACTS.email}
        </a>
        <a
          href={toInstagramHref()}
          target="_blank"
          rel="noopener"
          aria-label="Instagram"
          className="hover:text-accent flex"
        >
          <InstagramGlyph />
        </a>
      </div>
    </footer>
  )
}
