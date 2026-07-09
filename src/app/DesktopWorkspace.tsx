import { ArrowLeftIcon, ArrowRightIcon, ArrowUpRightIcon, ChevronLeftIcon, ChevronRightIcon, CopyIcon, PieChartIcon, ReceiptTextIcon, SearchIcon, SettingsIcon, UsersIcon } from "lucide-react"
import { useMemo, useState } from "react"
import type { ReactNode } from "react"
import { ConfirmDialog } from "../components/shared/ConfirmDialog"
import { CategoriaIcon, CategoryBadge } from "../components/shared/CategoryBadge"
import { PersonaForm } from "../sections/personas/PersonaForm"
import { PersonaItem } from "../sections/personas/PersonaItem"
import { CategoryDetailList, CategoryPie } from "../sections/total/CategoryChart"
import { RepartirDialog } from "../sections/total/RepartirDialog"
import { CATEGORIAS_GASTO, getCategoriaOrden } from "../lib/categorias"
import { formatoARS } from "../lib/money"
import type { Movimiento, Persona, ResumenCategoria, SaldoPersona, TransferenciaPendiente } from "../types"
import { Badge, Button, Input, ScrollArea, Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue, Separator, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui"

type DesktopSection = "personas" | "movimientos" | "resumen"
type DetailView = "cards" | "parte" | "pago" | "recibido" | "transferido"
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
  onClear: () => void
  onNombreChange: (nombre: string) => void
  onAddPersona: () => void
  onDeletePersona: (persona: Persona) => void
  onEditMovimiento: (index: number, movimiento: Movimiento) => void
  onCopyMovimientos: () => void
  nombreMovimiento: (movimiento: Movimiento) => string
  getResumenPersona: (persona: Persona) => ResumenPersona
  onShareReparto: () => void
  gastoForm: ReactNode
  transferenciaForm: ReactNode
}

const pageSize = 8

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

function DetailList({ title, children, onBack }: { title: string; children: ReactNode; onBack: () => void }) {
  return (
    <div className="desktop-person-detail-list">
      <Button className="btn-outline" onClick={onBack} type="button"><ChevronLeftIcon data-icon="inline-start" />Volver</Button>
      <h3>{title}</h3>
      <div className="desktop-detail-rows">{children}</div>
    </div>
  )
}

function MovementParticipants({ participantes }: { participantes: Persona[] }) {
  const visibles = participantes.slice(0, 2)
  const restantes = participantes.length - visibles.length
  return (
    <span className="desktop-participant-dots">
      {visibles.map((persona) => <span className="avatar" key={persona}>{persona[0]?.toUpperCase()}</span>)}
      {restantes > 0 ? <small>+{restantes}</small> : null}
    </span>
  )
}

function DesktopMovementRow({
  movimiento,
  index,
  onEdit,
  nombreMovimiento,
}: {
  movimiento: Movimiento
  index: number
  onEdit: (index: number, movimiento: Movimiento) => void
  nombreMovimiento: (movimiento: Movimiento) => string
}) {
  return (
    <TableRow className="desktop-movement-row" onClick={() => onEdit(index, movimiento)}>
      <TableCell className="desktop-movement-name">
        <strong>{nombreMovimiento(movimiento)}</strong>
        <small>{movimiento.tipo === "gasto" ? movimiento.categoria : `De ${movimiento.de} a ${movimiento.a}`}</small>
      </TableCell>
      <TableCell><Badge className={movimiento.tipo === "gasto" ? "type-badge" : "type-badge type-transfer"}>{movimiento.tipo === "gasto" ? "Gasto" : "Transferencia"}</Badge></TableCell>
      <TableCell><strong>{movimiento.tipo === "gasto" ? movimiento.pagador : `${movimiento.de} → ${movimiento.a}`}</strong></TableCell>
      <TableCell>{movimiento.tipo === "gasto" ? <MovementParticipants participantes={movimiento.participantes} /> : "—"}</TableCell>
      <TableCell>{movimiento.tipo === "gasto" ? <CategoryBadge categoria={movimiento.categoria} /> : "—"}</TableCell>
      <TableCell className="desktop-movement-total"><strong>{formatoARS.format(movimiento.monto)}</strong></TableCell>
    </TableRow>
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
  onClear,
  onNombreChange,
  onAddPersona,
  onDeletePersona,
  onEditMovimiento,
  onCopyMovimientos,
  nombreMovimiento,
  getResumenPersona,
  onShareReparto,
  gastoForm,
  transferenciaForm,
}: DesktopWorkspaceProps) {
  const [desktopSection, setDesktopSection] = useState<DesktopSection>("personas")
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
  const [detailView, setDetailView] = useState<DetailView>("cards")

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

  const movementTotalPages = Math.max(1, Math.ceil(filteredMovements.length / pageSize))
  const summaryTotalPages = Math.max(1, Math.ceil(filteredSaldos.length / pageSize))
  const currentMovementPage = Math.min(movementPage, movementTotalPages)
  const currentSummaryPage = Math.min(summaryPage, summaryTotalPages)
  const pagedMovements = filteredMovements.slice((currentMovementPage - 1) * pageSize, currentMovementPage * pageSize)
  const pagedSaldos = filteredSaldos.slice((currentSummaryPage - 1) * pageSize, currentSummaryPage * pageSize)
  const resumen = selectedPersona ? getResumenPersona(selectedPersona) : null

  const navItems = [
    { section: "personas" as const, label: "Personas", meta: `${personas.length} personas`, icon: UsersIcon },
    { section: "movimientos" as const, label: "Movimientos", meta: `${movimientos.length} movimientos`, icon: ArrowUpRightIcon },
    { section: "resumen" as const, label: "Resumen", meta: "Ver saldos", icon: PieChartIcon },
  ]

  return (
    <div className="desktop-shell">
      <aside className="desktop-sidebar">
        <div className="desktop-brand">
          <span><UsersIcon /></span>
          <div><strong>Repartir gastos</strong><small>Organizá tus gastos fácilmente</small></div>
        </div>
        <nav>
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <button className={`desktop-sidebar-item ${desktopSection === item.section ? `active active-${item.section}` : ""}`} key={item.section} onClick={() => { setDesktopSection(item.section); setSelectedPersona(null); setDetailView("cards") }} type="button">
                <Icon />
                <span>{item.label}<small>{item.meta}</small></span>
              </button>
            )
          })}
        </nav>
        <Separator />
        <ConfirmDialog title="Limpiar datos" description="Esto elimina todos los datos ingresados hasta el momento." confirmText="Limpiar datos" onConfirm={onClear}>
          <button className="desktop-settings" type="button"><SettingsIcon />Limpiar datos</button>
        </ConfirmDialog>
      </aside>

      <section className={`desktop-left-panel desktop-left-${desktopSection}`}>
        {desktopSection === "personas" ? (
          <>
            <header><UsersIcon /><h2>Personas</h2><p>Añadí las personas que participan en los gastos.</p></header>
            <div className="desktop-panel-card">
              <h3>Añadir persona</h3>
              <PersonaForm nombre={nombre} onChange={onNombreChange} onAdd={onAddPersona} />
              <p className="desktop-tip">Tip: agregá todas las personas antes de empezar a cargar gastos.</p>
            </div>
          </>
        ) : null}
        {desktopSection === "movimientos" ? (
          <>
            <header><ArrowUpRightIcon /><h2>Movimientos</h2><p>Registrá gastos y transferencias.</p></header>
            <div className="desktop-panel-card desktop-form-stack">
              <Tabs defaultValue="gasto">
                <TabsList className="tabs-list">
                  <TabsTrigger className="tabs-trigger" value="gasto">Gasto</TabsTrigger>
                  <TabsTrigger className="tabs-trigger" value="transferencia">Transferencia</TabsTrigger>
                </TabsList>
                <TabsContent value="gasto">{gastoForm}</TabsContent>
                <TabsContent value="transferencia">{transferenciaForm}</TabsContent>
              </Tabs>
            </div>
          </>
        ) : null}
        {desktopSection === "resumen" ? (
          <>
            <header><PieChartIcon /><h2>Resumen</h2><p>Revisá cuánto debe pagar o recibir cada persona.</p></header>
            <div className="desktop-panel-card desktop-summary-card">
              <h3>Resumen general</h3>
              <div className="desktop-mini-totals"><span>Total gastado<strong>{formatoARS.format(totalGastado)}</strong></span><span>Promedio por persona<strong>{formatoARS.format(promedio)}</strong></span></div>
              <CategoryPie data={gastosPorCategoria} />
              <CategoryDetailList data={gastosPorCategoria} />
              <RepartirDialog open={settlementOpen} onOpenChange={onSettlementOpenChange} pendientes={pendientes} resumenCopiable={resumenCopiable} onShare={onShareReparto} />
            </div>
          </>
        ) : null}
      </section>

      <main className="desktop-main-panel">
        {desktopSection === "personas" ? (
          <section className="desktop-content-card">
            <div className="desktop-content-head"><div><h2>Personas del grupo</h2><p>{personas.length} personas registradas</p></div></div>
            <ScrollArea className="desktop-scroll-list">
              <div className="desktop-person-list">
                {personas.map((persona) => <PersonaItem key={persona} persona={persona} onDelete={onDeletePersona} />)}
                {personas.length === 0 ? <p className="empty">Agregá personas para empezar.</p> : null}
              </div>
            </ScrollArea>
          </section>
        ) : null}

        {desktopSection === "movimientos" ? (
          <section className="desktop-content-card">
            <div className="desktop-content-head">
              <div><h2>Movimientos recientes</h2><p>{filteredMovements.length} movimientos</p></div>
              <Button className="movement-copy-button" onClick={onCopyMovimientos} type="button"><CopyIcon data-icon="inline-start" />Copiar movimientos</Button>
            </div>
            <ScrollArea className="desktop-scroll-list">
              <Table className="desktop-movement-table">
                <TableHeader>
                  <TableRow>
                    <TableHead>Movimiento</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Pagó / De</TableHead>
                    <TableHead>Participantes</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead className="desktop-movement-total">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagedMovements.map(({ movimiento, index }) => <DesktopMovementRow key={`${movimiento.tipo}-${index}`} movimiento={movimiento} index={index} onEdit={onEditMovimiento} nombreMovimiento={nombreMovimiento} />)}
                </TableBody>
              </Table>
              {pagedMovements.length === 0 ? <p className="empty">No hay movimientos para mostrar.</p> : null}
            </ScrollArea>
            <div className="desktop-filter-bar">
              <label className="desktop-filter-search"><SearchIcon data-icon="inline-start" /><Input placeholder="Buscar por descripción..." value={movementSearch} onChange={(event) => { setMovementSearch(event.target.value); setMovementPage(1) }} /></label>
              <div className="desktop-filter-control"><span>Tipo</span><Select value={movementType} onValueChange={(value) => { setMovementType(value); setMovementPage(1) }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectGroup><SelectItem value="todos">Todos</SelectItem><SelectItem value="gasto">Gastos</SelectItem><SelectItem value="transferencia">Transferencias</SelectItem></SelectGroup></SelectContent></Select></div>
              <div className="desktop-filter-control"><span>Categoría</span><Select value={movementCategory} onValueChange={(value) => { setMovementCategory(value); setMovementPage(1) }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectGroup><SelectItem value="todas">Todas</SelectItem>{CATEGORIAS_GASTO.map((categoria) => <SelectItem key={categoria.key} value={categoria.key}><CategoriaIcon categoria={categoria.key} />{categoria.label}</SelectItem>)}</SelectGroup></SelectContent></Select></div>
              <div className="desktop-filter-control"><span>Pagó / De</span><Select value={movementPayer} onValueChange={(value) => { setMovementPayer(value); setMovementPage(1) }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectGroup><SelectItem value="todos">Todos</SelectItem>{personas.map((persona) => <SelectItem key={persona} value={persona}>{persona}</SelectItem>)}</SelectGroup></SelectContent></Select></div>
              <div className="desktop-filter-control desktop-filter-sort"><span>Ordenar por</span><Select value={movementSort} onValueChange={setMovementSort}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectGroup><SelectItem value="categoria">Categoría</SelectItem><SelectItem value="monto">Monto</SelectItem><SelectItem value="pagador">Pagador</SelectItem></SelectGroup></SelectContent></Select></div>
              <Pagination page={currentMovementPage} totalPages={movementTotalPages} onPage={setMovementPage} />
            </div>
          </section>
        ) : null}

        {desktopSection === "resumen" ? (
          <section className="desktop-content-card">
            {!resumen ? (
              <>
                <div className="desktop-content-head"><div><h2>Saldos por persona</h2><p>{filteredSaldos.length} personas</p></div></div>
                <ScrollArea className="desktop-scroll-list">
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
                </ScrollArea>
                <div className="desktop-filter-bar">
                  <label><SearchIcon data-icon="inline-start" /><Input placeholder="Buscar por nombre..." value={summarySearch} onChange={(event) => { setSummarySearch(event.target.value); setSummaryPage(1) }} /></label>
                  <Select value={summarySort} onValueChange={setSummarySort}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectGroup><SelectItem value="nombre">Nombre</SelectItem><SelectItem value="saldo">Saldo</SelectItem><SelectItem value="parte">Parte</SelectItem><SelectItem value="gasto">Gastó</SelectItem></SelectGroup></SelectContent></Select>
                  <Pagination page={currentSummaryPage} totalPages={summaryTotalPages} onPage={setSummaryPage} />
                </div>
              </>
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
                  {detailView === "parte" ? <DetailList title="Gastos donde participó" onBack={() => setDetailView("cards")}>{resumen.gastosDondeParticipo.map(({ movimiento, montoParte }) => <p key={`${movimiento.descripcion}-${movimiento.monto}`}><span>{movimiento.descripcion || "Gasto"}</span><strong>{formatoARS.format(montoParte)} <small>de {formatoARS.format(movimiento.monto)}</small></strong></p>)}</DetailList> : null}
                  {detailView === "pago" ? <DetailList title="Gastos que pagó" onBack={() => setDetailView("cards")}>{resumen.gastosQuePago.map((movimiento) => <p key={`${movimiento.descripcion}-${movimiento.monto}`}><span>{movimiento.descripcion || "Gasto"}</span><strong>{formatoARS.format(movimiento.monto)}</strong></p>)}</DetailList> : null}
                  {detailView === "recibido" ? <DetailList title="Pagos recibidos" onBack={() => setDetailView("cards")}>{resumen.transferenciasRecibidas.map((movimiento) => <p key={`${movimiento.de}-${movimiento.monto}`}><span>Recibió de {movimiento.de}</span><strong>{formatoARS.format(movimiento.monto)}</strong></p>)}</DetailList> : null}
                  {detailView === "transferido" ? <DetailList title="Pagos realizados" onBack={() => setDetailView("cards")}>{resumen.transferenciasEnviadas.map((movimiento) => <p key={`${movimiento.a}-${movimiento.monto}`}><span>Pagó a {movimiento.a}</span><strong>{formatoARS.format(movimiento.monto)}</strong></p>)}</DetailList> : null}
                </div>
              </div>
            )}
          </section>
        ) : null}
      </main>
    </div>
  )
}
