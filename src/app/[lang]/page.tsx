import { readLanguage } from '@/lib/readLanguage'
import { readPlayingFilms } from '@/site/films/readFilms'
import { copyByLanguage } from '@/site/landing/copy'
import { LandingPage } from '@/site/landing/LandingPage'
import { toSuggestedFilms } from '@/site/search/suggestions'
import { toAlternates } from '@/site/seo/site'

// The language is in the URL, so there is no shell worth prerendering ahead of a reader's request.
export const instant = false

export async function generateMetadata(props: PageProps<'/[lang]'>) {
  const language = readLanguage((await props.params).lang)

  return {
    description: copyByLanguage[language].pageDescription,
    alternates: toAlternates('/', language),
  }
}

export default async function Home(props: PageProps<'/[lang]'>) {
  const language = readLanguage((await props.params).lang)
  const films = await readPlayingFilms()

  return <LandingPage films={toSuggestedFilms(films)} language={language} />
}
