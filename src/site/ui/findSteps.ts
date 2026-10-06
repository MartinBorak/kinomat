export type Steps = { count: number; previousTop: number | null; nextTop: number | null }

type FindStepsInput = { stopTops: number[]; scrollY: number; isAtBottom: boolean }

// Within a pixel is where a stop lands after a scroll, so it is the current film, not a step away.
const TOLERANCE = 1

// The film rows either side of the reader; a grid row is one stop, however many cards share it.
export function findSteps({ stopTops, scrollY, isAtBottom }: FindStepsInput): Steps {
  const tops = [...new Set(stopTops.map((top) => Math.round(top)))].toSorted((a, b) => a - b)

  return {
    count: tops.length,
    previousTop: tops.findLast((top) => top < scrollY - TOLERANCE) ?? null,
    nextTop: isAtBottom ? null : (tops.find((top) => top > scrollY + TOLERANCE) ?? null),
  }
}
