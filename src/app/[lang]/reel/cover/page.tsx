import type { Metadata } from 'next'

import { readLanguage } from '@/lib/readLanguage'
import { BrandMark } from '@/site/ui/BrandMark'

import { readReelDay } from '../readReelDay'

/*
 * PROTOTYPE: the Reel's cover, 432x768 at 2.5x like the Reel. Meta crops a cover to its middle
 * square in the feed, so everything sits inside 168-600 px, which the 3:4 grid tile also keeps.
 */
export const instant = false

export const metadata: Metadata = { robots: { index: false, follow: false } }

export default async function ReelCover(props: PageProps<'/[lang]/reel/cover'>) {
  const { den } = await props.searchParams
  const language = readLanguage((await props.params).lang)
  const { isoDate, weekday, dayAndMonth, filmCount } = await readReelDay(den, language)

  return (
    <div
      data-reel-day={isoDate}
      className="bg-surface relative flex h-[768px] w-[432px] flex-col items-center justify-center overflow-hidden"
    >
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(70%_38%_at_50%_50%,oklch(0.86_0.08_245/0.16),transparent_70%)]"
      />
      <div className="relative flex flex-col items-center gap-3 text-center">
        <BrandMark className="mb-5 h-[40px] w-auto" />
        <p className="text-accent m-0 text-[16px] tracking-[0.2em] uppercase">{weekday}</p>
        <p className="m-0 text-[56px] leading-none font-light text-white">{dayAndMonth}</p>
        <p className="text-ink-soft m-0 mt-2 text-[17px] font-light tracking-[0.06em]">
          {filmCount} · kinomat.sk
        </p>
      </div>
    </div>
  )
}
