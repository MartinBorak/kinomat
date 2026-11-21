import { DEFAULT_CITY } from 'kinomat-core/types/city'

import { readCity } from '@/lib/readCity'
import { readLanguage } from '@/lib/readLanguage'
import { readSuggestedFilms } from '@/site/films/readFilms'
import { copyByLanguage } from '@/site/landing/copy'
import { LandingPage } from '@/site/landing/LandingPage'
import { toAlternates } from '@/site/seo/site'

// The language is in the URL, so there is no shell worth prerendering ahead of a reader's request.
export const instant = false

// Cache Components need a sample of the params; every other city is cached on its first visit.
export function generateStaticParams() {
  return [{ city: DEFAULT_CITY }]
}

export async function generateMetadata(props: PageProps<'/[lang]/[city]'>) {
  const { lang, city } = await props.params
  const language = readLanguage(lang)

  return {
    description: copyByLanguage[language].pageDescription,
    alternates: toAlternates(`/${readCity(city)}`, language),
  }
}

export default async function Home(props: PageProps<'/[lang]/[city]'>) {
  const { lang, city } = await props.params

  return (
    <LandingPage
      films={await readSuggestedFilms()}
      language={readLanguage(lang)}
      city={readCity(city)}
    />
  )
}
