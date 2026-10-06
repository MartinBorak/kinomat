import { type Language } from 'kinomat-core/lib/language'
import { type Cinema } from 'kinomat-core/types/cinema'

import { cinemasCopyByLanguage } from '@/site/cinemas/copy'
import { toMapHref } from '@/site/cinemas/hrefs'
import { OutboundLink } from '@/site/ui/OutboundLink'

type CinemaLinksProps = {
  cinema: Cinema
  language: Language
  className?: string
}

// The ways off our site to the cinema itself: where it stands, and its own pages.
export function CinemaLinks({ cinema, language, className = '' }: CinemaLinksProps) {
  const copy = cinemasCopyByLanguage[language]

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <OutboundLink label={copy.map} href={toMapHref(cinema)} />
      <OutboundLink label={copy.website} href={cinema.website} />
    </div>
  )
}
