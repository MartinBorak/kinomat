import { LANGUAGES } from 'kinomat-core/lib/language'
import { CINEMAS } from 'kinomat-core/types/cinema'
import { CITIES } from 'kinomat-core/types/city'
import { type MetadataRoute } from 'next'

import { toFilmSegment } from '@/site/films/hrefs'
import { readCityFilms } from '@/site/films/readFilms'
import { SITE_ORIGIN, toLanguagePath } from '@/site/seo/site'

/*
 * One entry per page in the default language, its variants named as alternates rather than repeated.
 * No lastModified: every listing changes daily, and a date that is always now teaches a crawler to
 * ignore it.
 */
function toEntry(path: string): MetadataRoute.Sitemap[number] {
  return {
    url: `${SITE_ORIGIN}${toLanguagePath(path, 'sk')}`,
    alternates: {
      languages: Object.fromEntries(
        LANGUAGES.map((language) => [language, `${SITE_ORIGIN}${toLanguagePath(path, language)}`]),
      ),
    },
  }
}

/*
 * The corpus holds only what is currently playing, so every film in it belongs in the sitemap, once
 * for each city it plays in: those are its pages.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const filmsByCity = await Promise.all(
    CITIES.map(async ({ id }) => ({ city: id, films: await readCityFilms(id) })),
  )

  /*
   * The bare listings only redirect to a city, so each city names its own and none is listed bare.
   * The front page is the other way round: one bare URL, in whichever city the reader is.
   */
  return [
    toEntry('/'),
    ...CITIES.flatMap(({ id }) => [
      toEntry(`/${id}/program`),
      toEntry(`/${id}/filmy`),
      toEntry(`/${id}/kina`),
    ]),
    toEntry('/o-kinomate'),
    ...CINEMAS.map((cinema) => toEntry(`/${cinema.cityId}/kina/${cinema.id}`)),
    ...filmsByCity.flatMap(({ city, films }) =>
      films.map((film) => toEntry(`/${city}/filmy/${toFilmSegment(film)}`)),
    ),
  ]
}
