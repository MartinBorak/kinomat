import type { MetadataRoute } from 'next'

/*
 * What Android reads when a reader saves the site to the home screen. Without it Chrome took the
 * transparent tab icon and set it on a white circle; the maskable icon is padded to survive the crop.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Kinomat',
    short_name: 'Kinomat',
    description: 'Program bratislavských kín na jednom mieste',
    start_url: '/',
    display: 'browser',
    background_color: '#0F1E45',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
