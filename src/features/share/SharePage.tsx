import { useMemo } from "react"
import { Toaster } from "sonner"
import { useIsMobile } from "../../lib/viewport"
import { PersonSummaryDesktopView, PersonSummaryMobilePage } from "../person-summary/PersonSummary"
import { decodeShareState } from "./decodeShare"
import "./share-page.css"
import "./share-mobile.css"
import "./share-desktop.css"

export function SharePage({ payload }: { payload: string }) {
  const isMobile = useIsMobile()
  const decoded = useMemo(() => {
    try {
      return { state: decodeShareState(payload), error: "" }
    } catch (err) {
      return { state: null, error: err instanceof Error ? err.message : "No se pudo abrir este resumen compartido." }
    }
  }, [payload])

  if (!decoded.state) {
    return (
      <main className="share-page share-error">
        <Toaster richColors position="top-center" />
        <h1>No se pudo abrir este resumen compartido.</h1>
        {decoded.error ? <p>{decoded.error}</p> : null}
      </main>
    )
  }

  return (
    <main className="share-page">
      <Toaster richColors position="top-center" />
      {isMobile ? (
        <PersonSummaryMobilePage movimientos={decoded.state.movimientos} personas={decoded.state.personas} readOnly />
      ) : (
        <PersonSummaryDesktopView movimientos={decoded.state.movimientos} personas={decoded.state.personas} readOnly />
      )}
    </main>
  )
}
