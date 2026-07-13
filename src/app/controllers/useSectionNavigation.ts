import { useEffect, useRef, useState } from "react"
import type { MobileSection } from "../tutorial"

const sections: MobileSection[] = ["personas", "movimientos", "resumen"]

export function useSectionNavigation() {
  const [activeSection, setActiveSection] = useState<MobileSection>("personas")
  const [desktopSection, setDesktopSection] = useState<MobileSection>("personas")
  const [direction, setDirection] = useState<"forward" | "back">("forward")
  const [animating, setAnimating] = useState(false)
  const timerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null)

  useEffect(() => () => { if (timerRef.current) window.clearTimeout(timerRef.current) }, [])

  const goToSection = (section: MobileSection) => {
    const currentIndex = sections.indexOf(activeSection)
    const nextIndex = sections.indexOf(section)
    if (nextIndex !== currentIndex) {
      setDirection(nextIndex > currentIndex ? "forward" : "back")
      setAnimating(true)
      if (timerRef.current) window.clearTimeout(timerRef.current)
      timerRef.current = window.setTimeout(() => setAnimating(false), 230)
    }
    setActiveSection(section)
    if (matchMedia("(max-width: 719px)").matches) window.scrollTo({ top: 0, behavior: "smooth" })
  }
  const mobileViewClass = (section: MobileSection) => `mobile-view section-${direction} ${activeSection === section ? "is-active" : ""}`

  return { activeSection, desktopSection, direction, animating, setActiveSection, setDesktopSection, goToSection, mobileViewClass }
}
