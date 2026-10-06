// A small bordered link off our site: to a catalogue, to a cinema's own page, to a map.
export function OutboundLink({ label, href }: { label: string; href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener"
      className="border-accent/28 text-accent/90 hover:border-accent rounded-md border px-[9px] py-[3px] text-[9.5px] font-medium tracking-[0.16em] uppercase hover:text-white"
    >
      {label}
    </a>
  )
}
