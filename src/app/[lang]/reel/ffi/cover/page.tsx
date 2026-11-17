import { type Language } from 'kinomat-core/lib/language'
import type { Metadata } from 'next'

import { readLanguage } from '@/lib/readLanguage'
import { type CountCopy, formatCount } from '@/site/films/labels'
import { BrandMark } from '@/site/ui/BrandMark'

import { readReelDay } from '../../readReelDay'

/*
 * PROTOTYPE: the festival Story's cover, 432x768 at 2.5x like the Story. The festival's own look:
 * its 2026 key visual (public/reel/ffi/, from ffi.sk) blurred behind its circle mark, darkened in
 * the middle so the day reads. Everything sits inside 168-600 px, the middle square a feed crops a
 * cover to. Temporary with the FFi page; the images go with it.
 */
export const instant = false

export const metadata: Metadata = { robots: { index: false, follow: false } }

const FESTIVAL = 'ffi'

const NAME_BY_LANGUAGE: Record<Language, string> = {
  sk: 'Filmový festival inakosti',
  en: 'Slovak Queer Film Festival',
}

// Slovak counts its cinemas in the locative after "v": v 1 kine, v 3 kinách.
const IN_CINEMAS: Record<Language, { word: string; forms: CountCopy }> = {
  sk: { word: 'v', forms: { one: 'kine', other: 'kinách' } },
  en: { word: 'in', forms: { one: 'cinema', other: 'cinemas' } },
}

export default async function FfiStoryCover(props: PageProps<'/[lang]/reel/ffi/cover'>) {
  const { den } = await props.searchParams
  const language = readLanguage((await props.params).lang)
  const { isoDate, programmes, weekday, dayAndMonth, filmCount } = await readReelDay(
    den,
    language,
    FESTIVAL,
  )
  const cinemaCount = new Set(
    programmes.flatMap(({ programme }) => programme.cinemas.map((cinema) => cinema.id)),
  ).size

  return (
    <div
      data-reel-day={isoDate}
      className="relative flex h-[768px] w-[432px] flex-col items-center justify-center overflow-hidden bg-[#2a0612]"
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- a filmed frame, not a served page */}
      <img
        src="/reel/ffi/key-visual.jpg"
        alt=""
        className="absolute inset-0 h-full w-full scale-110 object-cover object-[46%_50%] blur-[3px]"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(75%_42%_at_50%_50%,rgb(24_4_12/0.78),rgb(24_4_12/0.25)_70%,transparent)]"
      />
      <div className="relative flex flex-col items-center gap-3 text-center">
        {/* The mark's letters are cut out of its circle; a white disc behind shows them white. */}
        <div className="relative mb-2 h-[104px]">
          <div
            aria-hidden
            className="absolute top-[5px] left-[5px] h-[86px] w-[86px] rounded-full bg-white"
          />
          {/* eslint-disable-next-line @next/next/no-img-element -- a filmed frame, not a served page */}
          <img src="/reel/ffi/mark.png" alt="FFi" className="relative h-[104px] w-auto" />
        </div>
        <p className="m-0 mb-4 text-[13px] tracking-[0.22em] text-[#ff9a6b] uppercase">
          {NAME_BY_LANGUAGE[language]}
        </p>
        <p className="m-0 text-[16px] tracking-[0.2em] text-white/75 uppercase">{weekday}</p>
        <p className="m-0 text-[56px] leading-none font-light text-white">{dayAndMonth}</p>
        <p className="m-0 mt-2 text-[17px] font-light tracking-[0.06em] text-white/85">
          {filmCount} {IN_CINEMAS[language].word}{' '}
          {formatCount(cinemaCount, IN_CINEMAS[language].forms, language)}
        </p>
      </div>
      <div className="absolute bottom-[180px] flex items-center gap-2.5 text-white/75">
        <BrandMark className="h-[18px] w-auto" />
        <p className="m-0 text-[14px] font-light tracking-[0.06em]">kinomat.sk/ffi</p>
      </div>
    </div>
  )
}
