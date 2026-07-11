import { ShareIcon, UsersIcon } from "lucide-react"
import type { RefObject } from "react"
import { useEffect, useRef, useState } from "react"
import { PaginationControls } from "../../components/shared/PaginationControls"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import type { FilaCalculo, Movimiento, Persona, ResumenCategoria, SaldoPersona, TransferenciaPendiente } from "../../types"
import { useIsMobile } from "../../lib/viewport"
import { RepartirDialog } from "../total/RepartirDialog"
import { CalculosDialog } from "./CalculosDialog"
import { PersonaResumenItem } from "./PersonaResumenItem"

type ResumenSectionProps = {
  className?: string
  saldos: SaldoPersona[]
  personas: Persona[]
  movimientos: Movimiento[]
  matrizCalculos: FilaCalculo[]
  calculosOpen: boolean
  onCalculosOpenChange: (open: boolean) => void
  calculosRef: RefObject<HTMLDivElement | null>
  onExportCalculos: () => void
  onResumenOpenPersonaChange: (persona: Persona | null) => void
  onShareLink: () => void
  graficoOpen?: boolean
  onGraficoOpenChange?: (open: boolean) => void
  gastosPorCategoria?: ResumenCategoria[]
  totalGastado?: number
  onCopyCategorias?: () => void
  onExportGrafico?: () => void
  settlementOpen?: boolean
  onSettlementOpenChange?: (open: boolean) => void
  pendientes?: TransferenciaPendiente[]
  resumenCopiable?: string
  onShareReparto?: () => void
  suppressListAnimation?: boolean
}

export function ResumenSection({
  className = "",
  saldos,
  personas,
  movimientos,
  matrizCalculos,
  calculosOpen,
  onCalculosOpenChange,
  calculosRef,
  onExportCalculos,
  onResumenOpenPersonaChange,
  onShareLink,
  settlementOpen = false,
  onSettlementOpenChange = () => undefined,
  pendientes = [],
  resumenCopiable = "",
  onShareReparto = () => undefined,
  suppressListAnimation = false,
}: ResumenSectionProps) {
  const isMobile = useIsMobile()
  const [page, setPage] = useState(1)
  const [pageDirection, setPageDirection] = useState<"next" | "prev">("next")
  const [pageAnimating, setPageAnimating] = useState(false)
  const pageAnimationTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null)
  const pageSize = isMobile ? 4 : saldos.length || 1
  const totalPages = Math.max(1, Math.ceil(saldos.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const visibleSaldos = saldos.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const goToPage = (nextPage: number) => {
    setPageDirection(nextPage > currentPage ? "next" : "prev")
    setPageAnimating(true)
    if (pageAnimationTimerRef.current) window.clearTimeout(pageAnimationTimerRef.current)
    pageAnimationTimerRef.current = window.setTimeout(() => setPageAnimating(false), 190)
    setPage(nextPage)
  }

  useEffect(() => () => {
    if (pageAnimationTimerRef.current) window.clearTimeout(pageAnimationTimerRef.current)
  }, [])

  return (
    <Card className={`summary-card ${className}`} id="resumen" data-tour="resumen">
      <div className="summary-head">
        <div className="section-title section-title-summary">
          <span className="section-icon"><UsersIcon /></span>
          <div>
            <h2>Resumen por persona</h2>
            <p className="summary-hint">
              <span className="hint-mobile">Toca en una persona para ver su hoja de liquidación.</span>
              <span className="hint-desktop">Clickeá en una persona para ver su hoja de liquidación.</span>
            </p>
          </div>
        </div>
        <div className="summary-actions summary-chart-action">
          {!isMobile ? (
            <Button className="btn-outline" onClick={onShareLink} type="button"><ShareIcon data-icon="inline-start" />Compartir resumen</Button>
          ) : null}
        </div>
      </div>
      <div className={`summary-list ${pageAnimating && !suppressListAnimation ? `page-slide-${pageDirection}` : ""}`} key={currentPage}>
        {saldos.length === 0 ? <Badge className="empty-state-badge">Sin saldos</Badge> : null}
        {visibleSaldos.map((saldo) => (
          <PersonaResumenItem key={saldo.persona} onClick={() => onResumenOpenPersonaChange(saldo.persona)} persona={saldo.persona} saldo={saldo.saldo} />
        ))}
      </div>
      {isMobile ? <PaginationControls page={currentPage} totalPages={totalPages} onPage={goToPage} /> : null}
      <div className="summary-actions summary-bottom-actions" data-tour="total">
        {!isMobile ? (
          <div className="summary-calculos-action">
            <CalculosDialog
              contentRef={calculosRef}
              filas={matrizCalculos}
              movimientosCount={movimientos.length}
              onExport={onExportCalculos}
              onOpenChange={onCalculosOpenChange}
              open={calculosOpen}
              personas={personas}
            />
          </div>
        ) : null}
        {isMobile ? <RepartirDialog open={settlementOpen} onOpenChange={onSettlementOpenChange} pendientes={pendientes} resumenCopiable={resumenCopiable} onShare={onShareReparto} /> : null}
        {isMobile ? <Button className="btn-outline summary-share-mobile" onClick={onShareLink} type="button"><ShareIcon data-icon="inline-start" />Compartir resumen</Button> : null}
      </div>
    </Card>
  )
}
