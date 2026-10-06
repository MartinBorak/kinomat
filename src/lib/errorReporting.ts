const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN

/*
 * One name for the browser and the server. Unset in development and tests, which leaves the SDK
 * off rather than reporting a laptop's errors as production's.
 */
export const SENTRY_DSN = dsn === '' ? undefined : dsn

export const SENTRY_ENVIRONMENT = process.env.NODE_ENV ?? 'development'
