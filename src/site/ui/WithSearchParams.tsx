'use client'

import { useSearchParams } from 'next/navigation'
import { type ReactNode, Suspense } from 'react'

const NO_SEARCH_PARAMS = new URLSearchParams()

function ReadSearchParams({ render }: { render: (searchParams: URLSearchParams) => ReactNode }) {
  return render(useSearchParams())
}

/*
 * A view whose filters live in the query, on a page cached once for every query. The cached HTML is
 * the view with no filters, so the whole listing is in it, and the reader's own query applies once
 * the page is in the browser. Without the boundary the whole view would render in the browser only.
 */
export function WithSearchParams({
  render,
}: {
  render: (searchParams: URLSearchParams) => ReactNode
}) {
  return (
    <Suspense fallback={render(NO_SEARCH_PARAMS)}>
      <ReadSearchParams render={render} />
    </Suspense>
  )
}
