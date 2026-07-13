import { ChevronRightIcon } from "lucide-react"
import type { ReactNode } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { getBalancePresentation } from "../../domain/calculations/presentation"
import { formatoARS } from "../../lib/money"
import type { ResumenPersona } from "../../lib/calculos"
import { SlidingText } from "../../components/shared/SlidingText"
import { PersonAvatar } from "./PersonCarousel"
import type { DetailView } from "./model"

function SummaryActionRow({ label, amount, className = "", onClick }: { label: string; amount: ReactNode; className?: string; onClick?: () => void }) {
  const content = <><span>{label}</span><strong className={className}>{amount}</strong>{onClick ? <ChevronRightIcon /> : null}</>
  return onClick ? <button className="ps-stat-row" onClick={onClick} type="button">{content}</button> : <span className="ps-stat-row">{content}</span>
}

export function PersonSummaryCard({ resumen, onOpen, saldoClickable = false, showTransferButton = false }: { resumen: ResumenPersona; onOpen?: (view: DetailView) => void; saldoClickable?: boolean; showTransferButton?: boolean }) {
  const status = getBalancePresentation(resumen.saldo)
  return <Card className="ps-stats">
    <div className="ps-stats-person"><PersonAvatar className="ps-stats-avatar" persona={resumen.persona} /><h2><SlidingText>{resumen.persona}</SlidingText></h2><Badge className={status.className}>{status.label}</Badge></div>
    <div>
      <SummaryActionRow label="Le tocaba gastar" amount={formatoARS.format(resumen.totalLeTocaba)} onClick={onOpen ? () => onOpen("parte") : undefined} />
      <SummaryActionRow label="Gastó" amount={formatoARS.format(resumen.totalSalioBolsillo)} onClick={onOpen ? () => onOpen("gasto") : undefined} />
      <SummaryActionRow label="Ya recibió" amount={formatoARS.format(resumen.totalRecibido)} onClick={onOpen ? () => onOpen("recibido") : undefined} />
      <SummaryActionRow label="Saldo" amount={formatoARS.format(resumen.saldo)} className={status.className} onClick={saldoClickable && onOpen ? () => onOpen("transferencias") : undefined} />
    </div>
    {showTransferButton && onOpen ? <Button className="btn-outline ps-transfer-button" onClick={() => onOpen("transferencias")} type="button">{resumen.saldo > 0 ? "¿De quién recibe?" : "¿A quién le transfiere?"}</Button> : null}
  </Card>
}
