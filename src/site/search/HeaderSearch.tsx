'use client'

import { type Language } from 'kinomat-core/lib/language'
import { useEffect, useRef, useState } from 'react'

import { toFilmsHref } from '@/site/films/hrefs'
import { ClearButton } from '@/site/search/ClearButton'
import { searchCopyByLanguage } from '@/site/search/copy'
import { SuggestionPanel } from '@/site/search/SuggestionPanel'
import {
  findSuggestionGroups,
  SUGGESTED_FILMS_ROUTE,
  type SuggestedFilm,
  toLabelledSuggestions,
} from '@/site/search/suggestions'

type HeaderSearchProps = {
  language: Language
  className?: string
  // Left in flow the panel grows what it stands in, which is what the opened menu wants of it.
  panelClassName?: string
}

/*
 * The hero's search, shrunk to fit a header: the same field and the same panel. Enter goes where
 * the hero's button goes: the Films view, narrowed by what nobody picked a suggestion for.
 */
export function HeaderSearch({ language, className = '', panelClassName = '' }: HeaderSearchProps) {
  const copy = searchCopyByLanguage[language]
  const [query, setQuery] = useState('')
  const [isDismissed, setIsDismissed] = useState(false)
  const [films, setFilms] = useState<readonly SuggestedFilm[]>([])
  const [isRequested, setIsRequested] = useState(false)
  const field = useRef<HTMLFormElement>(null)
  const input = useRef<HTMLInputElement>(null)

  /*
   * The films are fetched at the first focus, not carried by every page: they arrive between the
   * focus and the first letter. A failed fetch unmarks the request, so the next focus retries.
   */
  function requestFilms() {
    if (isRequested) {
      return
    }

    setIsRequested(true)
    fetch(SUGGESTED_FILMS_ROUTE)
      .then((response) => response.json() as Promise<SuggestedFilm[]>)
      .then(setFilms)
      .catch(() => setIsRequested(false))
  }

  // The panel is dismissed the way the filter menus are: by looking away from it, or by saying no.
  useEffect(() => {
    function closeOnOutside(event: PointerEvent) {
      if (!field.current?.contains(event.target as Node)) {
        setIsDismissed(true)
      }
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsDismissed(true)
      }
    }

    document.addEventListener('pointerdown', closeOnOutside)
    document.addEventListener('keydown', closeOnEscape)

    return () => {
      document.removeEventListener('pointerdown', closeOnOutside)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [])

  // The cinemas are a registry both sides hold; only the films have to be asked of the server.
  const groups = isDismissed
    ? []
    : findSuggestionGroups(toLabelledSuggestions(films, language), query)

  // Pasted or autofilled text changes the field without focusing it, so a change also requests.
  function changeQuery(next: string) {
    requestFilms()
    setQuery(next)
    setIsDismissed(false)
  }

  return (
    <form
      action={toFilmsHref('', language)}
      // An empty search names nothing to look for, so Enter does nothing rather than navigate.
      onSubmit={(event) => query.trim() === '' && event.preventDefault()}
      ref={field}
      className={`relative ${className}`}
    >
      <div className="bg-field border-accent/45 focus-within:border-accent/75 focus-within:bg-surface-hover rounded-brand flex h-10 items-center gap-2 border px-4 transition-colors duration-[240ms]">
        <input
          ref={input}
          name="q"
          value={query}
          onChange={(event) => changeQuery(event.target.value)}
          onFocus={() => {
            requestFilms()
            setIsDismissed(false)
          }}
          placeholder={copy.headerPlaceholder}
          aria-label={copy.headerPlaceholder}
          spellCheck={false}
          autoComplete="off"
          className="min-w-0 flex-1 border-none bg-transparent text-[13px] font-light text-white outline-none placeholder:text-[oklch(0.64_0.014_250)]"
        />
        {query !== '' && (
          // A glyph rather than the hero's word, which would take a third of a field this narrow.
          <ClearButton
            label={copy.clear}
            onClick={() => {
              changeQuery('')
              input.current?.focus()
            }}
          />
        )}
      </div>

      <SuggestionPanel query={query} groups={groups} className={panelClassName} />
    </form>
  )
}
