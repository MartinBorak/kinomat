'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

import { Document } from '@/site/ui/Document'

/*
 * Stands in for the root layout when a render dies above every other boundary. Slovak, since the
 * language segment died with it.
 */
export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string }
  retry: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <Document lang="sk">
      <main className="m-auto p-4 text-center">
        <h1 className="text-xl font-medium">Niečo sa pokazilo</h1>
        <button type="button" onClick={retry} className="mt-4 underline">
          Skúsiť znova
        </button>
      </main>
    </Document>
  )
}
