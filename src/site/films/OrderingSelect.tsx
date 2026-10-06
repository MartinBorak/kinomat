'use client'

import { type FilmsCopy } from '@/site/films/copy'
import { type Ordering, ORDERINGS_IN_ORDER, parseOrdering } from '@/site/films/ordering'
import { PILL } from '@/site/program/FilterBar'

type OrderingSelectProps = {
  ordering: Ordering
  copy: FilmsCopy
  onChange: (ordering: Ordering) => void
}

// The order the grid is in. A plain select, so the platform draws the menu and the keyboard works.
export function OrderingSelect({ ordering, copy, onChange }: OrderingSelectProps) {
  return (
    <div className="relative flex">
      <select
        value={ordering}
        onChange={(event) => onChange(parseOrdering(event.target.value))}
        aria-label={copy.orderingLabel}
        className={`${PILL} bg-surface-raised border-accent/28 hover:border-accent/60 text-ink cursor-pointer appearance-none pr-9`}
      >
        {ORDERINGS_IN_ORDER.map((option) => (
          <option key={option} value={option}>
            {copy.orderings[option]}
          </option>
        ))}
      </select>

      <span
        aria-hidden
        className="text-accent/90 icon-[lucide--chevron-down] pointer-events-none absolute top-1/2 right-4 size-3.5 -translate-y-1/2"
      />
    </div>
  )
}
