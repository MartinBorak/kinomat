import { parseDay } from 'kinomat-core/lib/time'
import { isFilmPublicId } from 'kinomat-core/types/film'
import { notFound } from 'next/navigation'

import { readLanguage } from '@/lib/readLanguage'
import { readToday } from '@/lib/readToday'
import { FilmDetailPage } from '@/site/films/FilmDetailPage'
import { formatFilmTitle } from '@/site/films/labels'
import { readPlayingFilm } from '@/site/films/readFilms'
import { groupIntoProgrammes } from '@/site/program/groupScreenings'
import { readFilmDays, readFilmScreeningsOnDay } from '@/site/program/readScreenings'
import { toListingGraph } from '@/site/seo/listingGraph'
import { toAlternates } from '@/site/seo/site'
import { StructuredData } from '@/site/seo/StructuredData'

/*
 * A segment shaped like no public id names no film, which is the same answer as a film nothing is
 * playing: both are a page that is not there. The lookup itself is cached, so asking twice is free.
 */
async function readFilm(segment: string) {
  const film = isFilmPublicId(segment) ? await readPlayingFilm(segment) : null

  if (film === null) {
    notFound()
  }

  return film
}

// The language is in the URL, so there is no shell worth prerendering ahead of a reader's request.
export const instant = false

export async function generateMetadata(props: PageProps<'/[lang]/filmy/[film]'>) {
  const { lang, film: segment } = await props.params
  const film = await readFilm(segment)

  return {
    title: formatFilmTitle(film, readLanguage(lang)),
    alternates: toAlternates(`/filmy/${film.publicId}`, readLanguage(lang)),
  }
}

export default async function Film(props: PageProps<'/[lang]/filmy/[film]'>) {
  const { den } = await props.searchParams
  const language = readLanguage((await props.params).lang)
  const film = await readFilm((await props.params).film)
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
