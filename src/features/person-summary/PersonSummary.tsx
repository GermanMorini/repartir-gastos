import { ArrowLeftIcon, ArrowUpRightIcon, ChevronLeftIcon, ChevronRightIcon, MoveDownLeft, MoveUpRight, ShareIcon, UsersIcon } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import type { ReactNode } from "react"
import { CategoriaIcon } from "../../components/shared/CategoryBadge"
import { SlidingText } from "../../components/shared/SlidingText"
import { toast } from "sonner"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import type { CarouselApi } from "@/components/ui/carousel"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { calcularSaldos, calcularTransferenciasPendientes, getResumenPersona } from "../../lib/calculos"
import { formatoARS } from "../../lib/money"
import { nombreMovimiento } from "../../lib/share-text"
import type { Movimiento, Persona } from "../../types"
import "./person-summary.css"

type ResumenPersona = ReturnType<typeof getResumenPersona>
type DetailView = "parte" | "gasto" | "recibido" | "transferencias"
type PendingPersonTransfer = { tipo: "pagar" | "recibir"; persona: Persona; monto: number }

type PersonSummaryProps = {
  personas: Persona[]
  movimientos: Movimiento[]
  initialPersona?: Persona | null
  initialDetail?: DetailView | null
  readOnly?: boolean
  title?: string
  onBack?: () => void
  onShare?: (persona: Persona) => void
  closing?: boolean
}

function iniciales(persona: Persona) {
  return persona.split(/\s+/).filter(Boolean).slice(0, 2).map((parte) => parte[0]?.toUpperCase()).join("") || persona[0]?.toUpperCase() || "?"
}

function estadoSaldo(saldo: number) {
  const centavos = Math.round(saldo * 100)
  if (centavos > 0) return { label: "A favor", className: "positive" }
  if (centavos < 0) return { label: "Debe", className: "negative" }
  return { label: "Al día", className: "neutral" }
}

function formatAmountForPayment(monto: number) {
  const isNegative = monto < 0
  const value = Math.abs(monto).toFixed(2).replace(".", ",")
  return isNegative ? `-${value}` : value
}

function copyAmount(monto: number) {
  navigator.clipboard.writeText(formatAmountForPayment(monto))
    .then(() => toast.success("Monto copiado."))
    .catch(() => toast.error("No se pudo copiar el monto."))
}

function useSelectedPersona(personas: Persona[], initialPersona?: Persona | null) {
  const [selected, setSelected] = useState(initialPersona ?? personas[0] ?? "")
  useEffect(() => setSelected(initialPersona ?? personas[0] ?? ""), [initialPersona, personas])
  return [selected, setSelected] as const
}

function PersonAvatar({ persona, className = "" }: { persona: Persona; className?: string }) {
  return <Avatar className={className}><AvatarFallback>{iniciales(persona)}</AvatarFallback></Avatar>
}

function PersonCarousel({ personas, selected, onSelect, renderItem, showArrows = true, showPagination = false }: { personas: Persona[]; selected: Persona; onSelect: (persona: Persona) => void; renderItem?: (persona: Persona) => ReactNode; showArrows?: boolean; showPagination?: boolean }) {
  const [api, setApi] = useState<CarouselApi>()
  const selectedIndex = Math.max(0, personas.indexOf(selected))

  useEffect(() => {
    if (!api) return
    const sync = () => {
      const persona = personas[api.selectedScrollSnap()]
      if (persona) onSelect(persona)
    }
    api.on("select", sync)
    api.on("reInit", sync)
    return () => {
      api.off("select", sync)
      api.off("reInit", sync)
    }
  }, [api, onSelect, personas])

  useEffect(() => {
    const index = personas.indexOf(selected)
    if (api && index >= 0 && api.selectedScrollSnap() !== index) api.scrollTo(index)
  }, [api, personas, selected])

  return (
    <Carousel className="person-carousel" setApi={setApi}>
      {showArrows ? <CarouselPrevious className="btn-outline person-carousel-arrow" /> : null}
      <CarouselContent className="person-carousel-track">
        {personas.map((persona) => (
          <CarouselItem className="person-carousel-item" key={persona}>
            {renderItem ? renderItem(persona) : (
              <button className={`person-pill ${persona === selected ? "is-active" : ""}`} onClick={() => { onSelect(persona); api?.scrollTo(personas.indexOf(persona)) }} type="button">
                <PersonAvatar persona={persona} />
                <strong>{persona}</strong>
                <span>{personas.indexOf(persona) + 1} de {personas.length}</span>
              </button>
            )}
          </CarouselItem>
        ))}
      </CarouselContent>
      {showArrows ? <CarouselNext className="btn-outline person-carousel-arrow" /> : null}
      {showPagination ? (
        <div className="person-carousel-pagination">
          <button aria-label="Persona anterior" disabled={!api?.canScrollPrev()} onClick={() => api?.scrollPrev()} type="button"><ChevronLeftIcon /></button>
          <div>
            {personas.map((persona, index) => <button aria-label={`Ver ${persona}`} className={index === selectedIndex ? "active" : ""} key={persona} onClick={() => { onSelect(persona); api?.scrollTo(index) }} type="button" />)}
          </div>
          <button aria-label="Persona siguiente" disabled={!api?.canScrollNext()} onClick={() => api?.scrollNext()} type="button"><ChevronRightIcon /></button>
        </div>
      ) : null}
    </Carousel>
  )
}

function pendingForPersona(persona: Persona, personas: Persona[], movimientos: Movimiento[]) {
  return calcularTransferenciasPendientes(calcularSaldos(personas, movimientos)).flatMap((transferencia): PendingPersonTransfer[] => {
    if (transferencia.de === persona) return [{ tipo: "pagar", persona: transferencia.a, monto: transferencia.monto }]
    if (transferencia.a === persona) return [{ tipo: "recibir", persona: transferencia.de, monto: transferencia.monto }]
    return []
  })
}

function SummaryActionRow({ label, amount, className = "", onClick }: { label: string; amount: ReactNode; className?: string; onClick?: () => void }) {
  const content = <><span>{label}</span><strong className={className}>{amount}</strong>{onClick ? <ChevronRightIcon /> : null}</>
  return onClick ? <button className="ps-stat-row" onClick={onClick} type="button">{content}</button> : <span className="ps-stat-row">{content}</span>
}

function SummaryStats({ resumen, onOpen, saldoClickable = false, showTransferButton = false }: { resumen: ResumenPersona; onOpen?: (view: DetailView) => void; saldoClickable?: boolean; showTransferButton?: boolean }) {
  const estado = estadoSaldo(resumen.saldo)
  return (
    <Card className="ps-stats">
      <div className="ps-stats-person">
        <PersonAvatar className="ps-stats-avatar" persona={resumen.persona} />
        <h2><SlidingText>{resumen.persona}</SlidingText></h2>
        <Badge className={estado.className}>{estado.label}</Badge>
      </div>
      <div>
        <SummaryActionRow label="Le tocaba gastar" amount={formatoARS.format(resumen.totalLeTocaba)} onClick={onOpen ? () => onOpen("parte") : undefined} />
        <SummaryActionRow label="Gastó" amount={formatoARS.format(resumen.totalSalioBolsillo)} onClick={onOpen ? () => onOpen("gasto") : undefined} />
        <SummaryActionRow label="Ya recibió" amount={formatoARS.format(resumen.totalRecibido)} onClick={onOpen ? () => onOpen("recibido") : undefined} />
        <SummaryActionRow label="Saldo" amount={formatoARS.format(resumen.saldo)} className={estado.className} onClick={saldoClickable && onOpen ? () => onOpen("transferencias") : undefined} />
      </div>
      {showTransferButton && onOpen ? <Button className="btn-outline ps-transfer-button" onClick={() => onOpen("transferencias")} type="button">{resumen.saldo > 0 ? "¿De quién recibe?" : "¿A quién le transfiere?"}</Button> : null}
    </Card>
  )
}

function DetailRows({ resumen, view, pendientes }: { resumen: ResumenPersona; view: DetailView; pendientes: PendingPersonTransfer[] }) {
  if (view === "parte") return (
    <>
      {resumen.gastosDondeParticipo.map(({ movimiento, montoParte }, index) => (
        <p className="ps-part-row" key={`${view}-${index}`}><span className="ps-row-icon"><CategoriaIcon categoria={movimiento.categoria} /></span><span><strong>{nombreMovimiento(movimiento)}</strong></span><b>{formatoARS.format(montoParte)} <small>(de {formatoARS.format(movimiento.monto)})</small></b></p>
      ))}
    </>
  )
  if (view === "gasto") return (
    <>
      {resumen.gastosQuePago.map((movimiento, index) => <p className="ps-part-row" key={`gasto-${index}`}><span className="ps-row-icon"><CategoriaIcon categoria={movimiento.categoria} /></span><span><strong>{nombreMovimiento(movimiento)}</strong></span><b>{formatoARS.format(movimiento.monto)}</b></p>)}
      {resumen.transferenciasEnviadas.map((movimiento, index) => <p className="ps-part-row" key={`transferido-${index}`}><span className="ps-row-icon ps-transfer-icon"><ArrowUpRightIcon /></span><span><strong>A {movimiento.a}</strong><small>Pago realizado</small></span><b>{formatoARS.format(movimiento.monto)}</b></p>)}
    </>
  )
  if (view === "recibido") return (
    <>{resumen.transferenciasRecibidas.map((movimiento, index) => <p key={`${view}-${index}`}><span><strong>De {movimiento.de}</strong></span><b>{formatoARS.format(movimiento.monto)}</b></p>)}</>
  )
  const esDeudor = resumen.saldo < 0
  const Icon = resumen.saldo > 0 ? MoveDownLeft : MoveUpRight
  const iconClass = resumen.saldo > 0 ? "ps-transfer-credit" : "ps-transfer-debt"

  return (
    <>
      {pendientes.map((transferencia, index) => {
        const label = transferencia.tipo === "pagar" ? `A ${transferencia.persona}` : `De ${transferencia.persona}`
        const content = (
          <>
            <span className={`ps-row-icon ps-transfer-icon ${iconClass}`}><Icon /></span>
            <span><strong>{label}</strong></span>
            <b>{formatoARS.format(transferencia.monto)}</b>
          </>
        )

        return esDeudor ? (
          <button className="ps-part-row ps-part-button" key={`${transferencia.tipo}-${transferencia.persona}-${index}`} onClick={() => copyAmount(transferencia.monto)} type="button">
            {content}
          </button>
        ) : (
          <p className="ps-part-row" key={`${transferencia.tipo}-${transferencia.persona}-${index}`}>
            {content}
          </p>
        )
      })}
      {pendientes.length === 0 ? <p className="empty">No hay transferencias pendientes.</p> : null}
    </>
  )
}

function DetailList({ resumen, view, pendientes, onBack, closing = false }: { resumen: ResumenPersona; view: DetailView; pendientes: PendingPersonTransfer[]; onBack?: () => void; closing?: boolean }) {
  const titles = {
    parte: ["Su parte de los gastos", "Lo que le corresponde de cada gasto", resumen.totalLeTocaba],
    gasto: ["Lo que pagó", "Gastos que pagó y pagos realizados", resumen.totalSalioBolsillo],
    recibido: ["Lo que le transfirieron", "Transferencias que recibió", resumen.totalRecibido],
    transferencias: ["Transferencias", resumen.saldo < 0 ? `Lo que ${resumen.persona} debería transferir` : `Lo que deberían transferir a ${resumen.persona}`, Math.abs(resumen.saldo)],
  } as const
  const [title, subtitle, amount] = titles[view]

  return (
    <Card className={`ps-detail-list ps-detail-${view}${closing ? " is-closing" : ""}${view === "transferencias" && resumen.saldo < 0 ? " negative" : ""}`}>
      <header><strong>{title}</strong><small>{subtitle}</small><b>{formatoARS.format(amount)}</b>{view === "transferencias" && resumen.saldo < 0 ? <span className="ps-transfer-hint">Toca un monto para copiarlo al portapapeles</span> : null}</header>
      <Separator />
      <ScrollArea className="ps-detail-scroll">
        <div>
          <DetailRows pendientes={pendientes} resumen={resumen} view={view} />
          {view !== "transferencias" && !resumen.tieneMovimientos ? <p className="empty">{resumen.persona} todavía no tiene movimientos.</p> : null}
        </div>
      </ScrollArea>
      {onBack ? <Button className="btn-outline ps-bottom-back" onClick={onBack} type="button"><ChevronLeftIcon />Volver</Button> : null}
    </Card>
  )
}

export function PersonSummaryMobilePage({ personas, movimientos, initialPersona, readOnly = false, title = "Hoja de liquidación", onBack, onShare, closing = false }: PersonSummaryProps) {
  const [selected, setSelected] = useSelectedPersona(personas, initialPersona)
  const [detail, setDetail] = useState<DetailView | "cards">("cards")
  const [closingDetail, setClosingDetail] = useState(false)
  const resumen = useMemo(() => getResumenPersona(selected, movimientos), [movimientos, selected])
  const pendientesPersona = useMemo(() => pendingForPersona(selected, personas, movimientos), [movimientos, personas, selected])
  useEffect(() => { setDetail("cards"); setClosingDetail(false) }, [selected])
  const openDetail = (view: DetailView) => { setClosingDetail(false); setDetail(view) }
  const closeDetail = () => {
    setClosingDetail(true)
    window.setTimeout(() => { setDetail("cards"); setClosingDetail(false) }, 180)
  }

  if (!selected) return null
  return (
    <main className={`ps-mobile-page${readOnly ? "" : " is-slide-page"}${closing ? " is-closing" : ""}`} data-tour={selected === "Norberto" ? "resumen-norberto-dialog" : undefined}>
      <header className="ps-mobile-head">
        <span />
        <h1>{readOnly ? "Resumen interactivo" : title}</h1>
        {onShare ? <Button className="btn-outline" onClick={() => onShare(selected)} type="button"><ShareIcon /></Button> : <span />}
      </header>
      <ScrollArea className="ps-mobile-scroll">
        <PersonCarousel
          personas={personas}
          selected={selected}
          showArrows={false}
          showPagination
          onSelect={setSelected}
          renderItem={(persona) => (
            <SummaryStats
              resumen={getResumenPersona(persona, movimientos)}
              showTransferButton
              onOpen={(view) => {
                setSelected(persona)
                openDetail(view)
              }}
            />
          )}
        />
        {detail !== "cards" ? <DetailList closing={closingDetail} pendientes={pendientesPersona} resumen={resumen} view={detail} onBack={closeDetail} /> : null}
        {onBack && detail === "cards" ? <Button className="btn-outline ps-bottom-back ps-page-back" onClick={onBack} type="button"><ArrowLeftIcon />Volver</Button> : null}
      </ScrollArea>
    </main>
  )
}

export function PersonSummaryDesktopView({ personas, movimientos, initialPersona, initialDetail = null, onBack, readOnly = false }: PersonSummaryProps) {
  const [selected, setSelected] = useSelectedPersona(personas, initialPersona)
  const [detail, setDetail] = useState<DetailView | "cards">("cards")
  const [closingDetail, setClosingDetail] = useState(false)
  const resumen = useMemo(() => getResumenPersona(selected, movimientos), [movimientos, selected])
  const pendientesPersona = useMemo(() => pendingForPersona(selected, personas, movimientos), [movimientos, personas, selected])
  const estado = estadoSaldo(resumen.saldo)
  useEffect(() => {
    if (!readOnly) {
      setClosingDetail(false)
      setDetail(initialDetail ?? "cards")
    }
  }, [initialDetail, readOnly, selected])
  const closeDetail = () => {
    setClosingDetail(true)
    window.setTimeout(() => { setDetail("cards"); setClosingDetail(false) }, 180)
  }

  if (!selected) return null
  return (
    <div className={`ps-desktop-view${readOnly ? " is-readonly" : ""}`}>
      <header className="ps-desktop-head">
        {onBack ? <Button className="btn-outline" onClick={onBack} type="button"><ChevronLeftIcon />Volver al listado</Button> : null}
        {readOnly ? <span className="ps-share-logo"><UsersIcon /></span> : null}
        <div>
          <h2>Resumen por persona</h2>
          <p>Revisá cuánto debe pagar o recibir cada persona.</p>
        </div>
      </header>
      {readOnly ? <PersonCarousel personas={personas} selected={selected} showArrows={false} showPagination onSelect={(persona) => { setSelected(persona); setDetail("cards") }} renderItem={(persona) => <SummaryStats resumen={getResumenPersona(persona, movimientos)} saldoClickable onOpen={(view) => { setSelected(persona); setDetail(view) }} />} /> : null}
      {!readOnly ? <div className="ps-desktop-detail">
        <aside>
          <SlidingText className="ps-side-name">{resumen.persona}</SlidingText>
          <Badge className={estado.className}>{estado.label}</Badge>
          <Separator />
          <button className="ps-side-stat" onClick={() => setDetail("parte")} type="button">Le tocaba gastar<strong>{formatoARS.format(resumen.totalLeTocaba)}</strong><ChevronRightIcon /></button>
          <button className="ps-side-stat" onClick={() => setDetail("gasto")} type="button">Gastó<strong>{formatoARS.format(resumen.totalSalioBolsillo)}</strong><ChevronRightIcon /></button>
          <button className="ps-side-stat" onClick={() => setDetail("recibido")} type="button">Ya recibió<strong>{formatoARS.format(resumen.totalRecibido)}</strong><ChevronRightIcon /></button>
          <button className="ps-side-stat" onClick={() => setDetail("transferencias")} type="button">Saldo<strong className={estado.className}>{formatoARS.format(resumen.saldo)}</strong><ChevronRightIcon /></button>
        </aside>
        <section>
          <p className="empty">Elegí una línea del resumen para ver el detalle.</p>
        </section>
      </div> : null}
      {detail !== "cards" ? <div className="ps-desktop-drawer" onClick={closeDetail}><div onClick={(event) => event.stopPropagation()}><DetailList closing={closingDetail} pendientes={pendientesPersona} resumen={resumen} view={detail} onBack={closeDetail} /></div></div> : null}
    </div>
  )
}

export function PersonSummaryDesktopDrawer({ personas, movimientos, persona, detail, onClose }: { personas: Persona[]; movimientos: Movimiento[]; persona: Persona; detail: DetailView; onClose: () => void }) {
  const [closingDetail, setClosingDetail] = useState(false)
  const resumen = useMemo(() => getResumenPersona(persona, movimientos), [movimientos, persona])
  const pendientesPersona = useMemo(() => pendingForPersona(persona, personas, movimientos), [movimientos, persona, personas])
  const closeDetail = () => {
    if (closingDetail) return
    setClosingDetail(true)
    window.setTimeout(onClose, 180)
  }
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeDetail()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  })

  return (
    <div className="ps-desktop-drawer" onClick={closeDetail}>
      <div onClick={(event) => event.stopPropagation()}>
        <DetailList closing={closingDetail} pendientes={pendientesPersona} resumen={resumen} view={detail} onBack={closeDetail} />
      </div>
    </div>
  )
}
