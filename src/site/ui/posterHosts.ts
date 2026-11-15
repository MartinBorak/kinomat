/*
 * Where the distributors the pipeline reads keep their posters. The image optimizer fetches only from
 * these and TMDB, so a distributor added to the pipeline is added here too; a poster anywhere else
 * is served as it is.
 */
export const DISTRIBUTOR_POSTER_PREFIXES = [
  'https://asfk.sk/wp-content/uploads/',
  'https://www.cinemart.sk/wp-content/uploads/',
  'https://www.filmtopia.sk/uploads/files/',
  'https://www.itafilm.sk/wp-content/uploads/',
  'https://www.magicbox.sk/wp-content/uploads/',
] as const
