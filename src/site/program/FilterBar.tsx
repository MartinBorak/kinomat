import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { type ReactNode } from 'react'

import { type FilterBarCopy, type FilterCopy } from '@/site/program/copy'
import {
  DIMENSIONS,
  type Dimension,
  type FilterOption,
  type FilterOptions,
  type ProgramFilters,
  type Selection,
  hasAnyFilter,
  NO_FILTERS,
  toggleValue,
} from '@/site/program/filters'
import { scrollToPosition, toPositionUnderBar } from '@/site/ui/scrolling'

type FilterBarProps = {
  filters: ProgramFilters
  options: FilterOptions
  // What the bar says it is showing, already counted: a day counts its films, a film its showings.
  countLabel: string
  copy: FilterBarCopy
  onChange: (filters: ProgramFilters) => void
  // The menus this view offers: a cinema's own page has no use for one that chooses the cinema.
  dimensions?: readonly Dimension[]
  // The row starts with whatever the view puts there, which for the schedule is its search field.
  children?: ReactNode
}

// Shared with the Films view, whose ordering menu stands in a row of these.
export const PILL =
  'flex h-[42px] items-center gap-3 rounded-full border px-4 text-[12.5px] font-light tracking-[0.04em] whitespace-nowrap'

// What the pill says the menu is set to, which for a single choice is that choice's own name.
function toSummary(selection: Selection, options: readonly FilterOption[], copy: FilterCopy) {
  if (selection.length === 0) {
    return copy.all
  }

  const only = options.find((option) => option.value === selection[0])

  return selection.length === 1 && only !== undefined
    ? only.label
    : `${copy.plural} (${selection.length})`
}

function Checkbox({
  option,
  isChecked,
  onToggle,
}: {
  option: FilterOption
  isChecked: boolean
  onToggle: () => void
}) {
  return (
    <label className="hover:bg-surface-hover flex cursor-pointer items-center gap-[11px] rounded-[10px] px-3 py-2.5">
      <input type="checkbox" checked={isChecked} onChange={onToggle} className="peer sr-only" />
      <span
        aria-hidden
        className={`peer-focus-visible:ring-accent/60 flex size-[17px] flex-none items-center justify-center rounded-[5px] border peer-focus-visible:ring-2 ${
          isChecked ? 'bg-accent border-accent' : 'border-accent/40'
        }`}
      >
        {isChecked && <span className="text-accent-ink icon-[lucide--check] size-3.5" />}
      </span>
      <span className="text-ink text-[13.5px] font-light">{option.label}</span>
    </label>
  )
}

function FilterMenu({
  dimension,
  options,
  selection,
  copy,
  isOpen,
  onOpen,
  onSelect,
}: {
  dimension: Dimension
  options: readonly FilterOption[]
  selection: Selection
  copy: FilterBarCopy
  isOpen: boolean
  onOpen: () => void
  onSelect: (selection: Selection) => void
}) {
  const menuCopy = copy.filters[dimension]
  const summary = toSummary(selection, options, menuCopy)

  const panel = useRef<HTMLDivElement>(null)
  const [shift, setShift] = useState(0)

  // A pill near the right edge would push its menu off screen; measured open, shifted back in.
  useLayoutEffect(() => {
    if (!isOpen || panel.current === null) {
      setShift(0)

      return
    }

    const { right } = panel.current.getBoundingClientRect()
    const overflow = right - (document.documentElement.clientWidth - 22)

    setShift(Math.min(0, -overflow))
  }, [isOpen])

  return (
    <div className="relative flex">
      <button
        type="button"
        onClick={onOpen}
        aria-expanded={isOpen}
        aria-label={`${menuCopy.name}: ${summary}`}
        className={`${PILL} text-ink cursor-pointer ${
          isOpen ? 'bg-surface-hover border-accent/60' : 'bg-surface-raised border-accent/28'
        }`}
      >
        {summary}
        <span aria-hidden className="text-accent/90 icon-[lucide--chevron-down] size-3.5" />
      </button>

      {isOpen && (
        <div
          ref={panel}
          role="group"
          aria-label={menuCopy.name}
          style={{ left: shift }}
          className="border-accent/28 bg-surface-raised absolute top-[50px] z-20 max-w-[calc(100vw-44px)] min-w-[240px] rounded-2xl border p-2 shadow-[0_26px_60px_oklch(0.12_0.02_255/0.7)]"
        >
          {/* Always there, so the first tick does not push the list a row down under the pointer. */}
          <button
            type="button"
            onClick={() => onSelect([])}
            disabled={selection.length === 0}
            className="border-line text-accent/90 disabled:text-ink-faint mb-1 w-full cursor-pointer border-b px-3 pt-2 pb-2.5 text-left text-[10px] tracking-[0.16em] uppercase disabled:cursor-default"
          >
            {copy.selectNone}
          </button>

          {options.map((option) => (
            <Checkbox
              key={option.value}
              option={option}
              isChecked={selection.includes(option.value)}
              onToggle={() => onSelect(toggleValue(selection, options, option.value))}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/*
 * The search field and the four menus, over the day as it arrived rather than as they leave it -
 * so narrowing to one cinema does not take the other cinemas out of the menu that chose it.
 */
export function FilterBar({
  filters,
  options,
  countLabel,
  copy,
  onChange,
  dimensions = DIMENSIONS,
  children,
}: FilterBarProps) {
  const [openDimension, setOpenDimension] = useState<Dimension | null>(null)
  // Collapsed by default on a phone, where the row costs half a screen; xl+ ignores it entirely.
  const [isExpanded, setIsExpanded] = useState(false)
  // Only a body no longer animating may show overflow, or the slide would spill the pills early.
  const [isSettled, setIsSettled] = useState(false)
  const row = useRef<HTMLDivElement>(null)

  const activeCount =
    (filters.query === '' ? 0 : 1) +
    dimensions.filter((dimension) => filters[dimension].length > 0).length

  /*
   * A ticked filter means a different list, so a reader deep in the old one is brought back to its
   * first card, just under the stuck bar; one already above it is left where they are.
   */
  function changeFilters(next: ProgramFilters) {
    onChange(next)

    const bar = row.current
    const listing = bar?.nextElementSibling

    if (bar == null || listing == null) {
      return
    }

    const top = toPositionUnderBar(listing, bar)

    if (window.scrollY > top) {
      scrollToPosition(top)
    }
  }

  // A menu is dismissed the way every menu is: by looking away from it, or by saying no.
  useEffect(() => {
    function closeOnOutside(event: PointerEvent) {
      if (!row.current?.contains(event.target as Node)) {
        setOpenDimension(null)
      }
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpenDimension(null)
      }
    }

    document.addEventListener('pointerdown', closeOnOutside)
    document.addEventListener('keydown', closeOnEscape)

    return () => {
      document.removeEventListener('pointerdown', closeOnOutside)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [])

  // The list's toolbar rides along on a scroll; blurred backdrop, or the cards would shine through.
  return (
    <div
      ref={row}
      data-sticky-bar
      className="border-line bg-surface/85 sticky top-0 z-30 flex flex-wrap items-center gap-2.5 border-b px-[22px] py-4 backdrop-blur-md md:px-[6vw]"
    >
      {/* Plain text with a caret, so the switch that reveals the pills does not pose as one of them. */}
      <button
        type="button"
        onClick={() => {
          setIsExpanded(!isExpanded)
          setIsSettled(false)
        }}
        aria-expanded={isExpanded}
        className="text-ink hover:text-accent flex cursor-pointer items-center gap-2 py-2 text-[10px] tracking-[0.16em] uppercase xl:hidden"
      >
        <span>
          {copy.showFilters}
          {activeCount > 0 && <span className="text-accent"> ({activeCount})</span>}
        </span>
        <span
          aria-hidden
          className={`text-accent/90 size-3.5 ${
            isExpanded ? 'icon-[lucide--chevron-up]' : 'icon-[lucide--chevron-down]'
          }`}
        />
      </button>

      {/* One count in the corner at every width: beside the toggle on a phone, after the pills on md. */}
      <span className="text-ink-faint ml-auto text-[10px] tracking-[0.16em] whitespace-nowrap uppercase xl:order-last">
        {countLabel}
      </span>

      {/*
       * The grid-rows 0fr/1fr pair is what animates the height; display holds through the collapse
       * (transition-discrete) and the expansion starts from the closed row (starting:). On xl the
       * wrapper dissolves (contents) and the body is always open.
       */}
      <div
        onTransitionEnd={(event) => event.target === event.currentTarget && setIsSettled(true)}
        className={`${
          isExpanded ? 'grid grid-rows-[1fr] starting:grid-rows-[0fr]' : 'hidden grid-rows-[0fr]'
        } basis-full transition-[grid-template-rows,display] transition-discrete duration-300 ease-out motion-reduce:transition-none xl:contents`}
      >
        <div
          className={`${
            isExpanded && isSettled ? '' : 'overflow-hidden'
          } flex min-h-0 flex-wrap items-center gap-2.5 xl:flex-1 xl:overflow-visible`}
        >
          {children}

          {/*
           * A dimension the day says nothing about has nothing to tick, so its menu is left out. One a
           * link arrived with is kept whatever the day holds, a filter nobody can see being one nobody
           * can undo.
           */}
          {dimensions
            .filter((dimension) => options[dimension].length > 0 || filters[dimension].length > 0)
            .map((dimension) => (
              <FilterMenu
                key={dimension}
                dimension={dimension}
                options={options[dimension]}
                selection={filters[dimension]}
                copy={copy}
                isOpen={openDimension === dimension}
                onOpen={() => setOpenDimension(openDimension === dimension ? null : dimension)}
                onSelect={(selection) => changeFilters({ ...filters, [dimension]: selection })}
              />
            ))}

          {hasAnyFilter(filters) && (
            <button
              type="button"
              onClick={() => changeFilters(NO_FILTERS)}
              className="text-ink-muted hover:text-accent ml-auto cursor-pointer text-[10px] tracking-[0.16em] uppercase"
            >
              {copy.resetFilters}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
