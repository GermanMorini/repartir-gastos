import { lazy, Suspense, useEffect, useState } from "react"
import EditableApp from "./EditableApp"

const SharePage = lazy(() => import("../features/share/SharePage").then((module) => ({ default: module.SharePage })))

export default function App() {
  const [hash, setHash] = useState(() => window.location.hash)

  useEffect(() => {
    const update = () => setHash(window.location.hash)
    window.addEventListener("hashchange", update)
    return () => window.removeEventListener("hashchange", update)
  }, [])

  if (hash.startsWith("#/share/")) return <Suspense fallback={null}><SharePage payload={hash.slice("#/share/".length)} /></Suspense>
  return <EditableApp />
}
