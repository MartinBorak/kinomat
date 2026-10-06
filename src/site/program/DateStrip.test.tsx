import { render, screen } from '@testing-library/react'
import { Temporal } from 'temporal-polyfill'
import { describe, expect, it } from 'vitest'

import { programCopyByLanguage } from '@/site/program/copy'
import { DateStrip } from '@/site/program/DateStrip'

const today = Temporal.PlainDate.from('2026-09-10')

function renderStrip(days: readonly string[]) {
  const dates = days.map((day) => Temporal.PlainDate.from(day))
  return render(
    <DateStrip
      days={dates}
      selected={dates[0]}
      today={today}
      copy={programCopyByLanguage.sk}
      language="sk"
      toHref={(day) => `/program?den=${day.toString()}`}
    />,
  )
}

describe('the date strip', () => {
  it('marks a skipped stretch between two days, and nothing between neighbours', () => {
    const { container } = renderStrip(['2026-09-10', '2026-09-11', '2026-09-14'])

    expect(screen.getAllByRole('link')).toHaveLength(3)
    expect(container.querySelectorAll('[aria-hidden]')).toHaveLength(1)
    expect(screen.getAllByRole('link')[2].previousElementSibling).toHaveTextContent('···')
  })
})
