import { ArrowUpRightIcon, ChevronLeftIcon, MoveDownLeft, MoveUpRight } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { CategoriaIcon } from "../../components/shared/CategoryBadge"
import { formatoARS } from "../../lib/money"
import { nombreMovimiento } from "../../lib/share-text"
import type { ResumenPersona } from "../../lib/calculos"
import type { DetailView, PendingPersonTransfer } from "./model"
import { copyText } from "../../infrastructure/browser/sharing"

function copyAmount(monto: number) {
  const value = Math.abs(monto).toFixed(2).replace(".", ",")
  void copyText(monto < 0 ? `-${value}` : value).then((result) => result === "copied" ? toast.success("Monto copiado.") : toast.error("No se pudo copiar el monto."))
}

function DetailRows({ resumen, view, pendientes }: { resumen: ResumenPersona; view: DetailView; pendientes: PendingPersonTransfer[] }) {
  if (view === "parte") return <>{resumen.gastosDondeParticipo.map(({ movimiento, montoParte }, index) => <p className="ps-part-row" key={`${view}-${index}`}><span className="ps-row-icon"><CategoriaIcon categoria={movimiento.categoria} /></span><span><strong>{nombreMovimiento(movimiento)}</strong></span><b>{formatoARS.format(montoParte)} <small>(de {formatoARS.format(movimiento.monto)})</small></b></p>)}</>
  if (view === "gasto") return <>{resumen.gastosQuePago.map((movimiento, index) => <p className="ps-part-row" key={`gasto-${index}`}><span className="ps-row-icon"><CategoriaIcon categoria={movimiento.categoria} /></span><span><strong>{nombreMovimiento(movimiento)}</strong></span><b>{formatoARS.format(movimiento.monto)}</b></p>)}{resumen.transferenciasEnviadas.map((movimiento, index) => <p className="ps-part-row" key={`transferido-${index}`}><span className="ps-row-icon ps-transfer-icon"><ArrowUpRightIcon /></span><span><strong>A {movimiento.a}</strong><small>Pago realizado</small></span><b>{formatoARS.format(movimiento.monto)}</b></p>)}</>
  if (view === "recibido") return <>{resumen.transferenciasRecibidas.map((movimiento, index) => <p className="ps-part-row" key={`recibido-${index}`}><span className="ps-row-icon ps-received-icon"><MoveDownLeft /></span><span><strong>De {movimiento.de}</strong><small>Pago recibido</small></span><b>{formatoARS.format(movimiento.monto)}</b></p>)}</>
  return <>{pendientes.length === 0 ? <p className="empty">Las cuentas están equilibradas.</p> : null}{pendientes.map((transferencia, index) => <button className="ps-part-row ps-transfer-row" key={`${transferencia.tipo}-${index}`} onClick={() => copyAmount(transferencia.monto)} type="button"><span className="ps-row-icon ps-pending-icon">{transferencia.tipo === "pagar" ? <MoveUpRight /> : <MoveDownLeft />}</span><span><strong>{transferencia.tipo === "pagar" ? `A ${transferencia.persona}` : `De ${transferencia.persona}`}</strong><small>{transferencia.tipo === "pagar" ? "Debe transferir" : "Debe recibir"}</small></span><b>{formatoARS.format(transferencia.monto)}</b></button>)}</>
}

export function PersonSummaryDetail({ resumen, view, pendientes, onBack, closing = false }: { resumen: ResumenPersona; view: DetailView; pendientes: PendingPersonTransfer[]; onBack?: () => void; closing?: boolean }) {
  const titles = {
    parte: ["Su parte de los gastos", "Lo que le corresponde de cada gasto", resumen.totalLeTocaba],
    gasto: ["Lo que pagó", "Gastos y pagos que realizó", resumen.totalSalioBolsillo],
    recibido: ["Lo que le transfirieron", "Pagos que recibió", resumen.totalRecibido],
    transferencias: ["Transferencias", resumen.saldo < 0 ? "Pagos que debe realizar" : "Pagos que debe recibir", Math.abs(resumen.saldo)],
  } as const
  const [title, subtitle, amount] = titles[view]
  return <Card className={`ps-detail-list ps-detail-${view}${closing ? " is-closing" : ""}${view === "transferencias" && resumen.saldo < 0 ? " negative" : ""}`}>
    <header><strong>{title}</strong><small>{subtitle}</small><b>{formatoARS.format(amount)}</b>{view === "transferencias" && resumen.saldo < 0 ? <span className="ps-transfer-hint">Toca un monto para copiarlo al portapapeles</span> : null}</header>
    <Separator />
    <ScrollArea className="ps-detail-scroll"><div><DetailRows pendientes={pendientes} resumen={resumen} view={view} />{view !== "transferencias" && !resumen.tieneMovimientos ? <p className="empty">{resumen.persona} todavía no tiene movimientos.</p> : null}</div></ScrollArea>
    {onBack ? <Button className="btn-outline ps-bottom-back" onClick={onBack} type="button"><ChevronLeftIcon />Volver</Button> : null}
  </Card>
}
