import { formatTimeOfDay } from 'kinomat-core/lib/time'
import type { Metadata } from 'next'

import { readLanguage } from '@/lib/readLanguage'
import { formatDirectors, formatFilmMeta, formatFilmTitle } from '@/site/films/labels'
import { BrandMark } from '@/site/ui/BrandMark'
import { FilmPoster } from '@/site/ui/FilmPoster'

import { readReelDay } from '../readReelDay'

/*
 * PROTOTYPE: one festival day as an Instagram Story films it, the lineup in the order it plays
 * with every cinema and its times under each film. Unlike the daily Reel it names the cinemas: the
 * story is the festival's programme, and a programme says where. Same 432x768 frame at 2.5x;
 * scripts/captureReel.mts --view=be2can scrolls it. Temporary with the BE2CAN page it mirrors.
 */
export const instant = false

export const metadata: Metadata = { robots: { index: false, follow: false } }

const FESTIVAL = 'be2can'

export default async function Be2CanStory(props: PageProps<'/[lang]/reel/be2can'>) {
  const { den } = await props.searchParams
  const language = readLanguage((await props.params).lang)
  const { isoDate, copy, programmes, weekday, dayAndMonth, filmCount } = await readReelDay(
    den,
    language,
    FESTIVAL,
  )

  return (
    <div
      data-reel-day={isoDate}
      className="bg-surface relative h-[768px] w-[432px] overflow-hidden"
    >
      <div id="reel-list" className="absolute top-0 right-0 left-0 will-change-transform">
        <div className="h-[230px]" />
        {programmes.map(({ programme }) => (
          <article
            key={programme.id}
            data-reel-card
            className="border-line grid grid-cols-[120px_minmax(0,1fr)] gap-x-4 gap-y-5 border-b px-6 py-7"
          >
            <div className="flex flex-col gap-3">
              {programme.films.map((film) => (
                <FilmPoster
                  key={film.id}
                  posterPath={film.posterPath}
                  isAboveFold
                  sizeClassName="h-[180px] w-[120px]"
                />
              ))}
            </div>
            <div className="flex min-w-0 flex-col gap-2.5">
              {programme.films.map((film) => (
                <div key={film.id} className="flex flex-col gap-1">
                  <h2 className="m-0 text-[24px] leading-tight font-light tracking-[0.01em] text-white">
                    {formatFilmTitle(film, language)}
                  </h2>
                  <span className="text-ink-faint text-[13px] font-light">
                    {formatFilmMeta(film, copy)}
                  </span>
                  <span className="text-ink-muted text-[13px] font-light">
                    {formatDirectors(film, copy)}
                  </span>
                </div>
              ))}
            </div>
            {/* The cinemas under the pair, full width: a name and its times read as one line each. */}
            <ul className="col-span-2 m-0 flex list-none flex-col gap-2 p-0">
              {programme.cinemas.map((cinema) => (
                <li key={cinema.id} className="flex items-baseline justify-between gap-4">
                  <span className="text-ink min-w-0 truncate text-[15px] font-light">
                    {cinema.name}
                  </span>
                  <span className="text-accent flex-none text-[17px] tracking-[0.03em]">
                    {cinema.showings
                      .map((showing) => formatTimeOfDay(showing.startsAt))
                      .join(' · ')}
                  </span>
                </li>
              ))}
            </ul>
          </article>
        ))}
        <div data-reel-card className="flex h-[768px] flex-col items-center justify-center gap-5">
          <BrandMark className="h-[44px] w-auto" />
          <p className="text-ink m-0 text-[22px] font-light tracking-[0.04em]">kinomat.sk</p>
        </div>
      </div>

      {/* Fixed over the scrolling list, below the band Instagram keeps for its own header. */}
      <header className="bg-surface absolute top-0 right-0 left-0 h-[206px] px-6 pt-[92px]">
        <p className="text-accent m-0 text-[13px] tracking-[0.16em] uppercase">
          BE2CAN · {weekday}
        </p>
        <p className="m-0 mt-1 text-[38px] leading-none font-light text-white">{dayAndMonth}</p>
        <p className="text-ink-faint m-0 mt-2.5 text-[12.5px] font-light tracking-[0.06em]">
          {filmCount} · kinomat.sk/be2can
        </p>
        <div className="from-surface absolute top-full right-0 left-0 h-6 bg-gradient-to-b to-transparent" />
      </header>
    </div>
  )
}
