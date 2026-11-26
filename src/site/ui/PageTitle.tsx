import { type ReactNode } from 'react'

/*
 * What the page is, as its one main heading, in a band under the header: the words a search for
 * it would use, which the cards below, each a film or a cinema, cannot say for the whole page.
 */
export function PageTitle({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="border-line relative flex flex-wrap items-baseline gap-x-5 gap-y-2.5 border-b px-[22px] py-6 md:px-[6vw]">
      <h1 className="m-0 text-[clamp(24px,3.2vw,34px)] leading-tight font-light tracking-[0.01em] text-white">
        {title}
      </h1>
      {children}
    </div>
  )
}

/*
 * The same heading for a page that shows what it is without one: the listings, whose header,
 * day strip and cards already say it. Screen readers and search engines still read it.
 */
export function HiddenPageTitle({ title }: { title: string }) {
  return <h1 className="sr-only">{title}</h1>
}
