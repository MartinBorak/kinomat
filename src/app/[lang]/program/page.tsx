import { parseDay } from 'kinomat-core/lib/time'
import type { Metadata } from 'next'

import { readLanguage } from '@/lib/readLanguage'
import { readToday } from '@/lib/readToday'
import { programCopyByLanguage } from '@/site/program/copy'
import { groupIntoProgrammes } from '@/site/program/groupScreenings'
import { ProgramPage } from '@/site/program/ProgramPage'
import { readScheduledDays, readScreeningsOnDay } from '@/site/program/readScreenings'
import { toListingGraph } from '@/site/seo/listingGraph'
import { toAlternates } from '@/site/seo/site'
import { StructuredData } from '@/site/seo/StructuredData'

// The language is in the URL, so there is no shell worth prerendering ahead of a reader's request.
export const instant = false

export async function generateMetadata(props: PageProps<'/[lang]/program'>): Promise<Metadata> {
  const language = readLanguage((await props.params).lang)
  const copy = programCopyByLanguage[language]

  return {
    title: copy.pageTitle,
    description: copy.pageDescription,
    alternates: toAlternates('/program', language),
  }
}

export default async function Program(props: PageProps<'/[lang]/program'>) {
  const { den } = await props.searchParams
  const language = readLanguage((await props.params).lang)
  const today = await readToday()
  const days = await readScheduledDays(today)
  /*
   * The strip offers only days something is still on, so the listing opens on one of those: by late
   * evening today is over, and opening on it would show a day the strip no longer offers.
   */
  const date = parseDay(den, days[0] ?? today)
  const programmes = groupIntoProgrammes(await readScreeningsOnDay(date))

  return (
    <>
      <StructuredData data={toListingGraph(programmes, language)} />
      <ProgramPage
        language={language}
        date={date}
        today={today}
        days={days}
        programmes={programmes}
      />
    </>
  )
}
