import { ArrowLeftIcon, ArrowRightIcon, ArrowUpRightIcon, ChevronLeftIcon, ChevronRightIcon, CopyIcon, PieChartIcon, ReceiptTextIcon, SearchIcon, UsersIcon } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import type { ReactNode } from "react"
import { CategoriaIcon } from "../components/shared/CategoryBadge"
import { MovimientoItem } from "../sections/movimientos/MovimientoItem"
import { PersonasSection } from "../sections/personas/PersonasSection"
import { CategoryDetailList, CategoryPie } from "../sections/total/CategoryChart"
import { RepartirDialog } from "../sections/total/RepartirDialog"
import { CATEGORIAS_GASTO, getCategoriaOrden } from "../lib/categorias"
import { formatoARS } from "../lib/money"
import type { Movimiento, Persona, ResumenCategoria, SaldoPersona, TransferenciaPendiente } from "../types"
import { Badge, Button, Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, Input, Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "../components/ui"
import type { CarouselApi } from "../components/ui"

type ResumenPersona = {
  persona: Persona
  totalPuesto: number
  totalLeTocaba: number
  totalTransferido: number
  totalRecibido: number
  totalSalioBolsillo: number
  saldo: number
  gastosDondeParticipo: { movimiento: Extract<Movimiento, { tipo: "gasto" }>; montoParte: number }[]
  gastosQuePago: Extract<Movimiento, { tipo: "gasto" }>[]
  transferenciasEnviadas: Extract<Movimiento, { tipo: "transferencia" }>[]
  transferenciasRecibidas: Extract<Movimiento, { tipo: "transferencia" }>[]
}

type DesktopWorkspaceProps = {
  personas: Persona[]
  nombre: string
  movimientos: Movimiento[]
  movimientosCard: { movimiento: Movimiento; index: number }[]
  saldos: SaldoPersona[]
  gastosPorCategoria: ResumenCategoria[]
  totalGastado: number
  promedio: number
  pendientes: TransferenciaPendiente[]
  resumenCopiable: string
  settlementOpen: boolean
  onSettlementOpenChange: (open: boolean) => void
  onNombreChange: (nombre: string) => void
  onAddPersona: () => void
  onDeletePersona: (persona: Persona) => void
  onStartTutorial: () => void
  onEditMovimiento: (index: number, movimiento: Movimiento) => void
  onDeleteMovimiento: (index: number) => void
  onCopyMovimientos: () => void
  nombreMovimiento: (movimiento: Movimiento) => string
  getResumenPersona: (persona: Persona) => ResumenPersona
  onShareReparto: () => void
  gastoForm: ReactNode
  transferenciaForm: ReactNode
}

const pageSize = 4

function iniciales(persona: Persona) {
  return persona.split(/\s+/).filter(Boolean).slice(0, 2).map((parte) => parte[0]?.toUpperCase()).join("") || persona[0]?.toUpperCase() || "?"
}

function estadoSaldo(saldo: number) {
  const centavos = Math.round(saldo * 100)
  if (centavos > 0) return { label: "A favor", className: "positive" }
  if (centavos < 0) return { label: "Debe", className: "negative" }
  return { label: "Al día", className: "neutral" }
}

function Pagination({ page, totalPages, onPage }: { page: number; totalPages: number; onPage: (page: number) => void }) {
  return (
    <div className="desktop-pagination">
      <Button className="btn-outline" disabled={page <= 1} onClick={() => onPage(page - 1)} type="button">←</Button>
      <span>{page} de {totalPages}</span>
      <Button className="btn-outline" disabled={page >= totalPages} onClick={() => onPage(page + 1)} type="button">→</Button>
    </div>
  )
}

function DetailList({
  title,
  children,
  onBack,
}: {
  title: string
  children: React.ReactNode
  onBack: () => void
}) {
  return (
    <div className="desktop-person-detail-list">
      <Button className="btn-outline" onClick={onBack} type="button"><ChevronLeftIcon data-icon="inline-start" />Volver</Button>
      <h3>{title}</h3>
      <div className="desktop-detail-rows">{children}</div>
    </div>
  )
}

export function DesktopWorkspace({
  personas,
  nombre,
  movimientos,
  movimientosCard,
  saldos,
  gastosPorCategoria,
  totalGastado,
  promedio,
  pendientes,
  resumenCopiable,
  settlementOpen,
  onSettlementOpenChange,
  onNombreChange,
  onAddPersona,
  onDeletePersona,
  onStartTutorial,
  onEditMovimiento,
  onDeleteMovimiento,
  onCopyMovimientos,
  nombreMovimiento,
  getResumenPersona,
  onShareReparto,
  gastoForm,
  transferenciaForm,
}: DesktopWorkspaceProps) {
  const [api, setApi] = useState<CarouselApi>()
  const [active, setActive] = useState(0)
  const [movementPage, setMovementPage] = useState(1)
  const [movementSearch, setMovementSearch] = useState("")
  const [movementType, setMovementType] = useState("todos")
  const [movementCategory, setMovementCategory] = useState("todas")
  const [movementPayer, setMovementPayer] = useState("todos")
  const [movementSort, setMovementSort] = useState("categoria")
  const [summaryPage, setSummaryPage] = useState(1)
  const [summarySearch, setSummarySearch] = useState("")
  const [summarySort, setSummarySort] = useState("nombre")
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null)
  const [detailView, setDetailView] = useState<"cards" | "parte" | "pago" | "recibido" | "transferido">("cards")

  useEffect(() => {
    if (!api) return
    const onSelect = () => setActive(api.selectedScrollSnap())
    onSelect()
    api.on("select", onSelect)
    return () => {
      api.off("select", onSelect)
    }
  }, [api])

  const goTo = (index: number) => {
    setActive(index)
    api?.scrollTo(index)
  }

  const filteredMovements = useMemo(() => {
    const text = movementSearch.trim().toLowerCase()
    return movimientosCard
      .filter(({ movimiento }) => !text || nombreMovimiento(movimiento).toLowerCase().includes(text))
      .filter(({ movimiento }) => movementType === "todos" || movimiento.tipo === movementType)
      .filter(({ movimiento }) => movementCategory === "todas" || (movimiento.tipo === "gasto" && movimiento.categoria === movementCategory))
      .filter(({ movimiento }) => movementPayer === "todos" || (movimiento.tipo === "gasto" ? movimiento.pagador === movementPayer : movimiento.de === movementPayer))
      .sort((a, b) => {
        if (movementSort === "monto") return a.movimiento.monto - b.movimiento.monto
        if (movementSort === "pagador") {
          const aName = a.movimiento.tipo === "gasto" ? a.movimiento.pagador : a.movimiento.de
          const bName = b.movimiento.tipo === "gasto" ? b.movimiento.pagador : b.movimiento.de
          return aName.localeCompare(bName)
        }
        const aCat = a.movimiento.tipo === "gasto" ? getCategoriaOrden(a.movimiento.categoria) : 999
        const bCat = b.movimiento.tipo === "gasto" ? getCategoriaOrden(b.movimiento.categoria) : 999
        return aCat - bCat || a.movimiento.monto - b.movimiento.monto
      })
  }, [movementCategory, movementPayer, movementSearch, movementSort, movementType, movimientosCard, nombreMovimiento])

  const movementTotalPages = Math.max(1, Math.ceil(filteredMovements.length / pageSize))
  const pagedMovements = filteredMovements.slice((Math.min(movementPage, movementTotalPages) - 1) * pageSize, Math.min(movementPage, movementTotalPages) * pageSize)

  const filteredSaldos = useMemo(() => {
    const text = summarySearch.trim().toLowerCase()
    return saldos
      .filter((saldo) => !text || saldo.persona.toLowerCase().includes(text))
      .sort((a, b) => {
        if (summarySort === "saldo") return b.saldo - a.saldo
        if (summarySort === "parte") return b.totalDebidoEnGastos - a.totalDebidoEnGastos
        if (summarySort === "gasto") return b.totalSalioBolsillo - a.totalSalioBolsillo
        return a.persona.localeCompare(b.persona)
      })
  }, [saldos, summarySearch, summarySort])

  const summaryTotalPages = Math.max(1, Math.ceil(filteredSaldos.length / pageSize))
  const pagedSaldos = filteredSaldos.slice((Math.min(summaryPage, summaryTotalPages) - 1) * pageSize, Math.min(summaryPage, summaryTotalPages) * pageSize)
  const resumen = selectedPersona ? getResumenPersona(selectedPersona) : null

  return (
    <div className="desktop-workspace">
      <Carousel setApi={setApi}>
        <div className="desktop-carousel-controls">
          <CarouselPrevious><ArrowLeftIcon /></CarouselPrevious>
          <CarouselNext><ArrowRightIcon /></CarouselNext>
        </div>
        <CarouselContent>
          <CarouselItem>
            <section className="desktop-slide desktop-people-slide">
              <Badge className="desktop-step">1 de 3</Badge>
              <UsersIcon className="desktop-slide-icon" />
              <h2>Personas</h2>
              <p>Añadí las personas que participan en los gastos.</p>
              <PersonasSection className="desktop-inner-section" personas={personas} nombre={nombre} onNombreChange={onNombreChange} onAdd={onAddPersona} onDelete={onDeletePersona} onStartTutorial={onStartTutorial} />
            </section>
          </CarouselItem>

          <CarouselItem>
            <section className="desktop-slide desktop-movement-slide">
              <Badge className="desktop-step desktop-step-green">2 de 3</Badge>
              <ArrowUpRightIcon className="desktop-slide-icon desktop-icon-green" />
              <h2>Movimientos</h2>
              <p>Registrá gastos y transferencias.</p>
              <div className="desktop-movement-card">
                <div className="desktop-form-grid">
                  <div>{gastoForm}</div>
                  <div>{transferenciaForm}</div>
                </div>
                <div className="desktop-list-head">
                  <h3>Últimos movimientos</h3>
                  <Button className="movement-copy-button" onClick={onCopyMovimientos} type="button"><CopyIcon data-icon="inline-start" />Copiar movimientos</Button>
                </div>
                <div className="desktop-movement-table">
                  {pagedMovements.map(({ movimiento, index }) => (
                    <MovimientoItem key={`${movimiento.tipo}-${index}`} movimiento={movimiento} index={index} onEdit={onEditMovimiento} onDelete={onDeleteMovimiento} nombreMovimiento={nombreMovimiento} />
                  ))}
                  {pagedMovements.length === 0 ? <p className="empty">No hay movimientos para mostrar.</p> : null}
                </div>
                <div className="desktop-filter-bar">
                  <label><SearchIcon data-icon="inline-start" /><Input placeholder="Buscar descripción" value={movementSearch} onChange={(event) => { setMovementSearch(event.target.value); setMovementPage(1) }} /></label>
                  <Select value={movementType} onValueChange={(value) => { setMovementType(value); setMovementPage(1) }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectGroup><SelectItem value="todos">Todos</SelectItem><SelectItem value="gasto">Gastos</SelectItem><SelectItem value="transferencia">Transferencias</SelectItem></SelectGroup></SelectContent></Select>
                  <Select value={movementCategory} onValueChange={(value) => { setMovementCategory(value); setMovementPage(1) }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectGroup><SelectItem value="todas">Todas las categorías</SelectItem>{CATEGORIAS_GASTO.map((categoria) => <SelectItem key={categoria.key} value={categoria.key}><CategoriaIcon categoria={categoria.key} />{categoria.label}</SelectItem>)}</SelectGroup></SelectContent></Select>
                  <Select value={movementPayer} onValueChange={(value) => { setMovementPayer(value); setMovementPage(1) }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectGroup><SelectItem value="todos">Todos los pagadores</SelectItem>{personas.map((persona) => <SelectItem key={persona} value={persona}>{persona}</SelectItem>)}</SelectGroup></SelectContent></Select>
                  <Select value={movementSort} onValueChange={setMovementSort}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectGroup><SelectItem value="categoria">Categoría</SelectItem><SelectItem value="monto">Monto</SelectItem><SelectItem value="pagador">Pagador</SelectItem></SelectGroup></SelectContent></Select>
                  <Pagination page={Math.min(movementPage, movementTotalPages)} totalPages={movementTotalPages} onPage={setMovementPage} />
                </div>
              </div>
            </section>
          </CarouselItem>

          <CarouselItem>
            <section className="desktop-slide desktop-summary-slide">
              <Badge className="desktop-step desktop-step-purple">3 de 3</Badge>
              <PieChartIcon className="desktop-slide-icon desktop-icon-purple" />
              <h2>Resumen por persona</h2>
              <p>Revisá cuánto debe pagar o recibir cada persona.</p>
              {!resumen ? (
                <div className="desktop-summary-grid">
                  <div className="desktop-summary-main">
                    <div className="desktop-summary-rows">
                      {pagedSaldos.map((saldo) => {
                        const estado = estadoSaldo(saldo.saldo)
                        return (
                          <button className="desktop-summary-row" key={saldo.persona} onClick={() => { setSelectedPersona(saldo.persona); setDetailView("cards") }} type="button">
                            <span className={`avatar ${saldo.saldo > 0 ? "avatar-positive" : ""}`}>{iniciales(saldo.persona)}</span>
                            <strong>{saldo.persona}</strong>
                            <span><small>Parte</small>{formatoARS.format(saldo.totalDebidoEnGastos)}</span>
                            <span><small>Gastó</small>{formatoARS.format(saldo.totalSalioBolsillo)}</span>
                            <span className={estado.className}><small>Saldo</small>{formatoARS.format(saldo.saldo)}</span>
                            <ChevronRightIcon />
                          </button>
                        )
                      })}
                    </div>
                    <div className="desktop-filter-bar">
                      <label><SearchIcon data-icon="inline-start" /><Input placeholder="Buscar nombre" value={summarySearch} onChange={(event) => { setSummarySearch(event.target.value); setSummaryPage(1) }} /></label>
                      <Select value={summarySort} onValueChange={setSummarySort}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectGroup><SelectItem value="nombre">Nombre</SelectItem><SelectItem value="saldo">Saldo</SelectItem><SelectItem value="parte">Parte</SelectItem><SelectItem value="gasto">Gastó</SelectItem></SelectGroup></SelectContent></Select>
                      <Pagination page={Math.min(summaryPage, summaryTotalPages)} totalPages={summaryTotalPages} onPage={setSummaryPage} />
                    </div>
                  </div>
                  <aside className="desktop-summary-side">
                    <h3>Resumen general</h3>
                    <div className="desktop-mini-totals"><span>Total gastado<strong>{formatoARS.format(totalGastado)}</strong></span><span>Promedio por persona<strong>{formatoARS.format(promedio)}</strong></span></div>
                    <CategoryPie data={gastosPorCategoria} />
                    <CategoryDetailList data={gastosPorCategoria} />
                    <RepartirDialog open={settlementOpen} onOpenChange={onSettlementOpenChange} pendientes={pendientes} resumenCopiable={resumenCopiable} onShare={onShareReparto} />
                  </aside>
                </div>
              ) : (
                <div className="desktop-person-detail">
                  <aside className="desktop-person-side">
                    <Button className="btn-outline" onClick={() => setSelectedPersona(null)} type="button"><ChevronLeftIcon data-icon="inline-start" />Volver al listado</Button>
                    <span className="desktop-person-avatar">{iniciales(resumen.persona)}</span>
                    <h3>{resumen.persona}</h3>
                    <Badge className={estadoSaldo(resumen.saldo).className}>{estadoSaldo(resumen.saldo).label}</Badge>
                    <span>Parte<strong>{formatoARS.format(resumen.totalLeTocaba)}</strong></span>
                    <span>Gastó<strong>{formatoARS.format(resumen.totalSalioBolsillo)}</strong></span>
                    <span>Saldo<strong className={estadoSaldo(resumen.saldo).className}>{formatoARS.format(resumen.saldo)}</strong></span>
                  </aside>
                  <div className={`desktop-person-detail-panel show-${detailView}`}>
                    <div className="desktop-detail-cards">
                      <button onClick={() => setDetailView("parte")} type="button"><ReceiptTextIcon /><span>Su parte de los gastos<small>Total de su participación</small></span><strong>{formatoARS.format(resumen.totalLeTocaba)}</strong><ChevronRightIcon /></button>
                      <button onClick={() => setDetailView("pago")} type="button"><ArrowUpRightIcon /><span>Lo que pagó<small>Total que pagó por todos</small></span><strong>{formatoARS.format(resumen.totalPuesto)}</strong><ChevronRightIcon /></button>
                      <button onClick={() => setDetailView("recibido")} type="button"><ArrowLeftIcon /><span>Lo que le transfirieron<small>Pagos que recibió</small></span><strong>{formatoARS.format(resumen.totalRecibido)}</strong><ChevronRightIcon /></button>
                      <button onClick={() => setDetailView("transferido")} type="button"><ArrowRightIcon /><span>Lo que transfirió<small>Pagos que hizo</small></span><strong>{formatoARS.format(resumen.totalTransferido)}</strong><ChevronRightIcon /></button>
                    </div>
                    {detailView === "parte" ? <DetailList title="Gastos donde participó" onBack={() => setDetailView("cards")}>{resumen.gastosDondeParticipo.map(({ movimiento, montoParte }) => <p key={movimiento.descripcion}><span>{movimiento.descripcion || "Gasto"}</span><strong>{formatoARS.format(montoParte)} <small>de {formatoARS.format(movimiento.monto)}</small></strong></p>)}</DetailList> : null}
                    {detailView === "pago" ? <DetailList title="Gastos que pagó" onBack={() => setDetailView("cards")}>{resumen.gastosQuePago.map((movimiento) => <p key={movimiento.descripcion}><span>{movimiento.descripcion || "Gasto"}</span><strong>{formatoARS.format(movimiento.monto)}</strong></p>)}</DetailList> : null}
                    {detailView === "recibido" ? <DetailList title="Pagos recibidos" onBack={() => setDetailView("cards")}>{resumen.transferenciasRecibidas.map((movimiento) => <p key={`${movimiento.de}-${movimiento.monto}`}><span>Recibió de {movimiento.de}</span><strong>{formatoARS.format(movimiento.monto)}</strong></p>)}</DetailList> : null}
                    {detailView === "transferido" ? <DetailList title="Pagos realizados" onBack={() => setDetailView("cards")}>{resumen.transferenciasEnviadas.map((movimiento) => <p key={`${movimiento.a}-${movimiento.monto}`}><span>Pagó a {movimiento.a}</span><strong>{formatoARS.format(movimiento.monto)}</strong></p>)}</DetailList> : null}
                  </div>
                </div>
              )}
            </section>
          </CarouselItem>
        </CarouselContent>
      </Carousel>
      <nav className="desktop-bottom-nav">
        {[{ label: "Personas", meta: `${personas.length} personas`, icon: UsersIcon }, { label: "Movimientos", meta: `${movimientos.length} movimientos`, icon: ArrowUpRightIcon }, { label: "Resumen", meta: "Ver saldos", icon: PieChartIcon }].map((item, index) => {
          const Icon = item.icon
          return <button className={active === index ? "active" : ""} key={item.label} onClick={() => goTo(index)} type="button"><Icon /><span>{item.label}<small>{item.meta}</small></span></button>
        })}
      </nav>
    </div>
  )
}
