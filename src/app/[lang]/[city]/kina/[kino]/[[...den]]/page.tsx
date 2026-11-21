import { CINEMAS, findCinema } from 'kinomat-core/types/cinema'
import { notFound, permanentRedirect } from 'next/navigation'
import { Temporal } from 'temporal-polyfill'

import { readDaySegment } from '@/lib/readDaySegment'
import { readLanguage } from '@/lib/readLanguage'
import { readToday } from '@/lib/readToday'
import { CinemaDetailPage } from '@/site/cinemas/CinemaDetailPage'
import { toCinemaHref } from '@/site/cinemas/hrefs'
import { groupIntoProgrammes } from '@/site/program/groupScreenings'
import { readCinemaDays, readCinemaScreeningsOnDay } from '@/site/program/readScreenings'
import { toListingGraph } from '@/site/seo/listingGraph'
import { toAlternates, toCityTitle } from '@/site/seo/site'
import { StructuredData } from '@/site/seo/StructuredData'

type CinemaPageProps = PageProps<'/[lang]/[city]/kina/[kino]/[[...den]]'>

/*
 * The cinema the segment names, under its own city. A segment naming no cinema of ours is a page that
 * is not there; one filed under another city is sent to its own, since the cinema decides the city.
 */
async function readCinema(props: CinemaPageProps) {
  const { lang, city, kino, den } = await props.params
  const cinema = findCinema(kino)

  if (cinema === null) {
    notFound()
  }

  if (cinema.cityId !== city) {
    const day = readDaySegment(den)
    const date = day === undefined ? undefined : Temporal.PlainDate.from(day)

    permanentRedirect(toCinemaHref(cinema, readLanguage(lang), date))
  }

  return cinema
}

// The language is in the URL, so there is no shell worth prerendering ahead of a reader's request.
export const instant = false

/*
 * Without a sample of its params Cache Components renders the route on every request. One cinema
 * is enough: every other page, and every named day, is cached on its first visit. Building them all
 * would have every build worker open its own pool against the database at once.
 */
export function generateStaticParams() {
  return [{ city: CINEMAS[0].cityId, kino: CINEMAS[0].id, den: [] }]
}

export async function generateMetadata(props: CinemaPageProps) {
  const { lang } = await props.params
  const cinema = await readCinema(props)

  return {
    title: toCityTitle(cinema.name, cinema.cityId),
    alternates: toAlternates(`/${cinema.cityId}/kina/${cinema.id}`, readLanguage(lang)),
  }
}

export default async function CinemaDetail(props: CinemaPageProps) {
  const { lang, den } = await props.params
  const language = readLanguage(lang)
  const cinema = await readCinema(props)
  const namedDay = readDaySegment(den)
  const today = await readToday()

  const days = await readCinemaDays(cinema.id, today)
  // The strip offers only the days this cinema has something on, so one of those is where it opens.
  const date = namedDay ?? days[0] ?? today
  const programmes = groupIntoProgrammes(await readCinemaScreeningsOnDay(cinema.id, date))

  return (
    <>
      <StructuredData data={toListingGraph(programmes, language)} />
      <CinemaDetailPage
        language={language}
        cinema={cinema}
        date={date}
        isDayNamed={namedDay !== undefined}
        today={today}
        days={days}
        programmes={programmes}
      />
    </>
  )
}
