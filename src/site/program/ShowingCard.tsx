import { type Language } from 'kinomat-core/lib/language'
import { formatTimeOfDay } from 'kinomat-core/lib/time'

import { type ProgramCopy } from '@/site/program/copy'
import { type Showing } from '@/site/program/groupScreenings'
import {
  formatAudio,
  formatPrice,
  formatScreeningFormat,
  formatSubtitles,
} from '@/site/program/labels'

type ShowingCardProps = {
  showing: Showing
  copy: ProgramCopy
  language: Language
}

function Tag({ label }: { label: string }) {
  return (
    <span className="border-accent/26 bg-accent/12 text-accent/90 rounded-[5px] border px-[7px] py-0.5 text-[9px] font-medium tracking-[0.14em] uppercase">
      {label}
    </span>
  )
}

// One showing: when it is, what it is heard and read in, what it costs, and what the cinema puts it on with.
export function ShowingCard({ showing, copy, language }: ShowingCardProps) {
  const audio = formatAudio(showing.language, copy, language)
  const subtitles = formatSubtitles(showing.subtitles, copy, language)
  const price = formatPrice(showing.price, copy, language)
  const tags = [
    ...showing.format.map((format) => formatScreeningFormat(format)),
    ...(showing.eventNote === '' ? [] : [showing.eventNote]),
  ]

  /*
   * One width for every card: it fits "slovenské titulky", the longest line 97% of showings print,
   * and two fit on a 375px screen. A row of four technologies wraps inside rather than widening it.
   */
  return (
    <a
      href={showing.bookingUrl}
      target="_blank"
      rel="noopener"
      className="border-accent/22 bg-surface-raised flex w-[160px] flex-col gap-[5px] rounded-xl border px-3.5 pt-2.5 pb-[11px] transition-[border-color,box-shadow] hover:border-[oklch(0.85_0.09_245/0.6)] hover:shadow-[0_0_20px_oklch(0.85_0.09_245/0.18)]"
    >
      <time
        dateTime={showing.startsAt.toISOString()}
        className="text-[20px] tracking-[0.02em] text-white"
      >
        {formatTimeOfDay(showing.startsAt)}
      </time>

      {/* A line each: heard and read are two facts, and side by side they set the card's width. */}
      <div className="text-ink-soft flex flex-col gap-[3px] text-[10px] font-light tracking-[0.1em] uppercase">
        <div>{audio}</div>
        {subtitles !== '' && <div>{subtitles}</div>}
      </div>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-[5px]">
          {tags.map((tag) => (
            <Tag key={tag} label={tag} />
          ))}
        </div>
      )}

      {/*
       * A footer of its own, edge to edge under a rule and pushed to the bottom, since a row
       * stretches every card to its tallest. The outer div is what a flex item can push down; the
       * padding on it is the breath between content and footer that the rows' own gap is too small for.
       */}
      {price !== '' && (
        <div className="-mx-3.5 mt-auto -mb-[11px] pt-[7px]">
          <div className="border-accent/22 bg-accent/8 text-ink rounded-b-xl border-t px-3.5 py-[6px] text-center text-[14px] tracking-[0.02em]">
            {price}
          </div>
        </div>
      )}
    </a>
  )
}
