import { ArrowDownLeftIcon, ArrowUpRightIcon, CopyIcon, ReceiptTextIcon, ShareIcon, UsersIcon, WalletCardsIcon } from "lucide-react"
import type { RefObject } from "react"
import { SlidingText } from "../../components/shared/SlidingText"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger, Button, Card, Dialog, DialogContent, DialogTitle, DialogTrigger, ScrollArea, Separator } from "../../components/ui"
import { getResumenPersona } from "../../lib/calculos"
import { formatoARS } from "../../lib/money"
import type { FilaCalculo, Movimiento, Persona, SaldoPersona } from "../../types"
import { CalculosDialog } from "./CalculosDialog"
import { PersonaResumenItem } from "./PersonaResumenItem"

type ResumenPersona = ReturnType<typeof getResumenPersona>

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
  resumenOpenPersona: Persona | null
  onResumenOpenPersonaChange: (persona: Persona | null) => void
  detalleResumenAbierto: string
  onDetalleResumenAbiertoChange: (value: string) => void
  onShareResumenPersona: (resumen: ResumenPersona) => void
}

function iniciales(persona: Persona) {
  return persona.split(/\s+/).filter(Boolean).slice(0, 2).map((parte) => parte[0]?.toUpperCase()).join("") || persona[0]?.toUpperCase() || "?"
}

function resultadoPersona(persona: Persona, saldo: number) {
  const centavos = Math.round(saldo * 100)
  if (centavos < 0) return `Debés transferir ${formatoARS.format(Math.abs(saldo))}`
  if (centavos > 0) return `Deben transferirte ${formatoARS.format(saldo)}`
  return `${persona} está al día`
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
  resumenOpenPersona,
  onResumenOpenPersonaChange,
  detalleResumenAbierto,
  onDetalleResumenAbiertoChange,
  onShareResumenPersona,
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
        {saldos.map((saldo) => {
          const resumen = getResumenPersona(saldo.persona, movimientos)
          const estado = Math.round(resumen.saldo * 100) < 0 ? "negative" : Math.round(resumen.saldo * 100) > 0 ? "positive" : "neutral"
          const pendiente = Math.round(resumen.saldo * 100) > 0 ? "Debe recibir" : Math.round(resumen.saldo * 100) < 0 ? "Debe pagar" : "Está al día"

          return (
            <Dialog key={saldo.persona} open={resumenOpenPersona === saldo.persona} onOpenChange={(open) => onResumenOpenPersonaChange(open ? saldo.persona : null)}>
              <DialogTrigger asChild>
                <PersonaResumenItem persona={saldo.persona} saldo={resumen.saldo} />
              </DialogTrigger>
              <DialogContent className="receipt-dialog" data-tour={saldo.persona === "Norberto" ? "resumen-norberto-dialog" : undefined}>
                <ScrollArea className="receipt-scroll">
                  <div className="receipt">
                    <header className="receipt-head">
                      <span className="receipt-avatar">{iniciales(saldo.persona)}</span>
                      <div>
                        <DialogTitle>Resumen de {saldo.persona}</DialogTitle>
                      </div>
                      <div className="receipt-actions">
                        <Button className="btn-outline receipt-copy" onClick={() => void onShareResumenPersona(resumen)} type="button">
                          <CopyIcon className="receipt-copy-desktop" data-icon="inline-start" />
                          <ShareIcon className="receipt-copy-mobile" data-icon="inline-start" />
                          <span className="receipt-copy-desktop">Copiar resumen</span>
                          <span className="receipt-copy-mobile">Compartir</span>
                        </Button>
                      </div>
                    </header>
                    <Separator />
                    {!resumen.tieneMovimientos ? <p className="empty">{saldo.persona} todavía no tiene movimientos.</p> : (
                      <>
                        <Card className={`receipt-result receipt-result-${estado}`}>
                          <SlidingText className="receipt-result-text">{resultadoPersona(saldo.persona, resumen.saldo)}</SlidingText>
                        </Card>
                        <div className="receipt-table">
                          <div><UsersIcon data-icon="inline-start" /><span>Le tocaba gastar</span><small></small><strong>{formatoARS.format(resumen.totalLeTocaba)}</strong></div>
                          <div><WalletCardsIcon data-icon="inline-start" /><span>Ya salió de su bolsillo</span><small></small><strong>{formatoARS.format(resumen.totalSalioBolsillo)}</strong></div>
                          <div><ArrowDownLeftIcon data-icon="inline-start" /><span>Ya recibió</span><small></small><strong>{formatoARS.format(resumen.totalRecibido)}</strong></div>
                          <div className="receipt-balance"><span>Resultado final</span><small>{pendiente}</small><strong className={estado}>{formatoARS.format(Math.abs(resumen.saldo))}</strong></div>
                        </div>
                        <Separator />
                        <Accordion className="receipt-detail" collapsible type="single" value={detalleResumenAbierto} onValueChange={onDetalleResumenAbiertoChange}>
                          <AccordionItem value="detalle">
                            <AccordionTrigger><span className="accordion-label"><ReceiptTextIcon data-icon="inline-start" />Detalle</span></AccordionTrigger>
                            <AccordionContent>
                              <div className="receipt-detail-list">
                                <section>
                                  <h3><ReceiptTextIcon data-icon="inline-start" />Gastos donde participó <strong>{formatoARS.format(resumen.totalLeTocaba)}</strong></h3>
                                  {resumen.gastosDondeParticipo.map(({ movimiento, montoParte }, index) => <p key={`participado-${index}`}><SlidingText>{movimiento.descripcion?.trim() || "Gasto"}</SlidingText> <SlidingText className="receipt-detail-amount"><strong>{formatoARS.format(montoParte)}</strong> de {formatoARS.format(movimiento.monto)}</SlidingText></p>)}
                                </section>
                                <section>
                                  <h3><WalletCardsIcon data-icon="inline-start" />Gastos que pagó <strong>{formatoARS.format(resumen.totalPuesto)}</strong></h3>
                                  {resumen.gastosQuePago.map((movimiento, index) => <p key={`pagado-${index}`}><SlidingText>{movimiento.descripcion?.trim() || "Gasto"}</SlidingText> <SlidingText className="receipt-detail-amount">{formatoARS.format(movimiento.monto)}</SlidingText></p>)}
                                </section>
                                <section>
                                  <h3><ArrowUpRightIcon data-icon="inline-start" />Pagos realizados <strong>{formatoARS.format(resumen.totalTransferido)}</strong></h3>
                                  {resumen.transferenciasEnviadas.map((movimiento, index) => <p key={`enviada-${index}`}><SlidingText>Pagó a {movimiento.a}</SlidingText> <SlidingText className="receipt-detail-amount">{formatoARS.format(movimiento.monto)}</SlidingText></p>)}
                                </section>
                                <section>
                                  <h3><ArrowDownLeftIcon data-icon="inline-start" />Pagos recibidos <strong>{formatoARS.format(resumen.totalRecibido)}</strong></h3>
                                  {resumen.transferenciasRecibidas.map((movimiento, index) => <p key={`recibida-${index}`}><SlidingText>Recibió de {movimiento.de}</SlidingText> <SlidingText className="receipt-detail-amount">{formatoARS.format(movimiento.monto)}</SlidingText></p>)}
                                </section>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      </>
                    )}
                  </div>
                </ScrollArea>
              </DialogContent>
            </Dialog>
          )
        })}
      </div>
    </Card>
  )
}
