import { type Language } from 'kinomat-core/lib/language'
import { parseDay } from 'kinomat-core/lib/time'
import type { Metadata } from 'next'

import { readLanguage } from '@/lib/readLanguage'
import { readToday } from '@/lib/readToday'
import { groupIntoProgrammes } from '@/site/program/groupScreenings'
import { ProgramPage } from '@/site/program/ProgramPage'
import { readFestivalDays, readFestivalScreeningsOnDay } from '@/site/program/readScreenings'
import { toListingGraph } from '@/site/seo/listingGraph'
import { toAlternates } from '@/site/seo/site'
import { StructuredData } from '@/site/seo/StructuredData'

// Temporary: the BE2CAN festival, 14 to 21 October 2026. Remove with its navigation entry after.
const FESTIVAL = 'be2can'

const DESCRIPTION_BY_LANGUAGE: Record<Language, string> = {
  sk: 'Filmy festivalu BE2CAN a kde ich v Bratislave hrajú.',
  en: 'The BE2CAN festival films and where they play in Bratislava.',
}

// The language is in the URL, so there is no shell worth prerendering ahead of a reader's request.
export const instant = false

export async function generateMetadata(props: PageProps<'/[lang]/be2can'>): Promise<Metadata> {
  const language = readLanguage((await props.params).lang)

  return {
    title: 'BE2CAN',
    description: DESCRIPTION_BY_LANGUAGE[language],
    alternates: toAlternates('/be2can', language),
  }
}

export default async function Be2Can(props: PageProps<'/[lang]/be2can'>) {
  const { den } = await props.searchParams
  const language = readLanguage((await props.params).lang)
  const today = await readToday()
  const days = await readFestivalDays(FESTIVAL, today)
  const date = parseDay(den, days[0] ?? today)
  // A day the strip does not offer is outside the festival, where the same films are the usual run.
  const programmes = days.includes(date)
    ? groupIntoProgrammes(await readFestivalScreeningsOnDay(FESTIVAL, date))
    : []

  return (
    <>
      <StructuredData data={toListingGraph(programmes, language)} />
      <ProgramPage
        section="be2can"
        language={language}
        date={date}
        today={today}
        days={days}
        programmes={programmes}
      />
    </>
  )
}
