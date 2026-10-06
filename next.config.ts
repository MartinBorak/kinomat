import { withSentryConfig } from '@sentry/nextjs/config'
import type { NextConfig } from 'next'

/*
 * What every response says about itself. Nothing here is framed, needs a device, or should be
 * sniffed into another type; HSTS is the host's, since it is the host that terminates TLS.
 */
const SECURITY_HEADERS = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Content-Security-Policy', value: "frame-ancestors 'none'" },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
]

const nextConfig: NextConfig = {
  headers: () => Promise.resolve([{ source: '/(.*)', headers: SECURITY_HEADERS }]),
  // The host's own domain serves the same pages; one canonical host keeps search engines on ours.
  redirects: () =>
    Promise.resolve([
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'kinomat.vercel.app' }],
        destination: 'https://kinomat.sk/:path*',
        permanent: true,
      },
    ]),
  // Every listing is the same for everyone, so it is worth caching rather than re-querying per reader.
  cacheComponents: true,
  // The shared package ships TypeScript source, which Next leaves alone in node_modules unless told.
  transpilePackages: ['kinomat-core'],
  images: {
    // Posters are TMDB's, served from its own CDN; the optimizer fetches from nowhere else.
    remotePatterns: [new URL('https://image.tmdb.org/t/p/**')],
    /*
     * The poster column's width and twice it (see POSTER_WIDTH). Without them the nearest sizes
     * Next has to offer are 256 and 384, which is a poster's worth of pixels nothing displays.
     */
    imageSizes: [180, 360],
  },
}

/*
 * Source maps make a report name the line that threw rather than a minified chunk. Only a deploy
 * build publishes them, so a local build neither needs the auth token nor leaves a release behind.
 */
export default withSentryConfig(nextConfig, {
  org: 'martin-borak',
  project: 'kinomat',
  silent: !process.env.CI,
  widenClientFileUpload: true,
  sourcemaps: { disable: !process.env.CI },
})
