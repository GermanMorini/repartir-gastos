import { type RefObject, useEffect, useState } from "react"

export const MOBILE_QUERY = "(max-width: 719px)"
const DEFAULT_HEIGHT = 720
const DEFAULT_WIDTH = 390

export function isMobileViewport() {
  return typeof window !== "undefined" && matchMedia(MOBILE_QUERY).matches
}

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => isMobileViewport())

  useEffect(() => {
    const media = matchMedia(MOBILE_QUERY)
    const update = () => setIsMobile(media.matches)
    update()
    media.addEventListener("change", update)
    return () => media.removeEventListener("change", update)
  }, [])

  return isMobile
}

function readViewportMetrics() {
  if (typeof window === "undefined") {
    return {
      height: DEFAULT_HEIGHT,
      width: DEFAULT_WIDTH,
      isMobile: false,
      safeBottom: 0,
      isShortHeight: false,
    }
  }

  const viewport = window.visualViewport
  const height = Math.round(viewport?.height ?? window.innerHeight)
  const width = Math.round(viewport?.width ?? window.innerWidth)
  const safeBottom = Math.max(0, window.innerHeight - (viewport?.height ?? window.innerHeight) - (viewport?.offsetTop ?? 0))

  return {
    height,
    width,
    isMobile: isMobileViewport(),
    safeBottom,
    isShortHeight: height < 680,
  }
}

export function useViewportMetrics() {
  const [metrics, setMetrics] = useState(readViewportMetrics)

  useEffect(() => {
    const update = () => setMetrics(readViewportMetrics())
    update()
    window.addEventListener("resize", update)
    window.addEventListener("orientationchange", update)
    window.visualViewport?.addEventListener("resize", update)
    window.visualViewport?.addEventListener("scroll", update)
    return () => {
      window.removeEventListener("resize", update)
      window.removeEventListener("orientationchange", update)
      window.visualViewport?.removeEventListener("resize", update)
      window.visualViewport?.removeEventListener("scroll", update)
    }
  }, [])

  return metrics
}

function visibleElementHeight(element: Element) {
  const styles = window.getComputedStyle(element)
  if (styles.display === "none" || styles.visibility === "hidden" || styles.position === "fixed" || styles.position === "absolute") return 0
  const rect = element.getBoundingClientRect()
  const marginTop = Number.parseFloat(styles.marginTop) || 0
  const marginBottom = Number.parseFloat(styles.marginBottom) || 0
  return rect.height + marginTop + marginBottom
}

function firstMeasuredItemHeight(list: HTMLElement, selector?: string, fallback = 72) {
  const item = selector ? list.querySelector(selector) : Array.from(list.children).find((child) => !child.classList.contains("empty-state-badge"))
  if (!(item instanceof HTMLElement)) return fallback
  const rect = item.getBoundingClientRect()
  return Math.max(1, rect.height || fallback)
}

export function useAdaptivePageSize({
  containerRef,
  listRef,
  itemSelector,
  fallbackItemHeight,
  min = 1,
  max = 7,
  enabled = true,
  bottomReserve = 0,
  deps = [],
}: {
  containerRef: RefObject<HTMLElement | null>
  listRef: RefObject<HTMLElement | null>
  itemSelector?: string
  fallbackItemHeight: number
  min?: number
  max?: number
  enabled?: boolean
  bottomReserve?: number
  deps?: unknown[]
}) {
  const metrics = useViewportMetrics()
  const [pageSize, setPageSize] = useState(min)

  useEffect(() => {
    if (!enabled) {
      setPageSize(max)
      return
    }

    const calculate = () => {
      const container = containerRef.current
      const list = listRef.current
      if (!container || !list) {
        setPageSize(min)
        return
      }

      const children = Array.from(container.children)
      const listIndex = children.indexOf(list)
      const followingHeight = listIndex >= 0
        ? children.slice(listIndex + 1).reduce((total, element) => total + visibleElementHeight(element), 0)
        : 0

      const listTop = list.getBoundingClientRect().top
      const viewportBottom = metrics.height - Math.max(metrics.safeBottom, 0) - bottomReserve
      const availableHeight = Math.max(0, viewportBottom - listTop - followingHeight)
      const itemHeight = firstMeasuredItemHeight(list, itemSelector, fallbackItemHeight)
      const nextPageSize = Math.max(min, Math.min(max, Math.floor(availableHeight / itemHeight)))
      list.style.setProperty("--adaptive-list-height", `${Math.max(itemHeight, availableHeight)}px`)
      list.style.setProperty("--adaptive-item-height", `${itemHeight}px`)
      setPageSize(Number.isFinite(nextPageSize) ? nextPageSize : min)
    }

    calculate()
    const observer = new ResizeObserver(calculate)
    if (containerRef.current) observer.observe(containerRef.current)
    if (listRef.current) observer.observe(listRef.current)
    window.requestAnimationFrame(calculate)
    return () => observer.disconnect()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, metrics.height, metrics.safeBottom, metrics.width, min, max, fallbackItemHeight, bottomReserve, itemSelector, ...deps])

  return pageSize
}
