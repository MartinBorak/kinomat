'use client'

import { type Language } from 'kinomat-core/lib/language'
import { useRef } from 'react'

import { ClearButton } from '@/site/search/ClearButton'
import { searchCopyByLanguage } from '@/site/search/copy'

const PLACEHOLDER_BY_LANGUAGE: Record<Language, string> = {
  sk: 'Hľadať film…',
  en: 'Search a film…',
}

type SearchFieldProps = {
  query: string
  language: Language
  onChange: (query: string) => void
}

// The search that sits in the filter row. A film's page has no use for it.
export function SearchField({ query, language, onChange }: SearchFieldProps) {
  const input = useRef<HTMLInputElement>(null)
  const placeholder = PLACEHOLDER_BY_LANGUAGE[language]

  // On a phone the search takes its own row above the pills; from xl it stands in their row.
  return (
    <div className="bg-surface-raised border-accent/28 focus-within:border-accent/70 focus-within:bg-surface-hover rounded-brand flex h-[42px] min-w-0 basis-full items-center border px-[18px] transition-colors xl:max-w-[320px] xl:flex-1 xl:basis-[240px]">
      {/* The platform's own clear cross is too small to hit and missing in Firefox; ours replaces it. */}
      <input
        ref={input}
        type="search"
        value={query}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        spellCheck={false}
        autoComplete="off"
        className="w-full bg-transparent text-[14px] font-light text-white outline-none [&::-webkit-search-cancel-button]:appearance-none"
      />
      {query !== '' && (
        <ClearButton
          label={searchCopyByLanguage[language].clear}
          onClick={() => {
            onChange('')
            input.current?.focus()
          }}
        />
      )}
    </div>
  )
}
