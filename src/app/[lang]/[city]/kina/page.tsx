import { CITY_BY_ID, DEFAULT_CITY } from 'kinomat-core/types/city'
import type { Metadata } from 'next'

import { readCity } from '@/lib/readCity'
import { readLanguage } from '@/lib/readLanguage'
import { CinemasPage } from '@/site/cinemas/CinemasPage'
import { cinemasCopyByLanguage } from '@/site/cinemas/copy'
import { toAlternates } from '@/site/seo/site'

// The language is in the URL, so there is no shell worth prerendering ahead of a reader's request.
export const instant = false

// Cache Components need a sample of the params; every other city is cached on its first visit.
export function generateStaticParams() {
  return [{ city: DEFAULT_CITY }]
}

export async function generateMetadata(props: PageProps<'/[lang]/[city]/kina'>): Promise<Metadata> {
  const { lang, city: segment } = await props.params
  const language = readLanguage(lang)
  const city = readCity(segment)
  const copy = cinemasCopyByLanguage[language]

  return {
    // The heading the page carries, which is also what a search for the page types.
    title: copy.heading(CITY_BY_ID[city]),
    description: copy.pageDescription(CITY_BY_ID[city]),
    alternates: toAlternates(`/${city}/kina`, language),
  }
}

export default async function Cinemas(props: PageProps<'/[lang]/[city]/kina'>) {
  const { lang, city } = await props.params

  return <CinemasPage language={readLanguage(lang)} city={readCity(city)} />
}
