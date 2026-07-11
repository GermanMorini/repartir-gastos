import { WalletCardsIcon } from "lucide-react"
import { MoneyAmount } from "../../components/shared/MoneyAmount"
import { Card } from "@/components/ui/card"
import type { ResumenCategoria, TransferenciaPendiente } from "../../types"
import { CategoriasDialog } from "./CategoriasDialog"
import { RepartirDialog } from "./RepartirDialog"

type TotalSectionProps = {
  className?: string
  graficoOpen: boolean
  onGraficoOpenChange: (open: boolean) => void
  gastosPorCategoria: ResumenCategoria[]
  totalGastado: number
  promedio: number
  settlementOpen: boolean
  onSettlementOpenChange: (open: boolean) => void
  pendientes: TransferenciaPendiente[]
  resumenCopiable: string
  onCopyCategorias: () => void
  onExportGrafico: () => void
  onShareReparto: () => void
}

export function TotalSection({
  className = "",
  graficoOpen,
  onGraficoOpenChange,
  gastosPorCategoria,
  totalGastado,
  promedio,
  settlementOpen,
  onSettlementOpenChange,
  pendientes,
  resumenCopiable,
  onCopyCategorias,
  onExportGrafico,
  onShareReparto,
}: TotalSectionProps) {
  return (
    <Card className={`totals-card ${className}`} id="totales" data-tour="total">
      <div className="totals-head">
        <div className="section-title section-title-total">
          <span className="section-icon"><WalletCardsIcon /></span>
          <div>
            <h2>Total</h2>
            <p>Resumen general del viaje.</p>
          </div>
        </div>
        <CategoriasDialog data={gastosPorCategoria} onCopy={onCopyCategorias} onExport={onExportGrafico} onOpenChange={onGraficoOpenChange} open={graficoOpen} total={totalGastado} />
      </div>
      <div className="totals-grid">
        <div>
          <span>Total gastado</span>
          <MoneyAmount value={totalGastado} />
        </div>
        <div>
          <span>Por persona (promedio)</span>
          <MoneyAmount value={promedio} />
        </div>
      </div>
      <RepartirDialog open={settlementOpen} onOpenChange={onSettlementOpenChange} pendientes={pendientes} resumenCopiable={resumenCopiable} onShare={onShareReparto} />
    </Card>
  )
}
