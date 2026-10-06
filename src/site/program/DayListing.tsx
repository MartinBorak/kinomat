import { type ReactNode, ViewTransition } from 'react'

type DayListingProps = {
  day: string
  // View-transition names are global per document, so each page's listing carries its own.
  name: string
  children: ReactNode
}

/*
 * Two days often list the same films, and a crossfade between identical frames shows nothing. The
 * day-switch class (globals.css) fades the old day fully out before the new one fades in, so the
 * turnover is visible even when the pixels match.
 */
export function DayListing({ day, name, children }: DayListingProps) {
  return (
    <ViewTransition key={day} name={name} share="day-switch" default="none">
      <div className="flex flex-1 flex-col">{children}</div>
    </ViewTransition>
  )
}
