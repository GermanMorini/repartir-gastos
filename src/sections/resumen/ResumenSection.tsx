import { ShareIcon, UsersIcon } from "lucide-react"
import type { RefObject } from "react"
import { Button, Card } from "../../components/ui"
import type { FilaCalculo, Movimiento, Persona, SaldoPersona } from "../../types"
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
}: ResumenSectionProps) {
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
        <div className="summary-actions">
          <Button className="btn-outline" onClick={onShareLink} type="button"><ShareIcon data-icon="inline-start" />Compartir resumen</Button>
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
      </div>
      <div className="summary-list">
        {saldos.length === 0 ? <p className="empty">Agregá personas para ver saldos.</p> : null}
        {saldos.map((saldo) => (
          <PersonaResumenItem key={saldo.persona} onClick={() => onResumenOpenPersonaChange(saldo.persona)} persona={saldo.persona} saldo={saldo.saldo} />
        ))}
      </div>
    </Card>
  )
}
