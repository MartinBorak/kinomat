type EmptyStateProps = {
  title: string
  hint: string
}

// What a listing says in place of its cards when there are none.
export function EmptyState({ title, hint }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-2.5 px-[22px] py-[110px] text-center md:px-[6vw]">
      <p className="text-ink-soft m-0 text-[22px] font-light">{title}</p>
      <p className="text-ink-faint m-0 text-[13px] font-light">{hint}</p>
    </div>
  )
}
