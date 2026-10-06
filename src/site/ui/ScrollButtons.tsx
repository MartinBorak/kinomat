'use client'

import { type Language } from 'kinomat-core/lib/language'
import { useEffect, useState } from 'react'

import { findSteps, type Steps } from '@/site/ui/findSteps'
import { scrollToPosition, toPositionUnderBar } from '@/site/ui/scrolling'

const COPY_BY_LANGUAGE: Record<Language, { top: string; previous: string; next: string }> = {
  sk: { top: 'Späť hore', previous: 'Predchádzajúci film', next: 'Ďalší film' },
  en: { top: 'Back to top', previous: 'Previous film', next: 'Next film' },
}

const BUTTON_CLASS_NAME =
  'border-accent/40 bg-surface-raised/90 text-accent not-disabled:hover:border-accent/75 flex size-11 cursor-pointer items-center justify-center rounded-full border shadow-[0_6px_24px_oklch(0.12_0.02_255/0.6)] backdrop-blur-md transition-opacity duration-200'

// A left page stays mounted but hidden, so its films and bar must not count.
function queryShown(selector: string) {
  return [...document.querySelectorAll(selector)].filter((element) => element.checkVisibility())
}

function readSteps(): Steps {
  const bar = queryShown('[data-sticky-bar]')[0]

  return findSteps({
    stopTops: queryShown('[data-film-stop]').map((stop) => toPositionUnderBar(stop, bar)),
    scrollY: window.scrollY,
    isAtBottom: window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 1,
  })
}

// The icon class is passed whole: Tailwind finds an icon only by its literal class in the source.
type StepButtonProps = { label: string; top: number | null; iconClassName: string }

// Dimmed rather than hidden at either end, so the pair keeps its place.
function StepButton({ label, top, iconClassName }: StepButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={top === null}
      onClick={() => top !== null && scrollToPosition(top)}
      className={`${BUTTON_CLASS_NAME} disabled:cursor-default disabled:opacity-35`}
    >
      <span aria-hidden className={`${iconClassName} size-5`} />
    </button>
  )
}

/*
 * Back to top floats in once the reader is a screen deep; under it, previous and next film stay
 * whenever the page lists more than one, re-read as the page scrolls, navigates or refilters.
 */
export function ScrollButtons({ language }: { language: Language }) {
  const copy = COPY_BY_LANGUAGE[language]
  const [isTopShown, setIsTopShown] = useState(false)
  // Plain values, not one object: React skips a render only when each value is unchanged.
  const [stopCount, setStopCount] = useState(0)
  const [previousTop, setPreviousTop] = useState<number | null>(null)
  const [nextTop, setNextTop] = useState<number | null>(null)

  useEffect(() => {
    function update() {
      const steps = readSteps()

      setIsTopShown(window.scrollY > window.innerHeight)
      setStopCount(steps.count)
      setPreviousTop(steps.previousTop)
      setNextTop(steps.nextTop)
    }

    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    const observer = new MutationObserver(update)
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributeFilter: ['style'],
    })

    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
      observer.disconnect()
    }
  }, [])

  return (
    <div className="fixed right-5 bottom-5 z-40 flex flex-col gap-2.5 md:right-8 md:bottom-8">
      <button
        type="button"
        aria-label={copy.top}
        inert={!isTopShown}
        onClick={() => scrollToPosition(0)}
        className={`${isTopShown ? 'opacity-100' : 'opacity-0'} ${BUTTON_CLASS_NAME}`}
      >
        <span aria-hidden className="icon-[lucide--arrow-up] size-5" />
      </button>

      {stopCount > 1 && (
        <>
          <StepButton
            label={copy.previous}
            top={previousTop}
            iconClassName="icon-[lucide--chevron-up]"
          />
          <StepButton label={copy.next} top={nextTop} iconClassName="icon-[lucide--chevron-down]" />
        </>
      )}
    </div>
  )
}
