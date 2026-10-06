import { toCsfdHref, toImdbHref } from 'kinomat-core/lib/catalogueHrefs'
import { type Language } from 'kinomat-core/lib/language'
import Link from 'next/link'

import { toCinemaHref } from '@/site/cinemas/hrefs'
import { toFilmHref } from '@/site/films/hrefs'
import {
  formatDirectors,
  formatFilmMeta,
  formatFilmTitle,
  formatGenres,
  formatOriginalTitle,
} from '@/site/films/labels'
import { type ProgramCopy } from '@/site/program/copy'
import {
  type CinemaListing,
  type ListedFilm,
  type ProgrammeListing,
} from '@/site/program/groupScreenings'
import { ShowingCard } from '@/site/program/ShowingCard'
import { FilmPoster } from '@/site/ui/FilmPoster'
import { OutboundLink } from '@/site/ui/OutboundLink'

type ProgrammeCardProps = {
  programme: ProgrammeListing
  copy: ProgramCopy
  language: Language
  isAboveFold: boolean
  // A cinema's own page is that cinema throughout, so naming it on every card would only repeat it.
  namesCinemas?: boolean
  // The film whose page this is, which its own title and poster would only lead back to.
  currentFilmPublicId?: string
}

// Where the poster and the title lead, which for the film a page is about is nowhere.
function toFilmLink(film: ListedFilm, language: Language, currentFilmPublicId?: string) {
  return film.publicId === currentFilmPublicId ? null : toFilmHref(film.publicId, language)
}

// One film of the bill: what it is called, when it was made, and where it can be read about.
function FilmHeading({
  film,
  href,
  copy,
  language,
}: {
  film: ListedFilm
  href: string | null
  copy: ProgramCopy
  language: Language
}) {
  const facts = [
    { key: 'meta', text: formatFilmMeta(film, copy), tone: 'text-ink-faint' },
    { key: 'directors', text: formatDirectors(film, copy), tone: 'text-ink-muted' },
    { key: 'genres', text: formatGenres(film, language), tone: 'text-ink-faint' },
  ].filter(({ text }) => text !== '')
  const title = formatFilmTitle(film, language)
  const originalTitle = formatOriginalTitle(film, language)
  const named =
    href === null ? (
      title
    ) : (
      <Link href={href} className="hover:text-accent">
        {title}
      </Link>
    )

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-baseline gap-x-5 gap-y-2">
        <h2 className="m-0 text-[clamp(24px,3.2vw,34px)] leading-tight font-light tracking-[0.01em] text-white">
          {originalTitle === '' ? (
            named
          ) : (
            <>
              {/* Sized against the heading, so it stays a note beside a title that scales with the page. */}
              {named} <span className="text-ink-faint text-[0.55em]">({originalTitle})</span>
            </>
          )}
        </h2>
        {(film.imdbId !== null || film.csfdId !== null) && (
          <div className="flex items-center gap-2">
            {film.imdbId !== null && <OutboundLink label="IMDb" href={toImdbHref(film.imdbId)} />}
            {film.csfdId !== null && <OutboundLink label="ČSFD" href={toCsfdHref(film.csfdId)} />}
          </div>
        )}
      </div>

      {facts.length > 0 && (
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          {facts.map(({ key, text, tone }) => (
            <span key={key} className={`${tone} text-[13px] font-light`}>
              {text}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function CinemaRow({
  cinema,
  copy,
  language,
  isNamed,
}: {
  cinema: CinemaListing
  copy: ProgramCopy
  language: Language
  isNamed: boolean
}) {
  return (
    <div className="border-line flex flex-wrap items-start gap-x-6 gap-y-3 border-t py-3.5">
      {isNamed && (
        <div className="group relative flex-none basis-[210px]">
          <Link
            href={toCinemaHref(cinema.id, language)}
            className="text-ink hover:text-accent text-[14.5px]"
          >
            {cinema.name}
          </Link>
          <span className="sr-only">, {cinema.address}</span>
          <span
            aria-hidden
            className="border-accent/30 bg-surface-hover text-ink-soft pointer-events-none absolute top-full left-0 z-10 mt-1.5 hidden rounded-lg border px-[11px] py-1.5 text-[11.5px] font-light tracking-[0.06em] whitespace-nowrap shadow-[0_14px_30px_oklch(0.12_0.02_255/0.6)] group-hover:block"
          >
            {cinema.address}
          </span>
        </div>
      )}

      <div className="flex flex-1 basis-[320px] flex-wrap gap-2">
        {cinema.showings.map((showing) => (
          <ShowingCard key={showing.id} showing={showing} copy={copy} language={language} />
        ))}
      </div>
    </div>
  )
}

/*
 * The poster leads where the title beside it leads. It is kept from a screen reader rather than
 * labelled, since the heading's link already says the film's name and would say it twice.
 */
function PosterLink({
  film,
  href,
  isAboveFold,
}: {
  film: ListedFilm
  href: string | null
  isAboveFold: boolean
}) {
  const poster = (
    <FilmPoster
      posterPath={film.posterPath}
      isAboveFold={isAboveFold}
      sizeClassName="h-[180px] w-[120px] md:h-[270px] md:w-[180px]"
    />
  )

  return href === null || film.posterPath === null ? (
    poster
  ) : (
    <Link
      href={href}
      aria-hidden
      tabIndex={-1}
      className="flex rounded-[10px] transition-shadow hover:shadow-[0_0_26px_oklch(0.85_0.09_245/0.28)]"
    >
      {poster}
    </Link>
  )
}

// One bill and every cinema playing it that day. A double feature is one card, listing both films.
export function ProgrammeCard({
  programme,
  copy,
  language,
  isAboveFold,
  namesCinemas = true,
  currentFilmPublicId,
}: ProgrammeCardProps) {
  return (
    /*
     * A grid with the poster beside the title at every width. On a phone the cinemas take the full
     * width under the pair; on a wide screen they stay beside the poster column.
     */
    <article
      data-film-stop
      className="border-line grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-[22px] border-b px-[22px] py-8 md:grid-rows-[auto_1fr] md:gap-x-[30px] md:gap-y-[18px] md:px-[6vw] md:pt-[34px] md:pb-[38px]"
    >
      <div className="col-start-2 row-start-1 flex flex-col gap-2.5">
        {programme.films.map((film) => (
          <FilmHeading
            key={film.id}
            film={film}
            href={toFilmLink(film, language, currentFilmPublicId)}
            copy={copy}
            language={language}
          />
        ))}
      </div>

      {/* A poster each, so a double feature is seen to be two films rather than one long one. The
          column keeps its width when a film has none, so every card's titles start in one line. */}
      <div className="col-start-1 row-start-1 flex w-[120px] flex-col items-start gap-3 md:row-span-2 md:w-[180px]">
        {programme.films.map((film) => (
          <PosterLink
            key={film.id}
            film={film}
            href={toFilmLink(film, language, currentFilmPublicId)}
            isAboveFold={isAboveFold}
          />
        ))}
      </div>

      <div className="col-span-2 row-start-2 flex min-w-0 flex-col md:col-span-1 md:col-start-2">
        {programme.cinemas.map((cinema) => (
          <CinemaRow
            key={cinema.id}
            cinema={cinema}
            copy={copy}
            language={language}
            isNamed={namesCinemas}
          />
        ))}
      </div>
    </article>
  )
}
