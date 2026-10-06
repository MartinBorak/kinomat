import { Outfit } from 'next/font/google'
import { type ReactNode } from 'react'

import '@/app/globals.css'

const outfit = Outfit({
  variable: '--font-outfit',
  subsets: ['latin', 'latin-ext'],
  weight: ['300', '400', '500', '600'],
})

/*
 * The html and body the root layout renders, kept apart from it so the error boundary at the
 * root can render the same shell.
 */
export function Document({ lang, children }: { lang: string; children: ReactNode }) {
  return (
    <html lang={lang} className={`${outfit.variable} h-full antialiased`}>
      <body className="bg-surface text-ink flex min-h-full flex-col font-sans">{children}</body>
    </html>
  )
}
