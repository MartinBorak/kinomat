'use client'

import { type Language } from 'kinomat-core/lib/language'
import { type CityId, findCity } from 'kinomat-core/types/city'
import Link from 'next/link'
import { useEffect, useId, useRef, useState } from 'react'

import { CITY_LABEL_BY_LANGUAGE, type SiteSection, toCityNavigation } from '@/site/ui/navigation'

type CitySwitcherProps = {
  language: Language
  city: CityId
  current: SiteSection | null
  className?: string
}

/*
 * The city the page is in, and a menu of the others. Links rather than a select, so each city is a
 * page a crawler follows and the router can prefetch; the proxy remembers the one picked.
 */
export function CitySwitcher({ language, city, current, className = '' }: CitySwitcherProps) {
  const [isOpen, setIsOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const listId = useId()
  const label = CITY_LABEL_BY_LANGUAGE[language]
  const name = findCity(city)?.name ?? city

  // A click anywhere else or Escape closes it, as a menu is expected to.
  useEffect(() => {
    if (!isOpen) {
      return
    }

    function closeOnOutsideClick(event: PointerEvent) {
      if (event.target instanceof Node && !root.current?.contains(event.target)) {
        setIsOpen(false)
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('pointerdown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)

    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [isOpen])

  return (
    // Below md the list hangs off the header rather than the button, so it spans the phone's width.
    <div ref={root} className={`static md:relative ${className}`}>
      <button
        type="button"
        aria-label={`${label}: ${name}`}
        aria-expanded={isOpen}
        aria-controls={listId}
        onClick={() => setIsOpen((open) => !open)}
        className="text-ink-soft hover:text-accent flex cursor-pointer items-center gap-1.5 text-[10.5px] font-light tracking-[0.14em] uppercase md:text-[12.5px]"
      >
        {name}
        <svg
          aria-hidden
          viewBox="0 0 10 6"
          className={`size-2.5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        >
          <path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.4" />
        </svg>
      </button>

      {isOpen && (
        <ul
          id={listId}
          className="border-line bg-surface-raised md:border-accent/28 md:rounded-brand absolute inset-x-0 top-full z-50 m-0 list-none overflow-hidden border-b p-0 md:right-auto md:mt-3 md:min-w-[200px] md:border md:shadow-[0_26px_60px_oklch(0.15_0.02_255/0.6)]"
        >
          {toCityNavigation(language, city, current).map((item) => (
            <li key={item.href} className="border-line border-t first:border-t-0">
              <Link
                href={item.href}
                aria-current={item.isCurrent ? 'page' : undefined}
                onClick={() => setIsOpen(false)}
                className={`block px-[22px] py-3 text-sm md:px-4 md:py-2.5 ${
                  item.isCurrent ? 'text-accent' : 'text-ink-soft hover:bg-surface-hover'
                }`}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
