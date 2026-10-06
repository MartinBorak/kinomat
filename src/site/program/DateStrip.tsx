import { type Language } from 'kinomat-core/lib/language'
import Link from 'next/link'
import { Fragment } from 'react'
import { Temporal } from 'temporal-polyfill'

import { type ProgramCopy } from '@/site/program/copy'
import { formatDayChip } from '@/site/program/labels'

type DateStripProps = {
  days: readonly Temporal.PlainDate[]
  selected: Temporal.PlainDate
  today: Temporal.PlainDate
  copy: ProgramCopy
  language: Language
  // Where a day leads is the caller's: the schedule keeps its filters, a film page keeps its film.
  toHref: (day: Temporal.PlainDate) => string
}

const CHIP =
  'flex min-w-[74px] shrink-0 snap-start flex-col items-center gap-0.5 rounded-2xl border px-3.5 pt-2.5 pb-[11px] transition-[background-color,box-shadow]'

// The days something is on, the one being read lit up. Links rather than clicks, so a day is a URL.
export function DateStrip({ days, selected, today, copy, language, toHref }: DateStripProps) {
  return (
    <nav
      aria-label={copy.days}
      className="border-line bg-surface-raised relative border-b px-[22px] pt-4 pb-1 md:px-[6vw]"
    >
      {/* The gutters sit outside the scroller, so the strip and its scrollbar end where the page does. */}
      {/* Snapping to a chip's left edge: a day is either on the strip or off it, never sliced. */}
      <div className="scrollbar-accent flex snap-x snap-mandatory gap-2.5 overflow-x-auto pb-2.5">
        {days.map((day, index) => {
          const chip = formatDayChip(day, today, copy, language)
          const isSelected = day.equals(selected)
          const isWeekend = day.dayOfWeek > 5
          const previous = days[index - 1]
          const followsGap = previous !== undefined && previous.until(day).days > 1

          return (
            <Fragment key={day.toString()}>
              {/* Adjacent chips read as adjacent days, so a skipped stretch needs its own mark. */}
              {followsGap && (
                <span
                  aria-hidden
                  className="text-ink-faint snap-none self-center px-1 text-[21px] leading-none font-light tracking-[0.2em]"
                >
                  ···
                </span>
              )}
              {/* A day's page is dynamic, so only a full prefetch saves the click its round trip. */}
              <Link
                href={toHref(day)}
                prefetch
                aria-current={isSelected ? 'date' : undefined}
                className={`${CHIP} ${
                  isSelected
                    ? 'bg-accent border-accent shadow-[0_0_26px_oklch(0.85_0.09_245/0.4)]'
                    : 'border-accent/20 bg-surface-raised hover:bg-surface-hover'
                }`}
              >
                <span
                  className={`text-[10px] tracking-[0.16em] uppercase ${
                    isSelected ? 'text-accent-ink' : isWeekend ? 'text-accent' : 'text-ink-muted'
                  }`}
                >
                  {chip.weekday}
                </span>
                <span
                  className={`text-[21px] leading-tight font-light ${
                    isSelected ? 'text-accent-ink' : isWeekend ? 'text-accent' : 'text-white'
                  }`}
                >
                  {chip.day}
                </span>
                <span
                  className={`text-[9.5px] font-light tracking-[0.16em] uppercase ${isSelected ? 'text-accent-ink/80' : 'text-ink-faint'}`}
                >
                  {chip.month}
                </span>
              </Link>
            </Fragment>
          )
        })}
      </div>
    </nav>
  )
}
