import { useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/sonner"
import { useIsMobile } from "../../lib/viewport"
import { PersonSummaryDesktopView, PersonSummaryMobilePage } from "../person-summary/PersonSummary"
import { decodeShareState } from "./decodeShare"
import "./share-page.css"
import "./share-mobile.css"
import "./share-desktop.css"

export function SharePage({ payload }: { payload: string }) {
  const isMobile = useIsMobile()
  const volverAlSitio = () => {
    window.location.href = `${window.location.origin}${window.location.pathname}`
  }
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
        <Toaster richColors position={isMobile ? "top-center" : "bottom-left"} />
        <h1>No se pudo abrir este resumen compartido.</h1>
        {decoded.error ? <p>{decoded.error}</p> : null}
        <Button onClick={volverAlSitio} type="button">Volver al sitio</Button>
      </main>
    )
  }

  return (
    <main className="share-page">
      <Toaster richColors position={isMobile ? "top-center" : "bottom-left"} />
      <Button className="share-back" onClick={volverAlSitio} type="button">Volver al sitio</Button>
      {isMobile ? (
        <PersonSummaryMobilePage movimientos={decoded.state.movimientos} personas={decoded.state.personas} readOnly />
      ) : (
        <PersonSummaryDesktopView movimientos={decoded.state.movimientos} personas={decoded.state.personas} readOnly />
      )}
    </main>
  )
}
