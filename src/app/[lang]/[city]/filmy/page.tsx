import { CITY_BY_ID, DEFAULT_CITY } from 'kinomat-core/types/city'
import type { Metadata } from 'next'
import { connection } from 'next/server'

import { readCity } from '@/lib/readCity'
import { readLanguage } from '@/lib/readLanguage'
import { readToday } from '@/lib/readToday'
import { filmsCopyByLanguage } from '@/site/films/copy'
import { FilmsPage } from '@/site/films/FilmsPage'
import { readCityFilms } from '@/site/films/readFilms'
import { toAlternates, toCityTitle } from '@/site/seo/site'

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
    title: toCityTitle(copy.pageTitle, city),
    description: copy.pageDescription(CITY_BY_ID[city]),
    alternates: toAlternates(`/${city}/filmy`, language),
  }
}

export default async function Films(props: PageProps<'/[lang]/[city]/filmy'>) {
  const { lang, city: segment } = await props.params
  const city = readCity(segment)

  /*
   * The query, order and genres live in the URL and are read in the browser, so no two readers see
   * one page. Stopping the prerender here is what the other views get from reading their day.
   */
  await connection()

  return (
    <FilmsPage
      language={readLanguage(lang)}
      city={city}
      today={await readToday()}
      films={await readCityFilms(city)}
    />
  )
}
