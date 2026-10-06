import type { Metadata } from 'next'

import { readLanguage } from '@/lib/readLanguage'
import { CinemasPage } from '@/site/cinemas/CinemasPage'
import { cinemasCopyByLanguage } from '@/site/cinemas/copy'
import { toAlternates } from '@/site/seo/site'

// The language is in the URL, so there is no shell worth prerendering ahead of a reader's request.
export const instant = false

export async function generateMetadata(props: PageProps<'/[lang]/kina'>): Promise<Metadata> {
  const language = readLanguage((await props.params).lang)
  const copy = cinemasCopyByLanguage[language]

  return {
    title: copy.pageTitle,
    description: copy.pageDescription,
    alternates: toAlternates('/kina', language),
  }
}

export default async function Cinemas(props: PageProps<'/[lang]/kina'>) {
  const language = readLanguage((await props.params).lang)

  return <CinemasPage language={language} />
}
