import { CITY_BY_ID, DEFAULT_CITY } from 'kinomat-core/types/city'
import type { Metadata } from 'next'

import { readCity } from '@/lib/readCity'
import { readLanguage } from '@/lib/readLanguage'
import { readToday } from '@/lib/readToday'
import { filmsCopyByLanguage } from '@/site/films/copy'
import { FilmsPage } from '@/site/films/FilmsPage'
import { readCityFilms } from '@/site/films/readFilms'
import { toFilmListGraph } from '@/site/seo/listingGraph'
import { toAlternates } from '@/site/seo/site'
import { StructuredData } from '@/site/seo/StructuredData'

// The language is in the URL, so there is no shell worth prerendering ahead of a reader's request.
export const instant = false

// Cache Components need a sample of the params; every other city is cached on its first visit.
export function generateStaticParams() {
  return [{ city: DEFAULT_CITY }]
}

export async function generateMetadata(
  props: PageProps<'/[lang]/[city]/filmy'>,
): Promise<Metadata> {
  const { lang, city: segment } = await props.params
  const language = readLanguage(lang)
  const city = readCity(segment)
  const copy = filmsCopyByLanguage[language]

  return {
    // The heading the page carries, which is also what a search for the page types.
    title: copy.heading(CITY_BY_ID[city]),
    description: copy.pageDescription(CITY_BY_ID[city]),
    alternates: toAlternates(`/${city}/filmy`, language),
  }
}

export default async function Films(props: PageProps<'/[lang]/[city]/filmy'>) {
  const { lang, city: segment } = await props.params
  const language = readLanguage(lang)
  const city = readCity(segment)

  const films = await readCityFilms(city)

  return (
    <>
      <StructuredData data={toFilmListGraph(films, language, city)} />
      <FilmsPage language={language} city={city} today={await readToday()} films={films} />
    </>
  )
}
