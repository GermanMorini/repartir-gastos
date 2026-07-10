import { ShareIcon, UsersIcon } from "lucide-react"
import type { RefObject } from "react"
import { useState } from "react"
import { PaginationControls } from "../../components/shared/PaginationControls"
import { Button, Card } from "../../components/ui"
import type { FilaCalculo, Movimiento, Persona, ResumenCategoria, SaldoPersona, TransferenciaPendiente } from "../../types"
import { useIsMobile } from "../../lib/viewport"
import { CategoriasDialog } from "../total/CategoriasDialog"
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
  graficoOpen = false,
  onGraficoOpenChange = () => undefined,
  gastosPorCategoria = [],
  totalGastado = 0,
  onCopyCategorias = () => undefined,
  onExportGrafico = () => undefined,
  settlementOpen = false,
  onSettlementOpenChange = () => undefined,
  pendientes = [],
  resumenCopiable = "",
  onShareReparto = () => undefined,
}: ResumenSectionProps) {
  const isMobile = useIsMobile()
  const [page, setPage] = useState(1)
  const pageSize = isMobile ? 3 : saldos.length || 1
  const totalPages = Math.max(1, Math.ceil(saldos.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const visibleSaldos = saldos.slice((currentPage - 1) * pageSize, currentPage * pageSize)

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
          {isMobile ? (
            <CategoriasDialog data={gastosPorCategoria} onCopy={onCopyCategorias} onExport={onExportGrafico} onOpenChange={onGraficoOpenChange} open={graficoOpen} total={totalGastado} />
          ) : (
            <Button className="btn-outline" onClick={onShareLink} type="button"><ShareIcon data-icon="inline-start" />Compartir resumen</Button>
          )}
        </div>
      </div>
      <div className="summary-list">
        {saldos.length === 0 ? <p className="empty">Agregá personas para ver saldos.</p> : null}
        {visibleSaldos.map((saldo) => (
          <PersonaResumenItem key={saldo.persona} onClick={() => onResumenOpenPersonaChange(saldo.persona)} persona={saldo.persona} saldo={saldo.saldo} />
        ))}
      </div>
      {isMobile && saldos.length > 3 ? <PaginationControls page={currentPage} totalPages={totalPages} onPage={setPage} /> : null}
      <div className="summary-actions summary-bottom-actions" data-tour="total">
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
        {isMobile ? <Button className="btn-outline" onClick={onShareLink} type="button"><ShareIcon data-icon="inline-start" />Compartir resumen</Button> : null}
        {isMobile ? <RepartirDialog open={settlementOpen} onOpenChange={onSettlementOpenChange} pendientes={pendientes} resumenCopiable={resumenCopiable} onShare={onShareReparto} /> : null}
      </div>
    </Card>
  )
}
