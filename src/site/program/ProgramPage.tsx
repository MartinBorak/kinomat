'use client'

import { type Language, toHrefByLanguage } from 'kinomat-core/lib/language'
import { useSearchParams } from 'next/navigation'
import { Temporal } from 'temporal-polyfill'

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
  toProgramHref,
} from '@/site/program/filters'
import { type ProgrammeListing } from '@/site/program/groupScreenings'
import { ProgrammeCard } from '@/site/program/ProgrammeCard'
import { SearchField } from '@/site/program/SearchField'
import { EmptyState } from '@/site/ui/EmptyState'
import { SiteFooter } from '@/site/ui/SiteFooter'
import { SiteHeader } from '@/site/ui/SiteHeader'
import { SitePage } from '@/site/ui/SitePage'

/*
 * Days arrive as ISO strings because a client component's props have to survive being serialized,
 * and a Temporal.PlainDate does not. The server keeps the half of the URL it queries on - the day
 * and the language - and the filters are the half that never reaches the database.
 */
type ProgramPageProps = {
  language: Language
  date: string
  today: string
  days: readonly string[]
  programmes: readonly ProgrammeListing[]
}

export function ProgramPage({
  language,
  date: isoDate,
  today: isoToday,
  days: isoDays,
  programmes,
}: ProgramPageProps) {
  const searchParams = useSearchParams()
  const filters = parseFilters(searchParams)

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
  const filmCount = new Set(listed.flatMap((programme) => programme.films.map(({ id }) => id))).size
  const lastDay = days.at(-1)
  // A day past everything the cinemas have published is a different fact from a day with a gap in it.
  const isBeyondHorizon = lastDay !== undefined && Temporal.PlainDate.compare(date, lastDay) > 0

  // Nothing here is stored, so a filter rewrites the URL it was read from rather than asking again.
  function changeFilters(next: ProgramFilters) {
    window.history.replaceState(null, '', toProgramHref(requestedDate, language, next))
  }

  // What is missing: the day itself, the horizon it lies past, or only what the filters cut away.
  const empty =
    programmes.length === 0
      ? isBeyondHorizon
        ? { title: copy.beyondHorizonTitle, hint: copy.beyondHorizonHint }
        : { title: copy.emptyTitle, hint: copy.emptyHint }
      : { title: copy.filteredEmptyTitle, hint: copy.filteredEmptyHint }

  return (
    <SitePage>
      {/* The language is in the URL rather than in state, so the page a tab points at is read in it. */}
      <SiteHeader
        current="program"
        language={language}
        languageChange={{
          hrefByLanguage: toHrefByLanguage((next) => toProgramHref(requestedDate, next, filters)),
        }}
        hasSearch
      />

      <DateStrip
        days={days}
        selected={date}
        today={today}
        copy={copy}
        language={language}
        toHref={(day) => toProgramHref(day, language, filters)}
      />

      <FilterBar
        filters={filters}
        options={options}
        countLabel={formatCount(filmCount, copy.films, language)}
        copy={copy}
        onChange={changeFilters}
      >
        <SearchField
          query={filters.query}
          language={language}
          onChange={(query) => changeFilters({ ...filters, query })}
        />
      </FilterBar>

      <main className="relative flex flex-1 flex-col">
        <DayListing day={isoDate} name="program-listing">
          {/* Only the first card is on screen before a scroll; the rest of the posters can wait. */}
          {listed.map((programme, index) => (
            <ProgrammeCard
              key={programme.id}
              programme={programme}
              copy={copy}
              language={language}
              isAboveFold={index === 0}
            />
          ))}

          {listed.length === 0 && <EmptyState title={empty.title} hint={empty.hint} />}
        </DayListing>
      </main>

      <SiteFooter language={language} />
    </SitePage>
  )
}
