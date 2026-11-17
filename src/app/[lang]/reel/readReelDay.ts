import { type Language, LOCALE_BY_LANGUAGE } from 'kinomat-core/lib/language'
import { parseDay } from 'kinomat-core/lib/time'
import { notFound } from 'next/navigation'
import { Temporal } from 'temporal-polyfill'

import { readToday } from '@/lib/readToday'
import { formatCount } from '@/site/films/labels'
import { programCopyByLanguage } from '@/site/program/copy'
import {
  type CinemaListing,
  groupIntoProgrammes,
  type ProgrammeListing,
} from '@/site/program/groupScreenings'
import {
  readFestivalDays,
  readFestivalScreeningsOnDay,
  readScheduledDays,
  readScreeningsOnDay,
} from '@/site/program/readScreenings'

function countScreenings(programme: ProgrammeListing) {
  return programme.cinemas.reduce((sum, cinema) => sum + cinema.showings.length, 0)
}

function firstShowing(cinemas: readonly CinemaListing[]) {
  return Math.min(
    ...cinemas.flatMap((cinema) => cinema.showings.map((showing) => showing.startsAt.getTime())),
  )
}

// The showings are already sorted within a cinema; this puts the cinemas themselves on the clock.
function byClock(programme: ProgrammeListing): ProgrammeListing {
  return {
    ...programme,
    cinemas: [...programme.cinemas].sort((a, b) => firstShowing([a]) - firstShowing([b])),
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
      ? await readScheduledDays(today)
      : await readFestivalDays(festival, today)
  const date = Temporal.PlainDate.from(parseDay(den, days[0] ?? today))
  const rows =
    festival === undefined
      ? await readScreeningsOnDay(date.toString())
      : await readFestivalScreeningsOnDay(festival, date.toString())
  const programmes = groupIntoProgrammes(rows)
    .map((programme) => (festival === undefined ? programme : byClock(programme)))
    .map((programme) => ({ programme, screenings: countScreenings(programme) }))
    .sort((a, b) =>
      festival === undefined
        ? b.screenings - a.screenings
        : firstShowing(a.programme.cinemas) - firstShowing(b.programme.cinemas),
    )
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
