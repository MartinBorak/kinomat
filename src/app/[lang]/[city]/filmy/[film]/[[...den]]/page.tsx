import { toQueryString } from 'kinomat-core/lib/hrefs'
import { DEFAULT_CITY } from 'kinomat-core/types/city'
import { isFilmAlias, isFilmPublicId } from 'kinomat-core/types/film'
import { notFound, redirect } from 'next/navigation'
import { Temporal } from 'temporal-polyfill'

import { readCity } from '@/lib/readCity'
import { readDaySegment } from '@/lib/readDaySegment'
import { readLanguage } from '@/lib/readLanguage'
import { readToday } from '@/lib/readToday'
import { FilmDetailPage } from '@/site/films/FilmDetailPage'
import { toFilmHref } from '@/site/films/hrefs'
import { formatFilmTitle } from '@/site/films/labels'
import { readFilmPublicIdByAlias, readPlayingFilm, readPlayingFilms } from '@/site/films/readFilms'
import { groupIntoProgrammes } from '@/site/program/groupScreenings'
import {
  readFilmCities,
  readFilmDays,
  readFilmScreeningsOnDay,
} from '@/site/program/readScreenings'
import { toListingGraph } from '@/site/seo/listingGraph'
import { toAlternates, toCityTitle } from '@/site/seo/site'
import { StructuredData } from '@/site/seo/StructuredData'

type FilmPageProps = PageProps<'/[lang]/[city]/filmy/[film]/[[...den]]'>

// The query as it came, so an alias link to a day or a filter lands on that day with that filter.
function toQuery(searchParams: Awaited<FilmPageProps['searchParams']>): string {
  return toQueryString(
    Object.entries(searchParams).flatMap(([key, value]) =>
      value === undefined ? [] : [value].flat().map((one) => [key, one]),
    ),
  )
}

/*
 * The film the segment names, or the redirect to it. A public id is the page itself; an alias is
 * a readable spelling of one, sent on to the page with the day and query it came with, since an alias may
 * be renamed and a saved link should keep working through the one name that cannot be. A segment
 * shaped like neither names no film, which is the same answer as a film nothing is playing: both
 * are a page that is not there. The lookups are cached, so asking twice is free.
 */
async function readFilm(props: FilmPageProps) {
  const { lang, city, film: segment, den } = await props.params

  if (isFilmPublicId(segment)) {
    const film = await readPlayingFilm(segment)

    if (film !== null) {
      return film
    }
  } else if (isFilmAlias(segment)) {
    const publicId = await readFilmPublicIdByAlias(segment)

    if (publicId !== null) {
      const day = readDaySegment(den)
      const date = day === undefined ? undefined : Temporal.PlainDate.from(day)

      redirect(
        `${toFilmHref(publicId, readLanguage(lang), readCity(city), date)}${toQuery(await props.searchParams)}`,
      )
    }
  }

  notFound()
}

// The language is in the URL, so there is no shell worth prerendering ahead of a reader's request.
export const instant = false

/*
 * Without a sample of its params Cache Components renders the route on every request. One playing
 * film is enough: every other page, and every named day, is cached on its first visit. Building them
 * all would have every build worker open its own pool against the database at once.
 */
export async function generateStaticParams() {
  const [film] = await readPlayingFilms()

  return [{ city: DEFAULT_CITY, film: film?.publicId ?? 'zatial-nic', den: [] }]
}

export async function generateMetadata(props: FilmPageProps) {
  const { lang, city } = await props.params
  const film = await readFilm(props)

  return {
    title: toCityTitle(formatFilmTitle(film, readLanguage(lang)), readCity(city)),
    alternates: toAlternates(`/${readCity(city)}/filmy/${film.publicId}`, readLanguage(lang)),
  }
}

export default async function Film(props: FilmPageProps) {
  const { lang, city: segment, den } = await props.params
  const language = readLanguage(lang)
  const city = readCity(segment)
  const film = await readFilm(props)
  const namedDay = readDaySegment(den)
  const today = await readToday()

  const days = await readFilmDays(film.filmId, city, today)
  // The strip offers only the days this film is on here, so one of those is where it opens.
  const date = namedDay ?? days[0] ?? today
  const programmes = groupIntoProgrammes(await readFilmScreeningsOnDay(film.filmId, city, date))
  // Where else it plays, so a reader whose city has none of it is told where to go instead.
  const otherCities = (await readFilmCities(film.filmId)).filter((other) => other !== city)

  return (
    <>
      <StructuredData data={toListingGraph(programmes, language)} />
      <FilmDetailPage
        language={language}
        city={city}
        otherCities={otherCities}
        publicId={film.publicId}
        date={date}
        isDayNamed={namedDay !== undefined}
        today={today}
        days={days}
        programmes={programmes}
      />
    </>
  )
}
