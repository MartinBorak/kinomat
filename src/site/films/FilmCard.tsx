import { type Language } from 'kinomat-core/lib/language'
import Link from 'next/link'
import { type Temporal } from 'temporal-polyfill'

import { type FilmsCopy } from '@/site/films/copy'
import { type FilmRow } from '@/site/films/findFilms'
import { toFilmHref } from '@/site/films/hrefs'
import {
  formatCount,
  formatDirectors,
  formatFilmMeta,
  formatFilmTitle,
  formatGenres,
  formatNextShowing,
  formatOriginalTitle,
} from '@/site/films/labels'
import { FilmPoster } from '@/site/ui/FilmPoster'

type FilmCardProps = {
  film: FilmRow
  today: Temporal.PlainDate
  copy: FilmsCopy
  language: Language
  isAboveFold: boolean
}

// Where a poster would be, so a film without one still fills its place in the row.
function PosterPlaceholder({ title }: { title: string }) {
  return (
    <div className="border-line text-ink-faint grid aspect-[2/3] w-full flex-none place-items-center rounded-[10px] border px-4 text-center text-[13px] font-light md:aspect-auto md:h-[270px] md:w-[180px]">
      {title}
    </div>
  )
}

// One film in the index: what it is, when it can next be seen, and in how many cinemas.
export function FilmCard({ film, today, copy, language, isAboveFold }: FilmCardProps) {
  const title = formatFilmTitle(film, language)
  const originalTitle = formatOriginalTitle(film, language)
  const meta = formatFilmMeta(film, copy)
  const genres = formatGenres(film, language)
  const directors = formatDirectors(film, copy)

  return (
    <Link
      href={toFilmHref(film.publicId, language)}
      data-film-stop
      className="group flex w-full flex-none flex-col gap-2.5 md:w-[180px]"
    >
      <div className="rounded-[10px] transition-shadow group-hover:shadow-[0_0_26px_oklch(0.85_0.09_245/0.28)]">
        {film.posterPath === null ? (
          <PosterPlaceholder title={title} />
        ) : (
          <FilmPoster
            posterPath={film.posterPath}
            isAboveFold={isAboveFold}
            sizeClassName="aspect-[2/3] h-auto w-full md:aspect-auto md:h-[270px] md:w-[180px]"
          />
        )}
      </div>

      <div className="flex flex-col gap-1">
        <h2 className="group-hover:text-accent m-0 text-[15px] leading-snug font-light text-white">
          {originalTitle === '' ? (
            title
          ) : (
            <>
              {/* A line of its own: the column is one poster wide, so two titles do not share one. */}
              {title} <span className="text-ink-faint block text-[13px]">({originalTitle})</span>
            </>
          )}
        </h2>
        {meta !== '' && (
          <span className="text-ink-faint text-[11px] font-light tracking-[0.12em] uppercase">
            {meta}
          </span>
        )}
        {genres !== '' && <span className="text-ink-faint text-[11.5px] font-light">{genres}</span>}
        {directors !== '' && (
          <span className="text-ink-muted text-[11.5px] font-light">{directors}</span>
        )}
        <span className="text-accent/85 text-[11.5px] font-light">
          {formatNextShowing(film.nextStartsAt, today, copy, language)}
        </span>
        <span className="text-ink-muted text-[11.5px] font-light">
          {formatCount(film.cinemaIds.length, copy.cinemas, language)}
        </span>
      </div>
    </Link>
  )
}
