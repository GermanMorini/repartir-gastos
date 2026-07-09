import { ShareIcon } from "lucide-react"
import { useMemo } from "react"
import { toast, Toaster } from "sonner"
import { Button } from "../../components/ui"
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

  async function shareLink() {
    try {
      const url = window.location.href
      if (isMobile && navigator.share) {
        await navigator.share({ title: "Resumen compartido", url })
        toast.success("Resumen compartido.")
        return
      }
      await navigator.clipboard.writeText(url)
      toast.success("Link copiado.")
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return
      toast.error("No se pudo compartir el link.")
    }
  }

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
        <PersonSummaryMobilePage movimientos={decoded.state.movimientos} onShare={shareLink} personas={decoded.state.personas} readOnly />
      ) : (
        <>
          <header className="share-desktop-actions">
            <Button className="btn-outline" onClick={shareLink} type="button"><ShareIcon data-icon="inline-start" />Compartir link</Button>
          </header>
          <PersonSummaryDesktopView movimientos={decoded.state.movimientos} personas={decoded.state.personas} readOnly />
        </>
      )}
    </main>
  )
}
