import { Temporal } from 'temporal-polyfill'
import { describe, expect, it } from 'vitest'

import { programCopyByLanguage } from '@/site/program/copy'
import {
  formatAudio,
  formatDayChip,
  formatPrice,
  formatScreeningFormat,
  formatSubtitles,
} from '@/site/program/labels'

const SLOVAK = programCopyByLanguage.sk
const ENGLISH = programCopyByLanguage.en

describe('labelling a showing', () => {
  it('names the languages a showing is heard in', () => {
    expect(formatAudio('en', SLOVAK, 'sk')).toBe('angličtina')
    expect(formatAudio('en, sk', SLOVAK, 'sk')).toBe('angličtina, slovenčina')
  })

  it('reads the scrapers’ sentinel as the claim it is, not as a language', () => {
    expect(formatAudio('original', SLOVAK, 'sk')).toBe('originál')
    expect(formatAudio('original', ENGLISH, 'en')).toBe('original')
  })

  it('keeps a word no catalogue knows rather than failing on it', () => {
    expect(formatAudio('maďarský', SLOVAK, 'sk')).toBe('maďarský')
  })

  it('says nothing about subtitles where the cinema printed nothing', () => {
    expect(formatSubtitles('', SLOVAK, 'sk')).toBe('')
  })

  it('puts the language before the noun, declined where Slovak declines it', () => {
    expect(formatSubtitles('sk', SLOVAK, 'sk')).toBe('slovenské titulky')
    expect(formatSubtitles('cs, en', SLOVAK, 'sk')).toBe('české, anglické titulky')
    expect(formatSubtitles('sk', ENGLISH, 'en')).toBe('Slovak subtitles')
  })

  /*
   * Slovak endings are irregular enough not to be guessed, so a language with no adjective on
   * record is named as the noun it is rather than as a word that looks Slovak but is not one.
   */
  it('falls back to the noun for a language it has no adjective for', () => {
    expect(formatSubtitles('hu', SLOVAK, 'sk')).toBe('titulky maďarčina')
    expect(formatSubtitles('sk, hu', SLOVAK, 'sk')).toBe('titulky slovenčina, maďarčina')
  })

  it('reads a format slug as the acronym or the words it is', () => {
    expect(formatScreeningFormat('4dx')).toBe('4DX')
    expect(formatScreeningFormat('imax')).toBe('IMAX')
    expect(formatScreeningFormat('dolby-atmos')).toBe('Dolby Atmos')
    expect(formatScreeningFormat('2D')).toBe('2D')
  })
})

describe('pricing a showing', () => {
  it('prints one price where the two tiers agree', () => {
    expect(formatPrice({ min: 7, max: 7 }, SLOVAK, 'sk')).toBe('7\u00a0€')
    expect(formatPrice({ min: 7, max: 7 }, ENGLISH, 'en')).toBe('€7')
  })

  // The sign on both ends; a cinema prints "8,90 €", never "8,9 €", so a fraction takes both to the cent.
  it('prints the cheapest and the full ticket as a range, to the cent when either has one', () => {
    expect(formatPrice({ min: 11.9, max: 12.9 }, SLOVAK, 'sk')).toBe('11,90\u00a0€ – 12,90\u00a0€')
    expect(formatPrice({ min: 3, max: 5 }, ENGLISH, 'en')).toBe('€3 – €5')
  })

  it('says free rather than printing a zero', () => {
    expect(formatPrice({ min: 0, max: 0 }, SLOVAK, 'sk')).toBe('zadarmo')
    expect(formatPrice({ min: 0, max: 0 }, ENGLISH, 'en')).toBe('free')
  })

  it('prints nothing where the cinema stated no price', () => {
    expect(formatPrice(null, SLOVAK, 'sk')).toBe('')
  })
})

describe('labelling a day', () => {
  const today = Temporal.PlainDate.from('2026-09-05')

  it('names today and tomorrow, and dates every other day by its weekday', () => {
    expect(formatDayChip(today, today, SLOVAK, 'sk').weekday).toBe('Dnes')
    expect(formatDayChip(today.add({ days: 1 }), today, SLOVAK, 'sk').weekday).toBe('Zajtra')
    expect(formatDayChip(today.add({ days: 2 }), today, SLOVAK, 'sk')).toEqual({
      weekday: 'Po',
      day: '7',
      month: 'sep',
    })
  })
})
