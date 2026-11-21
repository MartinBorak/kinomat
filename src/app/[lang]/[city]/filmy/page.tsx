import { DEFAULT_CITY } from 'kinomat-core/types/city'
import type { Metadata } from 'next'
import { connection } from 'next/server'

import { readCity } from '@/lib/readCity'
import { readLanguage } from '@/lib/readLanguage'
import { readToday } from '@/lib/readToday'
import { filmsCopyByLanguage } from '@/site/films/copy'
import { FilmsPage } from '@/site/films/FilmsPage'
import { readPlayingFilms } from '@/site/films/readFilms'
import { toAlternates } from '@/site/seo/site'

// The language is in the URL, so there is no shell worth prerendering ahead of a reader's request.
export const instant = false

// Cache Components need a sample of the params; every other city is cached on its first visit.
export function generateStaticParams() {
  return [{ city: DEFAULT_CITY }]
}

export async function generateMetadata(
  props: PageProps<'/[lang]/[city]/filmy'>,
): Promise<Metadata> {
  const { lang, city } = await props.params
  const language = readLanguage(lang)
  const copy = filmsCopyByLanguage[language]

  return {
    title: copy.pageTitle,
    description: copy.pageDescription,
    alternates: toAlternates(`/${readCity(city)}/filmy`, language),
  }
}

export default async function Films(props: PageProps<'/[lang]/[city]/filmy'>) {
  const { lang, city } = await props.params

  /*
   * The query, order and genres live in the URL and are read in the browser, so no two readers see
   * one page. Stopping the prerender here is what the other views get from reading their day.
   */
  await connection()

  return (
    <FilmsPage
      language={readLanguage(lang)}
      city={readCity(city)}
      today={await readToday()}
      films={await readPlayingFilms()}
    />
  )
}
