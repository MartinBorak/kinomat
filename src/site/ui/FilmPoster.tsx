import Image from 'next/image'

import { isExternalPoster, toPosterUrl } from '@/site/ui/posterUrl'

/*
 * Larger than the design's 124, at the 2:3 most posters are. Most, not all: TMDB serves whatever
 * ratio was uploaded, so the box is fixed and object-cover crops the odd one to it rather than
 * letting it stand shorter than the rest.
 */
export const POSTER_WIDTH = 180
export const POSTER_HEIGHT = 270

type FilmPosterProps = {
  posterPath: string | null
  /*
   * Which poster is the page's largest paint depends on the viewport, so the ones that can be are
   * loaded eagerly rather than any one of them preloaded.
   */
  isAboveFold?: boolean
  // The box the poster is cropped to; each view names its own phone size, md+ is the full 180x270.
  sizeClassName?: string
}

// A poster is decoration beside the title it belongs to, so it stays out of a screen reader's way.
export function FilmPoster({
  posterPath,
  isAboveFold = false,
  sizeClassName = 'h-[270px] w-[180px]',
}: FilmPosterProps) {
  if (posterPath === null) {
    return null
  }

  return (
    <Image
      src={toPosterUrl(posterPath)}
      alt=""
      width={POSTER_WIDTH}
      height={POSTER_HEIGHT}
      loading={isAboveFold ? 'eager' : 'lazy'}
      /*
       * The optimizer proxies only TMDB. A poster a person pointed at elsewhere is served as it is,
       * the box cropping it to size, rather than opening the optimizer to every host on the web.
       */
      unoptimized={isExternalPoster(posterPath)}
      // self-start: a stretched flex item would distort a poster to the height of a tall card.
      className={`flex-none self-start overflow-hidden rounded-[10px] object-cover ${sizeClassName}`}
    />
  )
}
