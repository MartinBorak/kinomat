import type { Metadata } from 'next'

import { readLanguage } from '@/lib/readLanguage'
import { AboutPage } from '@/site/about/AboutPage'
import { aboutCopyByLanguage } from '@/site/about/copy'
import { toAlternates } from '@/site/seo/site'

// The language is in the URL, so there is no shell worth prerendering ahead of a reader's request.
export const instant = false

export async function generateMetadata(props: PageProps<'/[lang]/o-kinomate'>): Promise<Metadata> {
  const language = readLanguage((await props.params).lang)
  const copy = aboutCopyByLanguage[language]

  return { title: copy.title, description: copy.pageDescription }
}

export default async function About(props: PageProps<'/[lang]/o-kinomate'>) {
  const language = readLanguage((await props.params).lang)

  return <AboutPage language={language} />
}
