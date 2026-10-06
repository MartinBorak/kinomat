import * as Sentry from '@sentry/nextjs'

import { SENTRY_DSN, SENTRY_ENVIRONMENT } from '@/lib/errorReporting'

if (SENTRY_DSN !== undefined) {
  Sentry.init({ dsn: SENTRY_DSN, environment: SENTRY_ENVIRONMENT })
}

// Navigation breadcrumbs, so a report says which pages led up to it.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
