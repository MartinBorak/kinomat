import { type Language } from 'kinomat-core/lib/language'
import type { Metadata } from 'next'

import { readLanguage } from '@/lib/readLanguage'
import {
  type CountCopy,
  formatCount,
  formatDirectors,
  formatFilmMeta,
  formatFilmTitle,
} from '@/site/films/labels'
import { BrandMark } from '@/site/ui/BrandMark'
import { FilmPoster } from '@/site/ui/FilmPoster'

import { readReelDay } from './readReelDay'

/*
 * PROTOTYPE: the day's programme as the daily Instagram Reel films it. No cinema is named, only how
 * many play a film, so the feed favours none of them. Sized for a 432x768 viewport at 2.5x, which
 * is 1080x1920; the capture script in prototypes/instagram/d drives it.
 */
export const instant = false

export const metadata: Metadata = { robots: { index: false, follow: false } }

const SCREENINGS: Record<Language, CountCopy> = {
  sk: { one: 'premietanie', few: 'premietania', many: 'premietania', other: 'premietaní' },
  en: { one: 'screening', other: 'screenings' },
}
// Slovak counts its cinemas in the locative after "v": v 1 kine, v 3 kinách.
const IN_CINEMAS: Record<Language, { word: string; forms: CountCopy }> = {
  sk: { word: 'v', forms: { one: 'kine', other: 'kinách' } },
  en: { word: 'in', forms: { one: 'cinema', other: 'cinemas' } },
}

export default async function Reel(props: PageProps<'/[lang]/reel'>) {
  const { den } = await props.searchParams
  const language = readLanguage((await props.params).lang)
  const { isoDate, copy, programmes, weekday, dayAndMonth, filmCount } = await readReelDay(
    den,
    language,
  )

  return (
    <div
      data-reel-day={isoDate}
      className="bg-surface relative h-[768px] w-[432px] overflow-hidden"
    >
      <div id="reel-list" className="absolute top-0 right-0 left-0 will-change-transform">
        <div className="h-[230px]" />
        {programmes.map(({ programme, screenings }) => (
          <article
            key={programme.id}
            data-reel-card
            className="border-line grid grid-cols-[120px_minmax(0,1fr)] gap-x-4 border-b py-7 pr-[64px] pl-6"
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
              <p className="text-accent m-0 mt-2 text-[15px] font-normal">
                {formatCount(screenings, SCREENINGS[language], language)}{' '}
                {IN_CINEMAS[language].word}{' '}
                {formatCount(programme.cinemas.length, IN_CINEMAS[language].forms, language)}
              </p>
            </div>
          </article>
        ))}
        <div data-reel-card className="flex h-[768px] flex-col items-center justify-center gap-5">
          <BrandMark className="h-[44px] w-auto" />
          <p className="text-ink m-0 text-[22px] font-light tracking-[0.04em]">kinomat.sk</p>
        </div>
      </div>

      {/* Fixed over the scrolling list, below the 88 px Instagram keeps for its own header. */}
      <header className="bg-surface absolute top-0 right-0 left-0 h-[206px] px-6 pt-[92px]">
        <p className="text-accent m-0 text-[13px] tracking-[0.16em] uppercase">{weekday}</p>
        <p className="m-0 mt-1 text-[38px] leading-none font-light text-white">{dayAndMonth}</p>
        <p className="text-ink-faint m-0 mt-2.5 text-[12.5px] font-light tracking-[0.06em]">
          {filmCount} · kinomat.sk
        </p>
        {/* A short fade under the solid band, so a card slides under it rather than being cut. */}
        <div className="from-surface absolute top-full right-0 left-0 h-6 bg-gradient-to-b to-transparent" />
      </header>
    </div>
  )
}
