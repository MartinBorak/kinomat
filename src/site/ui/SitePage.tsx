import { type ReactNode } from 'react'

// Every view's frame: a full-height column under the faint glow the top of each page carries.
export function SitePage({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-[radial-gradient(85%_40%_at_50%_-14%,oklch(0.86_0.08_245/0.13),transparent_66%)]">
      {children}
    </div>
  )
}
