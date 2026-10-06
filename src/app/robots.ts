import { type MetadataRoute } from 'next'

import { SITE_ORIGIN } from '@/site/seo/site'

// Everything here is public, and every crawler is welcome to it.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: `${SITE_ORIGIN}/sitemap.xml`,
  }
}
