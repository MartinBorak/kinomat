import { SCHEDULE_TAG } from 'kinomat-core/lib/scheduleTag'
import { revalidateTag } from 'next/cache'

/*
 * How a publish reaches the cache: the pipeline writes the database and then posts here. Timed
 * expiry was measured not to be enough - a listing sat 98 minutes stale on a minutes profile.
 */
export function POST(request: Request): Response {
  const secret = process.env.PUBLISH_SECRET

  if (secret === undefined || secret === '' || request.headers.get('x-publish-secret') !== secret) {
    return new Response(null, { status: 401 })
  }

  revalidateTag(SCHEDULE_TAG, 'max')

  return new Response('schedule revalidated\n')
}
