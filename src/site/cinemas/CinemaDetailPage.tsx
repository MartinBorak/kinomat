'use client'

import { type Language, toHrefByLanguage } from 'kinomat-core/lib/language'
import { type Cinema } from 'kinomat-core/types/cinema'
import { useSearchParams } from 'next/navigation'
import { Temporal } from 'temporal-polyfill'

import { CinemaLinks } from '@/site/cinemas/CinemaLinks'
import { cinemasCopyByLanguage } from '@/site/cinemas/copy'
import { toCinemaHref } from '@/site/cinemas/hrefs'
import { formatCount } from '@/site/films/labels'
import { programCopyByLanguage } from '@/site/program/copy'
import { DateStrip } from '@/site/program/DateStrip'
import { DayListing } from '@/site/program/DayListing'
import { FilterBar } from '@/site/program/FilterBar'
import {
  applyFilters,
  deriveFilterOptions,
  DIMENSIONS,
  parseFilters,
  type ProgramFilters,
} from '@/site/program/filters'
import { type ProgrammeListing } from '@/site/program/groupScreenings'
import { ProgrammeCard } from '@/site/program/ProgrammeCard'
import { SearchField } from '@/site/program/SearchField'
import { EmptyState } from '@/site/ui/EmptyState'
import { SiteFooter } from '@/site/ui/SiteFooter'
import { SiteHeader } from '@/site/ui/SiteHeader'
import { SitePage } from '@/site/ui/SitePage'

// The cinema is settled by the page itself; what is left to choose is what a showing is like.
const SHOWING_DIMENSIONS = DIMENSIONS.filter((dimension) => dimension !== 'cinemas')

// Days arrive as ISO strings, since a client component's props have to survive being serialized.
type CinemaDetailPageProps = {
  language: Language
  cinema: Cinema
  date: string
  today: string
  days: readonly string[]
  programmes: readonly ProgrammeListing[]
}

/*
 * The schedule as one cinema sees it: the same cards over a strip offering only the days it has
 * something on. No cinema menu and no cinema names on the cards - both would say the same thing.
 */
export function CinemaDetailPage({
  language,
  cinema,
  date: isoDate,
  today: isoToday,
  days: isoDays,
  programmes,
}: CinemaDetailPageProps) {
  // A kino= here would be one somebody else's link carried in, and could only rule this cinema out.
  const searchParams = useSearchParams()
  const filters = { ...parseFilters(searchParams), cinemas: [] }

  const date = Temporal.PlainDate.from(isoDate)
  /*
   * The day only where the URL named one. A link off a day-less URL stays day-less, so it goes on
   * opening on the first day with something on rather than freezing today into it.
   */
  const requestedDate = searchParams.has('den') ? date : undefined
  const today = Temporal.PlainDate.from(isoToday)
  const days = isoDays.map((day) => Temporal.PlainDate.from(day))

  const copy = programCopyByLanguage[language]
  const cinemasCopy = cinemasCopyByLanguage[language]
  const options = deriveFilterOptions(programmes, copy, language)
  const listed = applyFilters(programmes, filters)
  const filmCount = new Set(listed.flatMap((programme) => programme.films.map(({ id }) => id))).size

  // Nothing here is stored, so a filter rewrites the URL it was read from rather than asking again.
  function changeFilters(next: ProgramFilters) {
    window.history.replaceState(null, '', toCinemaHref(cinema.id, language, requestedDate, next))
  }

  // What is missing: everything this cinema has, or only what the filters cut away.
  const empty =
    programmes.length === 0
      ? { title: cinemasCopy.emptyTitle, hint: cinemasCopy.emptyHint }
      : { title: copy.filteredEmptyTitle, hint: copy.filteredEmptyHint }

  return (
    <SitePage>
      <SiteHeader
        current="kina"
        language={language}
        languageChange={{
          hrefByLanguage: toHrefByLanguage((next) =>
            toCinemaHref(cinema.id, next, requestedDate, filters),
          ),
        }}
        hasSearch
      />

      <div className="border-line relative flex flex-wrap items-baseline gap-x-5 gap-y-2.5 border-b px-[22px] py-6 md:px-[6vw]">
        <h1 className="m-0 text-[clamp(24px,3.2vw,34px)] leading-tight font-light tracking-[0.01em] text-white">
          {cinema.name}
        </h1>
        <span className="text-accent/85 text-[11.5px] font-light tracking-[0.15em] uppercase">
          {cinema.address}
        </span>
        <CinemaLinks cinema={cinema} language={language} />
      </div>

      <DateStrip
        days={days}
        selected={date}
        today={today}
        copy={copy}
        language={language}
        toHref={(day) => toCinemaHref(cinema.id, language, day, filters)}
      />

      <FilterBar
        filters={filters}
        options={options}
        countLabel={formatCount(filmCount, copy.films, language)}
        copy={copy}
        onChange={changeFilters}
        dimensions={SHOWING_DIMENSIONS}
      >
        <SearchField
          query={filters.query}
          language={language}
          onChange={(query) => changeFilters({ ...filters, query })}
        />
      </FilterBar>

      <main className="relative flex flex-1 flex-col">
        <DayListing day={isoDate} name="cinema-listing">
          {/* Only the first card is on screen before a scroll; the rest of the posters can wait. */}
          {listed.map((programme, index) => (
            <ProgrammeCard
              key={programme.id}
              programme={programme}
              copy={copy}
              language={language}
              isAboveFold={index === 0}
              namesCinemas={false}
            />
          ))}

          {listed.length === 0 && <EmptyState title={empty.title} hint={empty.hint} />}
        </DayListing>
      </main>

      <SiteFooter language={language} />
    </SitePage>
  )
}
