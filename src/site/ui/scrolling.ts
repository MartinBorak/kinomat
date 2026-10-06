function readScrollBehavior(): ScrollBehavior {
  return matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
}

export function scrollToPosition(top: number) {
  window.scrollTo({ top, behavior: readScrollBehavior() })
}

// The bar is stuck to the top by the time the scroll ends, so only its height is in the way.
export function toPositionUnderBar(element: Element, bar: Element | undefined): number {
  return (
    window.scrollY +
    element.getBoundingClientRect().top -
    (bar?.getBoundingClientRect().height ?? 0)
  )
}
