import { LANGUAGES } from 'kinomat-core/lib/language'
import { CINEMAS } from 'kinomat-core/types/cinema'
import { type MetadataRoute } from 'next'

import { readPlayingFilms } from '@/site/films/readFilms'
import { SITE_ORIGIN, toLanguagePath } from '@/site/seo/site'

// One entry per page in the default language, its variants named as alternates rather than repeated.
function toEntry(path: string): MetadataRoute.Sitemap[number] {
  return {
    url: `${SITE_ORIGIN}${toLanguagePath(path, 'sk')}`,
    lastModified: new Date(),
    alternates: {
      languages: Object.fromEntries(
        LANGUAGES.map((language) => [language, `${SITE_ORIGIN}${toLanguagePath(path, language)}`]),
      ),
    },
  }
}

// The corpus holds only what is currently playing, so every film in it belongs in the sitemap.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const films = await readPlayingFilms()

  return [
    toEntry('/'),
    toEntry('/program'),
    toEntry('/filmy'),
    toEntry('/kina'),
    toEntry('/o-kinomate'),
    ...CINEMAS.map((cinema) => toEntry(`/kina/${cinema.id}`)),
    ...films.map((film) => toEntry(`/filmy/${film.publicId}`)),
  ]
}
