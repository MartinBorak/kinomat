import { type Language, LOCALE_BY_LANGUAGE } from 'kinomat-core/lib/language'
import { parseDay } from 'kinomat-core/lib/time'
import { type CityId } from 'kinomat-core/types/city'
import { notFound } from 'next/navigation'
import { Temporal } from 'temporal-polyfill'

import { readToday } from '@/lib/readToday'
import { formatCount } from '@/site/films/labels'
import { programCopyByLanguage } from '@/site/program/copy'
import { groupIntoProgrammes, type ProgrammeListing } from '@/site/program/groupScreenings'
import { readScheduledDays, readScreeningsOnDay } from '@/site/program/readScreenings'

// The account posts Bratislava's day only, until other cities are decided on.
const REEL_CITY: CityId = 'bratislava'

function countScreenings(programme: ProgrammeListing) {
  return programme.cinemas.reduce((sum, cinema) => sum + cinema.showings.length, 0)
}

// The day the Reel and its cover show, its films most screened first, and the header's words.
export async function readReelDay(den: string | string[] | undefined, language: Language) {
  // The Reel is filmed off the dev server; on kinomat.sk it is nobody's page.
  if (process.env.NODE_ENV === 'production') {
    notFound()
  }
  const copy = programCopyByLanguage[language]
  const today = await readToday()
  const days = await readScheduledDays(REEL_CITY, today)
  const date = Temporal.PlainDate.from(parseDay(den, days[0] ?? today))
  const programmes = groupIntoProgrammes(await readScreeningsOnDay(REEL_CITY, date.toString()))
    .map((programme) => ({ programme, screenings: countScreenings(programme) }))
    .sort((a, b) => b.screenings - a.screenings)
  const locale = LOCALE_BY_LANGUAGE[language]

  return {
    isoDate: date.toString(),
    copy,
    programmes,
    weekday: date.toLocaleString(locale, { weekday: 'long' }),
    dayAndMonth: date.toLocaleString(locale, { day: 'numeric', month: 'long' }),
    filmCount: formatCount(programmes.length, copy.films, language),
  }
}
