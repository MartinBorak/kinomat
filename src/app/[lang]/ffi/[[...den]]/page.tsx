import { type Language } from 'kinomat-core/lib/language'
import type { Metadata } from 'next'

import { readDaySegment } from '@/lib/readDaySegment'
import { readLanguage } from '@/lib/readLanguage'
import { readToday } from '@/lib/readToday'
import { groupIntoProgrammes, sortByFirstShowing } from '@/site/program/groupScreenings'
import { ProgramPage } from '@/site/program/ProgramPage'
import { readFestivalDays, readFestivalScreeningsOnDay } from '@/site/program/readScreenings'
import { toListingGraph } from '@/site/seo/listingGraph'
import { toAlternates } from '@/site/seo/site'
import { StructuredData } from '@/site/seo/StructuredData'

// Temporary: Filmový festival inakosti, 18 to 24 November 2026. Remove with its navigation entry after.
const FESTIVAL = 'ffi'

const TITLE_BY_LANGUAGE: Record<Language, string> = {
  sk: 'Filmový festival inakosti',
  en: 'Slovak queer film festival',
}

const DESCRIPTION_BY_LANGUAGE: Record<Language, string> = {
  sk: 'Filmy Filmového festivalu inakosti a kde ich v Bratislave hrajú.',
  en: 'The Queer Film Festival FFi films and where they play in Bratislava.',
}

// The language is in the URL, so there is no shell worth prerendering ahead of a reader's request.
export const instant = false

// As on /program: the day-less page is the sample, each named day is cached on its first visit.
export function generateStaticParams() {
  return [{ den: [] }]
}

export async function generateMetadata(
  props: PageProps<'/[lang]/ffi/[[...den]]'>,
): Promise<Metadata> {
  const language = readLanguage((await props.params).lang)

  return {
    title: TITLE_BY_LANGUAGE[language],
    description: DESCRIPTION_BY_LANGUAGE[language],
    alternates: toAlternates('/ffi', language),
  }
}

export default async function Ffi(props: PageProps<'/[lang]/ffi/[[...den]]'>) {
  const { lang, den } = await props.params
  const language = readLanguage(lang)
  const namedDay = readDaySegment(den)
  const today = await readToday()
  const days = await readFestivalDays(FESTIVAL, today)
  const date = namedDay ?? days[0] ?? today
  /*
   * A day the strip does not offer is outside the festival, where the same films are the usual run.
   * The festival's films are listed by when they play, not by title.
   */
  const programmes = days.includes(date)
    ? sortByFirstShowing(groupIntoProgrammes(await readFestivalScreeningsOnDay(FESTIVAL, date)))
    : []

  return (
    <>
      <StructuredData data={toListingGraph(programmes, language)} />
      <ProgramPage
        section="ffi"
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
