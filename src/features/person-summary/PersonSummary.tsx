import { ArrowDownLeftIcon, ArrowLeftIcon, ArrowUpRightIcon, ChevronLeftIcon, ChevronRightIcon, ReceiptTextIcon, ShareIcon, UsersIcon, WalletCardsIcon } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import type { ReactNode } from "react"
import { CategoryBadge } from "../../components/shared/CategoryBadge"
import { SlidingText } from "../../components/shared/SlidingText"
import { Avatar, AvatarFallback, Badge, Button, Card, Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, ScrollArea, Separator, Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui"
import type { CarouselApi } from "../../components/ui"
import { getResumenPersona } from "../../lib/calculos"
import { formatoARS } from "../../lib/money"
import { nombreMovimiento } from "../../lib/share-text"
import type { Movimiento, Persona } from "../../types"
import "./person-summary.css"

type ResumenPersona = ReturnType<typeof getResumenPersona>
type DetailView = "parte" | "pago" | "recibido" | "transferido"

type PersonSummaryProps = {
  personas: Persona[]
  movimientos: Movimiento[]
  initialPersona?: Persona | null
  readOnly?: boolean
  title?: string
  onBack?: () => void
  onShare?: () => void
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

function useSelectedPersona(personas: Persona[], initialPersona?: Persona | null) {
  const [selected, setSelected] = useState(initialPersona ?? personas[0] ?? "")
  useEffect(() => setSelected(initialPersona ?? personas[0] ?? ""), [initialPersona, personas])
  return [selected, setSelected] as const
}

function PersonAvatar({ persona, className = "" }: { persona: Persona; className?: string }) {
  return <Avatar className={className}><AvatarFallback>{iniciales(persona)}</AvatarFallback></Avatar>
}

function PersonCarousel({ personas, selected, onSelect }: { personas: Persona[]; selected: Persona; onSelect: (persona: Persona) => void }) {
  const [api, setApi] = useState<CarouselApi>()

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
      <CarouselPrevious className="btn-outline person-carousel-arrow" />
      <CarouselContent className="person-carousel-track">
        {personas.map((persona) => (
          <CarouselItem className="person-carousel-item" key={persona}>
            <button className={`person-pill ${persona === selected ? "is-active" : ""}`} onClick={() => { onSelect(persona); api?.scrollTo(personas.indexOf(persona)) }} type="button">
              <PersonAvatar persona={persona} />
              <strong>{persona}</strong>
              <span>{personas.indexOf(persona) + 1} de {personas.length}</span>
            </button>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselNext className="btn-outline person-carousel-arrow" />
    </Carousel>
  )
}

function SummaryStats({ resumen }: { resumen: ResumenPersona }) {
  const estado = estadoSaldo(resumen.saldo)
  return (
    <Card className="ps-stats">
      <h2>Resumen de {resumen.persona} <Badge className={estado.className}>{estado.label}</Badge></h2>
      <div>
        <span>Parte (lo que le corresponde)<strong>{formatoARS.format(resumen.totalLeTocaba)}</strong></span>
        <span>Gastó (pagó + transfirió)<strong>{formatoARS.format(resumen.totalSalioBolsillo)}</strong></span>
        <span>Saldo<strong className={estado.className}>{formatoARS.format(resumen.saldo)}</strong></span>
      </div>
    </Card>
  )
}

function DetailButton({ icon, title, subtitle, amount, onClick }: { icon: ReactNode; title: string; subtitle: string; amount: number; onClick?: () => void }) {
  return (
    <button className="ps-detail-button" onClick={onClick} type="button">
      <span className="ps-detail-icon">{icon}</span>
      <span><strong>{title}</strong><small>{subtitle}</small></span>
      <b>{formatoARS.format(amount)}</b>
      <ChevronRightIcon />
    </button>
  )
}

function PersonSummaryCards({ resumen, onOpen }: { resumen: ResumenPersona; onOpen?: (view: DetailView) => void }) {
  return (
    <div className="ps-card-list">
      <DetailButton icon={<ReceiptTextIcon />} title="Su parte de los gastos" subtitle="Lo que le corresponde de cada gasto" amount={resumen.totalLeTocaba} onClick={() => onOpen?.("parte")} />
      <DetailButton icon={<WalletCardsIcon />} title="Lo que pagó" subtitle="Gastos que pagó" amount={resumen.totalPuesto} onClick={() => onOpen?.("pago")} />
      <DetailButton icon={<ArrowDownLeftIcon />} title="Lo que le transfirieron" subtitle="Transferencias que recibió" amount={resumen.totalRecibido} onClick={() => onOpen?.("recibido")} />
      <DetailButton icon={<ArrowUpRightIcon />} title="Lo que transfirió" subtitle="Transferencias que envió" amount={resumen.totalTransferido} onClick={() => onOpen?.("transferido")} />
    </div>
  )
}

function DetailRows({ resumen, view }: { resumen: ResumenPersona; view: DetailView }) {
  if (view === "parte") return (
    <>
      {resumen.gastosDondeParticipo.map(({ movimiento, montoParte }, index) => (
        <p key={`${view}-${index}`}><span><strong>{nombreMovimiento(movimiento)}</strong><small>{movimiento.pagador} (pagó)</small></span><b>{formatoARS.format(montoParte)} <small>de {formatoARS.format(movimiento.monto)}</small></b></p>
      ))}
    </>
  )
  if (view === "pago") return (
    <>{resumen.gastosQuePago.map((movimiento, index) => <p key={`${view}-${index}`}><span><strong>{nombreMovimiento(movimiento)}</strong><CategoryBadge categoria={movimiento.categoria} /></span><b>{formatoARS.format(movimiento.monto)}</b></p>)}</>
  )
  if (view === "recibido") return (
    <>{resumen.transferenciasRecibidas.map((movimiento, index) => <p key={`${view}-${index}`}><span><strong>De {movimiento.de}</strong></span><b>{formatoARS.format(movimiento.monto)}</b></p>)}</>
  )
  return (
    <>{resumen.transferenciasEnviadas.map((movimiento, index) => <p key={`${view}-${index}`}><span><strong>A {movimiento.a}</strong></span><b>{formatoARS.format(movimiento.monto)}</b></p>)}</>
  )
}

function DetailList({ resumen, view, onBack }: { resumen: ResumenPersona; view: DetailView; onBack?: () => void }) {
  const titles = {
    parte: ["Su parte de los gastos", "Lo que le corresponde de cada gasto", resumen.totalLeTocaba],
    pago: ["Lo que pagó", "Gastos que pagó", resumen.totalPuesto],
    recibido: ["Lo que le transfirieron", "Transferencias que recibió", resumen.totalRecibido],
    transferido: ["Lo que transfirió", "Transferencias que envió", resumen.totalTransferido],
  } as const
  const [title, subtitle, amount] = titles[view]

  return (
    <Card className="ps-detail-list">
      {onBack ? <Button className="btn-outline" onClick={onBack} type="button"><ChevronLeftIcon />Volver</Button> : null}
      <header><strong>{title}</strong><small>{subtitle}</small><b>{formatoARS.format(amount)}</b></header>
      <Separator />
      <ScrollArea className="ps-detail-scroll">
        <div>
          <DetailRows resumen={resumen} view={view} />
          {!resumen.tieneMovimientos ? <p className="empty">{resumen.persona} todavía no tiene movimientos.</p> : null}
        </div>
      </ScrollArea>
    </Card>
  )
}

export function PersonSummaryMobilePage({ personas, movimientos, initialPersona, readOnly = false, title = "Hoja de liquidación", onBack, onShare }: PersonSummaryProps) {
  const [selected, setSelected] = useSelectedPersona(personas, initialPersona)
  const resumen = useMemo(() => getResumenPersona(selected, movimientos), [movimientos, selected])

  if (!selected) return null
  return (
    <main className="ps-mobile-page" data-tour={selected === "Norberto" ? "resumen-norberto-dialog" : undefined}>
      <header className="ps-mobile-head">
        {onBack ? <Button className="btn-outline" onClick={onBack} type="button"><ArrowLeftIcon /></Button> : <span />}
        <h1>{readOnly ? "Resumen compartido" : title}</h1>
        {onShare ? <Button className="btn-outline" onClick={onShare} type="button"><ShareIcon /></Button> : <span />}
      </header>
      <ScrollArea className="ps-mobile-scroll">
        <PersonCarousel personas={personas} selected={selected} onSelect={setSelected} />
        <SummaryStats resumen={resumen} />
        <Tabs className="ps-tabs" defaultValue="resumen">
          <TabsList className="tabs-list">
            <TabsTrigger className="tabs-trigger" value="resumen">Resumen</TabsTrigger>
            <TabsTrigger className="tabs-trigger" value="parte">Su parte</TabsTrigger>
            <TabsTrigger className="tabs-trigger" value="pago">Pagó</TabsTrigger>
            <TabsTrigger className="tabs-trigger" value="recibido">Recibió</TabsTrigger>
            <TabsTrigger className="tabs-trigger" value="transferido">Transfirió</TabsTrigger>
          </TabsList>
          <TabsContent value="resumen"><PersonSummaryCards resumen={resumen} /></TabsContent>
          <TabsContent value="parte"><DetailList resumen={resumen} view="parte" /></TabsContent>
          <TabsContent value="pago"><DetailList resumen={resumen} view="pago" /></TabsContent>
          <TabsContent value="recibido"><DetailList resumen={resumen} view="recibido" /></TabsContent>
          <TabsContent value="transferido"><DetailList resumen={resumen} view="transferido" /></TabsContent>
        </Tabs>
      </ScrollArea>
    </main>
  )
}

export function PersonSummaryDesktopView({ personas, movimientos, initialPersona, onBack, readOnly = false }: PersonSummaryProps) {
  const [selected, setSelected] = useSelectedPersona(personas, initialPersona)
  const [detail, setDetail] = useState<DetailView | "cards">("cards")
  const resumen = useMemo(() => getResumenPersona(selected, movimientos), [movimientos, selected])
  const estado = estadoSaldo(resumen.saldo)

  if (!selected) return null
  return (
    <div className="ps-desktop-view">
      <header className="ps-desktop-head">
        {onBack ? <Button className="btn-outline" onClick={onBack} type="button"><ChevronLeftIcon />Volver al listado</Button> : null}
        {readOnly ? <span className="ps-share-logo"><UsersIcon /></span> : null}
        <div>
          <h2>Resumen por persona</h2>
          <p>Revisá cuánto debe pagar o recibir cada persona.</p>
        </div>
      </header>
      {readOnly ? <PersonCarousel personas={personas} selected={selected} onSelect={(persona) => { setSelected(persona); setDetail("cards") }} /> : null}
      <div className="ps-desktop-detail">
        <aside>
          <SlidingText className="ps-side-name">{resumen.persona}</SlidingText>
          <Badge className={estado.className}>{estado.label}</Badge>
          <Separator />
          <span className="ps-side-stat">Le tocaba gastar<strong>{formatoARS.format(resumen.totalLeTocaba)}</strong></span>
          <span className="ps-side-stat">Gastó<strong>{formatoARS.format(resumen.totalSalioBolsillo)}</strong></span>
          <span className="ps-side-stat">Ya recibió<strong>{formatoARS.format(resumen.totalRecibido)}</strong></span>
          <span className="ps-side-stat">Saldo<strong className={estado.className}>{formatoARS.format(resumen.saldo)}</strong></span>
        </aside>
        <section>
          {detail === "cards" ? <PersonSummaryCards resumen={resumen} onOpen={setDetail} /> : <DetailList resumen={resumen} view={detail} onBack={() => setDetail("cards")} />}
        </section>
      </div>
    </div>
  )
}
