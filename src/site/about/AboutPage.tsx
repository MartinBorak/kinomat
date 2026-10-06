import { type Language, toHrefByLanguage } from 'kinomat-core/lib/language'
import { type ReactNode } from 'react'

import { aboutCopyByLanguage } from '@/site/about/copy'
import { toAboutHref } from '@/site/about/hrefs'
import { BrandMark } from '@/site/ui/BrandMark'
import { CONTACTS, toInstagramHref, toMailHref } from '@/site/ui/contacts'
import { OutboundLink } from '@/site/ui/OutboundLink'
import { SiteFooter } from '@/site/ui/SiteFooter'
import { SiteHeader } from '@/site/ui/SiteHeader'
import { SitePage } from '@/site/ui/SitePage'

const PROSE = 'text-ink-soft m-0 text-[15px] leading-[1.6] font-light'

// What this is, where its data comes from and what it keeps about a reader: one page, no fine print.
export function AboutPage({ language }: { language: Language }) {
  const copy = aboutCopyByLanguage[language]

  return (
    <SitePage>
      <SiteHeader
        current="o-kinomate"
        language={language}
        languageChange={{ hrefByLanguage: toHrefByLanguage(toAboutHref) }}
        hasSearch
      />

      <main className="relative flex flex-1 flex-col px-[22px] py-10 md:px-[6vw]">
        <article className="mx-auto flex w-full max-w-[64ch] flex-col gap-9">
          <header className="grid grid-cols-2 items-center gap-8">
            <div className="flex flex-col gap-3">
              <h1 className="m-0 text-[clamp(26px,3.2vw,34px)] leading-tight font-light tracking-[0.01em] text-white">
                {copy.title}
              </h1>
              <p className={PROSE}>{copy.lead}</p>
            </div>
            <BrandMark className="w-full max-w-[360px] justify-self-center" />
          </header>

          {copy.sections.map((section) => (
            <AboutSection key={section.title} title={section.title}>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph} className={PROSE}>
                  {paragraph}
                </p>
              ))}
            </AboutSection>
          ))}

          <AboutSection title={copy.contact}>
            <div className={`${PROSE} flex flex-wrap items-center gap-3`}>
              <a href={toMailHref()} className="hover:text-accent text-white">
                {CONTACTS.email}
              </a>
              <OutboundLink label="Instagram" href={toInstagramHref()} />
            </div>
          </AboutSection>
        </article>
      </main>

      <SiteFooter language={language} />
    </SitePage>
  )
}

// One part of the page under its small accent heading, prose or the contact row alike.
function AboutSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2.5">
      <h2 className="text-accent/85 m-0 text-[11px] font-light tracking-[0.24em] uppercase">
        {title}
      </h2>
      {children}
    </section>
  )
}
