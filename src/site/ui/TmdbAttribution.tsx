import { type Language } from 'kinomat-core/lib/language'
import Image from 'next/image'

/*
 * What TMDB asks of anything showing their data: this sentence beside one of their own logos. The
 * English is theirs word for word; the Slovak is ours, nothing in their terms asking for one
 * language over another, and a disclaimer a reader cannot read disclaims nothing.
 */
const NOTICE_BY_LANGUAGE: Record<Language, string> = {
  sk: 'Tento produkt používa TMDB API, ale nie je schválený ani certifikovaný službou TMDB.',
  en: 'This product uses the TMDB API but is not endorsed or certified by TMDB.',
}

type TmdbAttributionProps = {
  language: Language
  className?: string
}

export function TmdbAttribution({ language, className = '' }: TmdbAttributionProps) {
  return (
    <div className={`flex flex-col items-center gap-[5px] md:flex-row md:gap-2.5 ${className}`}>
      <span className="text-center normal-case md:order-last md:text-left">
        {NOTICE_BY_LANGUAGE[language]}
      </span>
      <a href="https://www.themoviedb.org/" target="_blank" rel="noopener">
        <Image src="/tmdb.svg" alt="TMDB" width={54} height={7} className="opacity-70" />
      </a>
    </div>
  )
}
