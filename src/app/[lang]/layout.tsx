import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { LANGUAGES, type Language } from 'kinomat-core/lib/language'
import type { Metadata } from 'next'

import { readLanguage } from '@/lib/readLanguage'
import { SITE_ORIGIN } from '@/site/seo/site'
import { Document } from '@/site/ui/Document'
import { ScrollButtons } from '@/site/ui/ScrollButtons'

const DESCRIPTION_BY_LANGUAGE: Record<Language, string> = {
  sk: 'Program bratislavských kín na jednom mieste',
  en: 'Bratislava’s cinema showtimes in one place',
}

// The language is in the URL, so there is no shell worth prerendering ahead of a reader's request.
export const instant = false

// Cache Components want every root parameter named at build time; these are the only two there are.
export function generateStaticParams() {
  return LANGUAGES.map((lang) => ({ lang }))
}

export async function generateMetadata(props: LayoutProps<'/[lang]'>): Promise<Metadata> {
  const language = readLanguage((await props.params).lang)

  return {
    metadataBase: new URL(SITE_ORIGIN),
    title: { default: 'Kinomat', template: '%s | Kinomat' },
    description: DESCRIPTION_BY_LANGUAGE[language],
  }
}

// The site's root: the language segment above it is what every public page is written in.
export default async function SiteLayout(props: LayoutProps<'/[lang]'>) {
  const language = readLanguage((await props.params).lang)

  return (
    <Document lang={language}>
      {props.children}
      <ScrollButtons language={language} />
      <Analytics />
      <SpeedInsights />
    </Document>
  )
}
