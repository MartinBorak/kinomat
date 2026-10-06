type ClearButtonProps = {
  label: string
  onClick: () => void
}

// The cross that empties a search field: a small mark inside a target a thumb can hit.
export function ClearButton({ label, onClick }: ClearButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="text-ink-faint hover:text-ink -mr-2.5 flex size-8 flex-none cursor-pointer items-center justify-center"
    >
      <span aria-hidden className="icon-[lucide--x] size-4" />
    </button>
  )
}
