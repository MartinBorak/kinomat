import { CITY_BY_ID, DEFAULT_CITY } from 'kinomat-core/types/city'

import { readCity } from '@/lib/readCity'
import { readLanguage } from '@/lib/readLanguage'
import { readSuggestedFilms } from '@/site/films/readFilms'
import { copyByLanguage } from '@/site/landing/copy'
import { LandingPage } from '@/site/landing/LandingPage'
import { toSiteGraph } from '@/site/seo/listingGraph'
import { toAlternates } from '@/site/seo/site'
import { StructuredData } from '@/site/seo/StructuredData'

// The language is in the URL, so there is no shell worth prerendering ahead of a reader's request.
export const instant = false

// Cache Components need a sample of the params; every other city is cached on its first visit.
export function generateStaticParams() {
  return [{ city: DEFAULT_CITY }]
}

export async function generateMetadata(props: PageProps<'/[lang]/[city]'>) {
  const language = readLanguage((await props.params).lang)
  const copy = copyByLanguage[language]

  return {
    // Whole already, the brand in it, so the template does not add it a second time.
    title: { absolute: copy.pageTitle },
    description: copy.pageDescription,
    // Served at the bare URL in every city; the proxy picks the reader's.
    alternates: toAlternates('/', language),
  }
}

export default async function Home(props: PageProps<'/[lang]/[city]'>) {
  const { lang, city: segment } = await props.params
  const language = readLanguage(lang)
  const city = readCity(segment)

  return (
    <>
      <StructuredData data={toSiteGraph(language)} />
      <LandingPage films={await readSuggestedFilms(city)} language={language} city={city} />
    </>
  )
}
