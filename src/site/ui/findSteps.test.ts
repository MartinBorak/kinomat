import { describe, expect, it } from 'vitest'

import { findSteps } from '@/site/ui/findSteps'

describe('findSteps', () => {
  it('steps to the films either side of the one under the bar', () => {
    expect(findSteps({ stopTops: [0, 400, 800], scrollY: 400, isAtBottom: false })).toEqual({
      count: 3,
      previousTop: 0,
      nextTop: 800,
    })
  })

  it('reads the stops in page order, whatever order they come in', () => {
    expect(findSteps({ stopTops: [800, 0, 400], scrollY: 500, isAtBottom: false })).toMatchObject({
      previousTop: 400,
      nextTop: 800,
    })
  })

  // A grid row is two or more cards at one height, and is stepped over as one.
  it('counts a row of cards as one stop', () => {
    expect(findSteps({ stopTops: [0, 0, 400.4, 399.6], scrollY: 0, isAtBottom: false })).toEqual({
      count: 2,
      previousTop: null,
      nextTop: 400,
    })
  })

  // A scroll lands a fraction off its target, which must not leave the same film one step away.
  it('takes a film within a pixel as the current one', () => {
    expect(findSteps({ stopTops: [0, 400, 800], scrollY: 400.8, isAtBottom: false })).toMatchObject(
      { previousTop: 0, nextTop: 800 },
    )
  })

  it('offers nothing before the first film', () => {
    expect(findSteps({ stopTops: [200, 600], scrollY: 0, isAtBottom: false })).toMatchObject({
      previousTop: null,
      nextTop: 200,
    })
  })

  // The last films may sit too low to reach the bar, and a scroll that cannot move is no step.
  it('offers no next film once the page is at its bottom', () => {
    expect(findSteps({ stopTops: [0, 400, 800], scrollY: 500, isAtBottom: true })).toMatchObject({
      previousTop: 400,
      nextTop: null,
    })
  })

  it('finds no stops on a page without films', () => {
    expect(findSteps({ stopTops: [], scrollY: 0, isAtBottom: false })).toEqual({
      count: 0,
      previousTop: null,
      nextTop: null,
    })
  })
})
