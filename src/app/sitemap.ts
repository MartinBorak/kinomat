import { LANGUAGES } from 'kinomat-core/lib/language'
import { CINEMAS } from 'kinomat-core/types/cinema'
import { CITIES } from 'kinomat-core/types/city'
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

  // The bare listings only redirect to a city, so each city names its own and none is listed bare.
  return [
    ...CITIES.flatMap(({ id }) => [
      toEntry(`/${id}`),
      toEntry(`/${id}/program`),
      toEntry(`/${id}/filmy`),
      toEntry(`/${id}/kina`),
    ]),
    toEntry('/o-kinomate'),
    ...CINEMAS.map((cinema) => toEntry(`/${cinema.cityId}/kina/${cinema.id}`)),
    ...films.map((film) => toEntry(`/filmy/${film.publicId}`)),
  ]
}
