import { DEFAULT_CITY } from 'kinomat-core/types/city'
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
  const { lang, city } = await props.params
  const language = readLanguage(lang)
  const copy = cinemasCopyByLanguage[language]

  return {
    title: copy.pageTitle,
    description: copy.pageDescription,
    alternates: toAlternates(`/${readCity(city)}/kina`, language),
  }
}

export default async function Cinemas(props: PageProps<'/[lang]/[city]/kina'>) {
  const { lang, city } = await props.params

  return <CinemasPage language={readLanguage(lang)} city={readCity(city)} />
}
