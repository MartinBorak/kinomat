import type { Metadata } from 'next'

import { readDaySegment } from '@/lib/readDaySegment'
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

/*
 * Without a sample of its params Cache Components renders the route on every request. The day-less
 * page is the sample; each named day is cached on its first visit.
 */
export function generateStaticParams() {
  return [{ den: [] }]
}

export async function generateMetadata(
  props: PageProps<'/[lang]/program/[[...den]]'>,
): Promise<Metadata> {
  const language = readLanguage((await props.params).lang)
  const copy = programCopyByLanguage[language]

  return {
    title: copy.pageTitle,
    description: copy.pageDescription,
    alternates: toAlternates('/program', language),
  }
}

export default async function Program(props: PageProps<'/[lang]/program/[[...den]]'>) {
  const { lang, den } = await props.params
  const language = readLanguage(lang)
  const namedDay = readDaySegment(den)
  const today = await readToday()
  const days = await readScheduledDays(today)
  /*
   * The strip offers only days something is still on, so the listing opens on one of those: by late
   * evening today is over, and opening on it would show a day the strip no longer offers.
   */
  const date = namedDay ?? days[0] ?? today
  const programmes = groupIntoProgrammes(await readScreeningsOnDay(date))

  return (
    <>
      <StructuredData data={toListingGraph(programmes, language)} />
      <ProgramPage
        language={language}
        date={date}
        isDayNamed={namedDay !== undefined}
        today={today}
        days={days}
        programmes={programmes}
      />
    </>
  )
}
