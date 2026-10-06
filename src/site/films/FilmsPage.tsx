'use client'

import { type Language, toHrefByLanguage } from 'kinomat-core/lib/language'
import { useSearchParams } from 'next/navigation'
import { Temporal } from 'temporal-polyfill'

import { filmsCopyByLanguage } from '@/site/films/copy'
import { FilmCard } from '@/site/films/FilmCard'
import { type FilmRow } from '@/site/films/findFilms'
import { deriveGenreOptions, filterByGenre } from '@/site/films/genreFilter'
import { toFilmsHref } from '@/site/films/hrefs'
import { formatCount } from '@/site/films/labels'
import { matchFilms } from '@/site/films/matchFilms'
import { type Ordering, parseOrdering, sortFilms } from '@/site/films/ordering'
import { OrderingSelect } from '@/site/films/OrderingSelect'
import { filterCopyByLanguage } from '@/site/program/copy'
import { FilterBar } from '@/site/program/FilterBar'
import { NO_FILTERS, NO_OPTIONS, parseFilters, type ProgramFilters } from '@/site/program/filters'
import { SearchField } from '@/site/program/SearchField'
import { EmptyState } from '@/site/ui/EmptyState'
import { SiteFooter } from '@/site/ui/SiteFooter'
import { SiteHeader } from '@/site/ui/SiteHeader'
import { SitePage } from '@/site/ui/SitePage'

type FilmsPageProps = {
  language: Language
  today: string
  films: readonly FilmRow[]
}

/*
 * Every film currently playing, narrowed by what is typed. The whole list is here rather than
 * queried per keystroke: it is one poster grid of what is on, and the search only hides rows of it.
 */
export function FilmsPage({ language, today: isoToday, films }: FilmsPageProps) {
  const searchParams = useSearchParams()
  const query = searchParams.get('q') ?? ''
  const ordering = parseOrdering(searchParams.get('zoradenie'))
  const genres = parseFilters(searchParams).genres
  const today = Temporal.PlainDate.from(isoToday)
  const copy = filmsCopyByLanguage[language]
  // Off every film playing rather than off what is listed, so narrowing never empties the menu.
  const genreOptions = deriveGenreOptions(films, language)
  const listed = sortFilms(filterByGenre(matchFilms(films, query), genres), ordering, language)

  // The query, the order and the genre are in the URL rather than in state: a change rewrites it.
  function changeQuery(next: string) {
    window.history.replaceState(null, '', toFilmsHref(next, language, ordering, genres))
  }

  function changeOrdering(next: Ordering) {
    window.history.replaceState(null, '', toFilmsHref(query, language, next, genres))
  }

  // The bar hands back every dimension it knows; here that is the query beside the one menu shown.
  function changeFilters(next: ProgramFilters) {
    window.history.replaceState(null, '', toFilmsHref(next.query, language, ordering, next.genres))
  }

  const empty =
    films.length === 0
      ? { title: copy.emptyTitle, hint: copy.emptyHint }
      : { title: copy.noMatchTitle, hint: copy.noMatchHint }

  return (
    <SitePage>
      <SiteHeader
        current="filmy"
        language={language}
        languageChange={{
          hrefByLanguage: toHrefByLanguage((next) => toFilmsHref(query, next, ordering, genres)),
        }}
        hasSearch
      />

      {/* The schedule's own bar, wearing the one menu this view has a use for. */}
      <FilterBar
        filters={{ ...NO_FILTERS, query, genres }}
        options={{ ...NO_OPTIONS, genres: genreOptions }}
        countLabel={formatCount(listed.length, copy.films, language)}
        copy={filterCopyByLanguage[language]}
        onChange={changeFilters}
        dimensions={['genres']}
      >
        <SearchField query={query} language={language} onChange={changeQuery} />

        <OrderingSelect ordering={ordering} copy={copy} onChange={changeOrdering} />
      </FilterBar>

      <main className="relative flex flex-1 flex-col py-8">
        {/* Only the first row is on screen before a scroll; the rest of the posters can wait. */}
        {/* Fixed columns spread to both edges, so what a row cannot fill widens the gutters. */}
        {/* Two fluid columns on a phone, so no width falls to a single file of posters. */}
        <div className="grid grid-cols-2 justify-between gap-x-6 gap-y-9 px-[22px] md:grid-cols-[repeat(auto-fill,180px)] md:px-[6vw]">
          {listed.map((film, index) => (
            <FilmCard
              key={film.filmId}
              film={film}
              today={today}
              copy={copy}
              language={language}
              isAboveFold={index < 6}
            />
          ))}
        </div>

        {listed.length === 0 && <EmptyState title={empty.title} hint={empty.hint} />}
      </main>

      <SiteFooter language={language} />
    </SitePage>
  )
}
