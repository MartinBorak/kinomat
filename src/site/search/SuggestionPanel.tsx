'use client'

import Link from 'next/link'
import { useId, useLayoutEffect, useRef, useState } from 'react'

import { type SuggestionGroup } from '@/site/search/suggestions'

type SuggestionPanelProps = {
  query: string
  groups: readonly SuggestionGroup[]
  // Where the panel hangs: under the hero's field it grows the form, in the header it floats.
  className?: string
}

/*
 * What a query offers, opening by moving rather than appearing. The rows are given the height they
 * measure, since a box that sizes itself to its content has nothing to transition between.
 */
export function SuggestionPanel({ query, groups, className = '' }: SuggestionPanelProps) {
  const isOpen = groups.length > 0
  const labelId = useId()

  /*
   * The rows the panel is showing, which stay behind through the closing: emptied at the moment the
   * panel is told to close, they would blink out and leave the transition playing over a void.
   */
  const [shown, setShown] = useState({ query, groups })

  if (isOpen && shown.query !== query) {
    setShown({ query, groups })
  }

  const rows = useRef<HTMLDivElement>(null)
  const [rowsHeight, setRowsHeight] = useState(0)

  useLayoutEffect(() => {
    const measured = rows.current

    if (measured === null) {
      return
    }

    const observer = new ResizeObserver(() => setRowsHeight(measured.offsetHeight))

    observer.observe(measured)

    return () => observer.disconnect()
  }, [])

  return (
    <div
      inert={!isOpen}
      style={{ height: isOpen ? rowsHeight : 0 }}
      className={`overflow-hidden transition-[height,opacity,margin] duration-[320ms] ease-[cubic-bezier(0.22,0.9,0.24,1)] ${className} ${
        isOpen ? 'mt-3 opacity-100 md:mt-3.5' : 'opacity-0'
      }`}
    >
      <div
        ref={rows}
        className={`border-accent/28 bg-surface-raised overflow-hidden rounded-[20px] border transition-transform duration-[320ms] ease-[cubic-bezier(0.22,0.9,0.24,1)] md:shadow-[0_26px_60px_oklch(0.15_0.02_255/0.6)] ${
          isOpen ? 'translate-y-0' : '-translate-y-1.5'
        }`}
      >
        {(isOpen ? groups : shown.groups).map((group, index) => (
          <div
            key={group.label}
            role="group"
            aria-labelledby={`${labelId}-${index}`}
            className="border-line border-t"
          >
            {/* Rows breathe with the window rather than at a threshold: 12px, 6px at 640. */}
            <p
              id={`${labelId}-${index}`}
              className="text-accent/85 px-5 pt-[clamp(10px,1.6vh,14px)] pb-1.5 text-[9.5px] font-light tracking-[0.24em] uppercase md:px-6"
            >
              {group.label}
            </p>
            {group.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="hover:bg-surface-hover text-ink flex items-center gap-4 px-5 py-[clamp(6px,1.15vh,12px)] font-light md:px-6"
              >
                <span className="min-w-0 flex-1 truncate text-[15px]">{item.name}</span>
                <span className="text-ink-muted flex-none text-xs">{item.meta}</span>
              </Link>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
