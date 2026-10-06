import * as Sentry from '@sentry/nextjs'

import { SENTRY_DSN, SENTRY_ENVIRONMENT } from '@/lib/errorReporting'

export function register(): void {
  if (SENTRY_DSN === undefined) {
    return
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: SENTRY_ENVIRONMENT,
    // Nothing a reader sends belongs in an error report.
    dataCollection: { cookies: false, httpBodies: [] },
  })
}

export const onRequestError = Sentry.captureRequestError
