import { toQueryString } from 'kinomat-core/lib/hrefs'
import { parseDay } from 'kinomat-core/lib/time'
import { isFilmAlias, isFilmPublicId } from 'kinomat-core/types/film'
import { notFound, redirect } from 'next/navigation'

import { readLanguage } from '@/lib/readLanguage'
import { readToday } from '@/lib/readToday'
import { FilmDetailPage } from '@/site/films/FilmDetailPage'
import { toFilmHref } from '@/site/films/hrefs'
import { formatFilmTitle } from '@/site/films/labels'
import { readFilmPublicIdByAlias, readPlayingFilm } from '@/site/films/readFilms'
import { groupIntoProgrammes } from '@/site/program/groupScreenings'
import { readFilmDays, readFilmScreeningsOnDay } from '@/site/program/readScreenings'
import { toListingGraph } from '@/site/seo/listingGraph'
import { toAlternates } from '@/site/seo/site'
import { StructuredData } from '@/site/seo/StructuredData'

type FilmPageProps = PageProps<'/[lang]/filmy/[film]'>

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
 * a readable spelling of one, sent on to the page with the query it came with, since an alias may
 * be renamed and a saved link should keep working through the one name that cannot be. A segment
 * shaped like neither names no film, which is the same answer as a film nothing is playing: both
 * are a page that is not there. The lookups are cached, so asking twice is free.
 */
async function readFilm(props: FilmPageProps) {
  const { lang, film: segment } = await props.params

  if (isFilmPublicId(segment)) {
    const film = await readPlayingFilm(segment)

    if (film !== null) {
      return film
    }
  } else if (isFilmAlias(segment)) {
    const publicId = await readFilmPublicIdByAlias(segment)

    if (publicId !== null) {
      redirect(`${toFilmHref(publicId, readLanguage(lang))}${toQuery(await props.searchParams)}`)
    }
  }

  notFound()
}

// The language is in the URL, so there is no shell worth prerendering ahead of a reader's request.
export const instant = false

export async function generateMetadata(props: FilmPageProps) {
  const { lang } = await props.params
  const film = await readFilm(props)

  return {
    title: formatFilmTitle(film, readLanguage(lang)),
    alternates: toAlternates(`/filmy/${film.publicId}`, readLanguage(lang)),
  }
}

export default async function Film(props: FilmPageProps) {
  const { den } = await props.searchParams
  const language = readLanguage((await props.params).lang)
  const film = await readFilm(props)
  const today = await readToday()

  const days = await readFilmDays(film.filmId, today)
  // The strip offers only the days this film is on, so one of those is where it opens.
  const date = parseDay(den, days[0] ?? today)
  const programmes = groupIntoProgrammes(await readFilmScreeningsOnDay(film.filmId, date))

  return (
    <>
      <StructuredData data={toListingGraph(programmes, language)} />
      <FilmDetailPage
        language={language}
        publicId={film.publicId}
        date={date}
        today={today}
        days={days}
        programmes={programmes}
      />
    </>
  )
}
