import { parseDay } from 'kinomat-core/lib/time'
import { findCinema } from 'kinomat-core/types/cinema'
import { notFound } from 'next/navigation'

import { readLanguage } from '@/lib/readLanguage'
import { readToday } from '@/lib/readToday'
import { CinemaDetailPage } from '@/site/cinemas/CinemaDetailPage'
import { groupIntoProgrammes } from '@/site/program/groupScreenings'
import { readCinemaDays, readCinemaScreeningsOnDay } from '@/site/program/readScreenings'
import { toListingGraph } from '@/site/seo/listingGraph'
import { toAlternates } from '@/site/seo/site'
import { StructuredData } from '@/site/seo/StructuredData'

// A segment naming no cinema of ours is a page that is not there.
function readCinema(segment: string) {
  const cinema = findCinema(segment)

  if (cinema === null) {
    notFound()
  }

  return cinema
}

// The language is in the URL, so there is no shell worth prerendering ahead of a reader's request.
export const instant = false

export async function generateMetadata(props: PageProps<'/[lang]/kina/[kino]'>) {
  const { lang, kino } = await props.params
  const cinema = readCinema(kino)

  return {
    title: cinema.name,
    alternates: toAlternates(`/kina/${cinema.id}`, readLanguage(lang)),
  }
}

export default async function CinemaDetail(props: PageProps<'/[lang]/kina/[kino]'>) {
  const { den } = await props.searchParams
  const language = readLanguage((await props.params).lang)
  const cinema = readCinema((await props.params).kino)
  const today = await readToday()

  const days = await readCinemaDays(cinema.id, today)
  // The strip offers only the days this cinema has something on, so one of those is where it opens.
  const date = parseDay(den, days[0] ?? today)
  const programmes = groupIntoProgrammes(await readCinemaScreeningsOnDay(cinema.id, date))

  return (
    <>
      <StructuredData data={toListingGraph(programmes, language)} />
      <CinemaDetailPage
        language={language}
        cinema={cinema}
        date={date}
        today={today}
        days={days}
        programmes={programmes}
      />
    </>
  )
}
