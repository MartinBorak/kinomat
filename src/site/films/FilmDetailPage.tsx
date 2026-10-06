'use client'

import { type Language, toHrefByLanguage } from 'kinomat-core/lib/language'
import { useSearchParams } from 'next/navigation'
import { Temporal } from 'temporal-polyfill'

import { toFilmHref } from '@/site/films/hrefs'
import { formatCount } from '@/site/films/labels'
import { programCopyByLanguage } from '@/site/program/copy'
import { DateStrip } from '@/site/program/DateStrip'
import { DayListing } from '@/site/program/DayListing'
import { FilterBar } from '@/site/program/FilterBar'
import {
  applyFilters,
  deriveFilterOptions,
  parseFilters,
  type ProgramFilters,
} from '@/site/program/filters'
import { type ProgrammeListing } from '@/site/program/groupScreenings'
import { ProgrammeCard } from '@/site/program/ProgrammeCard'
import { EmptyState } from '@/site/ui/EmptyState'
import { SiteFooter } from '@/site/ui/SiteFooter'
import { SiteHeader } from '@/site/ui/SiteHeader'
import { SitePage } from '@/site/ui/SitePage'

// Days arrive as ISO strings, since a client component's props have to survive being serialized.
type FilmDetailPageProps = {
  language: Language
  publicId: string
  date: string
  today: string
  days: readonly string[]
  programmes: readonly ProgrammeListing[]
}

/*
 * The schedule as one film sees it: the same cards and the same filters, over a strip offering only
 * the days this film is on. There is no search, because the film is the whole question - and its
 * bill still arrives whole, so a double feature names the film it plays with.
 */
export function FilmDetailPage({
  language,
  publicId,
  date: isoDate,
  today: isoToday,
  days: isoDays,
  programmes,
}: FilmDetailPageProps) {
  // A query here would be one somebody else's link carried in: there is no field to type it in.
  const searchParams = useSearchParams()
  const filters = { ...parseFilters(searchParams), query: '' }

  const date = Temporal.PlainDate.from(isoDate)
  /*
   * The day only where the URL named one. A link off a day-less URL stays day-less, so it goes on
   * opening on the first day with something on rather than freezing today into it.
   */
  const requestedDate = searchParams.has('den') ? date : undefined
  const today = Temporal.PlainDate.from(isoToday)
  const days = isoDays.map((day) => Temporal.PlainDate.from(day))

  const copy = programCopyByLanguage[language]
  const options = deriveFilterOptions(programmes, copy, language)
  const listed = applyFilters(programmes, filters)
  const showingCount = listed
    .flatMap((programme) => programme.cinemas)
    .flatMap((cinema) => cinema.showings).length

  // Nothing here is stored, so a filter rewrites the URL it was read from rather than asking again.
  function changeFilters(next: ProgramFilters) {
    window.history.replaceState(null, '', toFilmHref(publicId, language, requestedDate, next))
  }

  // What is missing: the day itself, or only what the filters cut away.
  const empty =
    programmes.length === 0
      ? { title: copy.emptyTitle, hint: copy.emptyHint }
      : { title: copy.filteredEmptyTitle, hint: copy.filteredEmptyHint }

  return (
    <SitePage>
      <SiteHeader
        current="filmy"
        language={language}
        languageChange={{
          hrefByLanguage: toHrefByLanguage((next) =>
            toFilmHref(publicId, next, requestedDate, filters),
          ),
        }}
        hasSearch
      />

      <DateStrip
        days={days}
        selected={date}
        today={today}
        copy={copy}
        language={language}
        toHref={(day) => toFilmHref(publicId, language, day, filters)}
      />

      <FilterBar
        filters={filters}
        options={options}
        countLabel={formatCount(showingCount, copy.showings, language)}
        copy={copy}
        onChange={changeFilters}
      />

      <main className="relative flex flex-1 flex-col">
        <DayListing day={isoDate} name="film-listing">
          {listed.map((programme) => (
            <ProgrammeCard
              key={programme.id}
              programme={programme}
              copy={copy}
              language={language}
              isAboveFold
              currentFilmPublicId={publicId}
            />
          ))}

          {listed.length === 0 && <EmptyState title={empty.title} hint={empty.hint} />}
        </DayListing>
      </main>

      <SiteFooter language={language} />
    </SitePage>
  )
}
