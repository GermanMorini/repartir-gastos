import { useEffect, useState } from "react"

export const MOBILE_QUERY = "(max-width: 719px)"

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
