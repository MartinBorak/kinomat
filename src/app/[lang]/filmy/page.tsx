import type { Metadata } from 'next'
import { connection } from 'next/server'

import { readLanguage } from '@/lib/readLanguage'
import { readToday } from '@/lib/readToday'
import { filmsCopyByLanguage } from '@/site/films/copy'
import { FilmsPage } from '@/site/films/FilmsPage'
import { readPlayingFilms } from '@/site/films/readFilms'
import { toAlternates } from '@/site/seo/site'

// The language is in the URL, so there is no shell worth prerendering ahead of a reader's request.
export const instant = false

export async function generateMetadata(props: PageProps<'/[lang]/filmy'>): Promise<Metadata> {
  const language = readLanguage((await props.params).lang)
  const copy = filmsCopyByLanguage[language]

  return {
    title: copy.pageTitle,
    description: copy.pageDescription,
    alternates: toAlternates('/filmy', language),
  }
}

export default async function Films(props: PageProps<'/[lang]/filmy'>) {
  /*
   * The query, order and genres live in the URL and are read in the browser, so no two readers see
   * one page. Stopping the prerender here is what the other views get from reading their day.
   */
  await connection()

  return (
    <FilmsPage
      language={readLanguage((await props.params).lang)}
      today={await readToday()}
      films={await readPlayingFilms()}
    />
  )
}
