import { type MetadataRoute } from 'next'

import { SITE_ORIGIN } from '@/site/seo/site'

// Every page here is public, and every crawler is welcome to it; the api routes answer pages, not readers.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: '/api/' },
    sitemap: `${SITE_ORIGIN}/sitemap.xml`,
  }
}
