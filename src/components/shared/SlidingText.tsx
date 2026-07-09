import { useEffect, useRef, useState } from "react"
import type { CSSProperties, ReactNode } from "react"

export function SlidingText({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [distance, setDistance] = useState(0)

  useEffect(() => {
    const element = ref.current
    if (!element) return
    const measure = () => setDistance(Math.max(0, element.scrollWidth - element.clientWidth))
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [children])

  return (
    <span className={`${className} ${distance ? "marquee is-moving" : "marquee"}`} ref={ref} style={{ "--slide-distance": `${distance}px` } as CSSProperties}>
      <span>{children}</span>
    </span>
  )
}

export function SlidingNames({ names }: { names: string }) {
  return <SlidingText>{names}</SlidingText>
}
