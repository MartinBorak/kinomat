import { type Language, LOCALE_BY_LANGUAGE } from 'kinomat-core/lib/language'
import { parseDay } from 'kinomat-core/lib/time'
import { type CityId } from 'kinomat-core/types/city'
import { notFound } from 'next/navigation'
import { Temporal } from 'temporal-polyfill'

import { readToday } from '@/lib/readToday'
import { formatCount } from '@/site/films/labels'
import { programCopyByLanguage } from '@/site/program/copy'
import {
  firstShowingTime,
  groupIntoProgrammes,
  type ProgrammeListing,
  sortByFirstShowing,
} from '@/site/program/groupScreenings'
import {
  readFestivalDays,
  readFestivalScreeningsOnDay,
  readScheduledDays,
  readScreeningsOnDay,
} from '@/site/program/readScreenings'

// The account posts Bratislava's day only, until other cities are decided on.
const REEL_CITY: CityId = 'bratislava'

function countScreenings(programme: ProgrammeListing) {
  return programme.cinemas.reduce((sum, cinema) => sum + cinema.showings.length, 0)
}

// The showings are already sorted within a cinema; this puts the cinemas themselves on the clock.
function byClock(programme: ProgrammeListing): ProgrammeListing {
  return {
    ...programme,
    cinemas: [...programme.cinemas].sort((a, b) => firstShowingTime([a]) - firstShowingTime([b])),
  }
}

/*
 * The day the Reel and its cover show, its films most screened first, and the header's words. A
 * festival's day is its lineup only, in the order it plays: most of its films screen once, so a
 * count would not order them, and a viewer of today's programme reads it by the clock.
 */
export async function readReelDay(
  den: string | string[] | undefined,
  language: Language,
  festival?: string,
) {
  // The Reel is filmed off the dev server; on kinomat.sk it is nobody's page.
  if (process.env.NODE_ENV === 'production') {
    notFound()
  }
  const copy = programCopyByLanguage[language]
  const today = await readToday()
  const days =
    festival === undefined
      ? await readScheduledDays(REEL_CITY, today)
      : await readFestivalDays(festival, today)
  const date = Temporal.PlainDate.from(parseDay(den, days[0] ?? today))
  const rows =
    festival === undefined
      ? await readScreeningsOnDay(REEL_CITY, date.toString())
      : await readFestivalScreeningsOnDay(festival, date.toString())
  const grouped = groupIntoProgrammes(rows)
  const programmes =
    festival === undefined
      ? grouped
          .map((programme) => ({ programme, screenings: countScreenings(programme) }))
          .sort((a, b) => b.screenings - a.screenings)
      : sortByFirstShowing(grouped.map(byClock)).map((programme) => ({
          programme,
          screenings: countScreenings(programme),
        }))
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
