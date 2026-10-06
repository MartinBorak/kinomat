import { type JsonLd, serializeJsonLd } from '@/site/seo/listingGraph'

// The graph a page describes itself with, for machines; nothing here renders.
export function StructuredData({ data }: { data: JsonLd }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  )
}
