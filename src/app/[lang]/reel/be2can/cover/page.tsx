import { type Language } from 'kinomat-core/lib/language'
import type { Metadata } from 'next'

import { readLanguage } from '@/lib/readLanguage'
import { type CountCopy, formatCount } from '@/site/films/labels'
import { BrandMark } from '@/site/ui/BrandMark'

import { readReelDay } from '../../readReelDay'
import { Be2CanMark } from '../Be2CanMark'

/*
 * PROTOTYPE: the festival Story's cover, 432x768 at 2.5x like the Story. The festival's own look:
 * its wordmark in its red over the purple-to-blue haze of its 2026 key visual. Everything sits
 * inside 168-600 px, the middle square a feed crops a cover to.
 */
export const instant = false

export const metadata: Metadata = { robots: { index: false, follow: false } }

const FESTIVAL = 'be2can'

// Slovak counts its cinemas in the locative after "v": v 1 kine, v 3 kinách.
const IN_CINEMAS: Record<Language, { word: string; forms: CountCopy }> = {
  sk: { word: 'v', forms: { one: 'kine', other: 'kinách' } },
  en: { word: 'in', forms: { one: 'cinema', other: 'cinemas' } },
}

export default async function Be2CanStoryCover(props: PageProps<'/[lang]/reel/be2can/cover'>) {
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
      className="relative flex h-[768px] w-[432px] flex-col items-center justify-center overflow-hidden bg-[#0a0a1c]"
    >
      <div
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(118deg,#7a3b9a_0%,#2a1850_38%,#0b0b24_62%,#1c2a8c_100%)]"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(60%_34%_at_50%_52%,oklch(0.1_0.03_290/0.85),transparent_75%)]"
      />
      <div className="relative flex flex-col items-center gap-3 text-center">
        <Be2CanMark className="mb-6 h-[62px] w-auto text-[#ed184c]" />
        <p className="m-0 text-[16px] tracking-[0.2em] text-white/70 uppercase">{weekday}</p>
        <p className="m-0 text-[56px] leading-none font-light text-white">{dayAndMonth}</p>
        <p className="m-0 mt-2 text-[17px] font-light tracking-[0.06em] text-white/80">
          {filmCount} {IN_CINEMAS[language].word}{' '}
          {formatCount(cinemaCount, IN_CINEMAS[language].forms, language)}
        </p>
      </div>
      <div className="absolute bottom-[190px] flex items-center gap-2.5 text-white/60">
        <BrandMark className="h-[18px] w-auto" />
        <p className="m-0 text-[14px] font-light tracking-[0.06em]">kinomat.sk/be2can</p>
      </div>
    </div>
  )
}
