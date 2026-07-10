import { ArrowUpRightIcon, ChevronLeftIcon, ChevronRightIcon, CopyIcon, EraserIcon, PieChartIcon, SearchIcon, ShareIcon, Shredder, UsersIcon } from "lucide-react"
import { useMemo, useState } from "react"
import type { ReactNode } from "react"
import { ConfirmDialog } from "../components/shared/ConfirmDialog"
import { CategoriaIcon, CategoryBadge } from "../components/shared/CategoryBadge"
import { PersonSummaryDesktopDrawer } from "../features/person-summary/PersonSummary"
import { PersonaForm } from "../sections/personas/PersonaForm"
import { PersonaItem } from "../sections/personas/PersonaItem"
import { SlidingText } from "../components/shared/SlidingText"
import { CategoryDetailList, CategoryPie } from "../sections/total/CategoryChart"
import { RepartirDialog } from "../sections/total/RepartirDialog"
import { CATEGORIAS_GASTO } from "../lib/categorias"
import { formatoARS } from "../lib/money"
import type { Movimiento, Persona, ResumenCategoria, SaldoPersona, TransferenciaPendiente } from "../types"
import { Badge, Button, Input, ScrollArea, Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue, Separator, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui"

type DesktopSection = "personas" | "movimientos" | "resumen"
type SummaryDetail = "parte" | "gasto" | "recibido" | "transferencias"
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
  onShareReparto: () => void
  onShareLink: () => void
  gastoForm: ReactNode
  transferenciaForm: ReactNode
}

const summaryPageSize = 6
const movementPageSize = 8

function estadoSaldo(saldo: number) {
  const centavos = Math.round(saldo * 100)
  if (centavos > 0) return { label: "A favor", className: "positive" }
  if (centavos < 0) return { label: "Debe", className: "negative" }
  return { label: "Al día", className: "neutral" }
}

function Pagination({ page, totalPages, onPage }: { page: number; totalPages: number; onPage: (page: number) => void }) {
  return (
    <div className="desktop-pagination">
      <Button className="btn-outline" disabled={page <= 1} onClick={() => onPage(page - 1)} type="button"><ChevronLeftIcon /></Button>
      <span>{page} de {totalPages}</span>
      <Button className="btn-outline" disabled={page >= totalPages} onClick={() => onPage(page + 1)} type="button"><ChevronRightIcon /></Button>
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
        {movimiento.tipo === "gasto" ? <span className="desktop-movement-icon"><CategoriaIcon categoria={movimiento.categoria} /></span> : <span className="desktop-movement-icon type-transfer"><ArrowUpRightIcon /></span>}
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
  onShareReparto,
  onShareLink,
  gastoForm,
  transferenciaForm,
}: DesktopWorkspaceProps) {
  const [desktopSection, setDesktopSection] = useState<DesktopSection>("personas")
  const [movementPage, setMovementPage] = useState(1)
  const [movementSearch, setMovementSearch] = useState("")
  const [movementType, setMovementType] = useState("todos")
  const [movementCategory, setMovementCategory] = useState("todas")
  const [movementPayer, setMovementPayer] = useState("todos")
  const [summaryPage, setSummaryPage] = useState(1)
  const [summarySearch, setSummarySearch] = useState("")
  const [summarySort, setSummarySort] = useState("nombre")
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null)
  const [selectedDetail, setSelectedDetail] = useState<SummaryDetail | null>(null)

  const filteredMovements = useMemo(() => {
    const text = movementSearch.trim().toLowerCase()
    return movimientosCard
      .filter(({ movimiento }) => !text || nombreMovimiento(movimiento).toLowerCase().includes(text))
      .filter(({ movimiento }) => movementType === "todos" || movimiento.tipo === movementType)
      .filter(({ movimiento }) => movementCategory === "todas" || (movimiento.tipo === "gasto" && movimiento.categoria === movementCategory))
      .filter(({ movimiento }) => movementPayer === "todos" || (movimiento.tipo === "gasto" ? movimiento.pagador === movementPayer : movimiento.de === movementPayer))
      .sort((a, b) => b.movimiento.monto - a.movimiento.monto)
  }, [movementCategory, movementPayer, movementSearch, movementType, movimientosCard, nombreMovimiento])

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

  const movementTotalPages = Math.max(1, Math.ceil(filteredMovements.length / movementPageSize))
  const summaryTotalPages = Math.max(1, Math.ceil(filteredSaldos.length / summaryPageSize))
  const currentMovementPage = Math.min(movementPage, movementTotalPages)
  const currentSummaryPage = Math.min(summaryPage, summaryTotalPages)
  const pagedMovements = filteredMovements.slice((currentMovementPage - 1) * movementPageSize, currentMovementPage * movementPageSize)
  const pagedSaldos = filteredSaldos.slice((currentSummaryPage - 1) * summaryPageSize, currentSummaryPage * summaryPageSize)
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
              <button className={`desktop-sidebar-item nav-${item.section} ${desktopSection === item.section ? `active active-${item.section}` : ""}`} key={item.section} onClick={() => { setDesktopSection(item.section); setSelectedPersona(null); setSelectedDetail(null) }} type="button">
                <Icon />
                <span>{item.label}<small>{item.meta}</small></span>
              </button>
            )
          })}
        </nav>
        <Separator />
        <ConfirmDialog title="Limpiar datos" description="Esto elimina todos los datos ingresados hasta el momento." confirmText="Limpiar datos" onConfirm={onClear}>
          <button className="desktop-settings" type="button"><Shredder />Limpiar datos</button>
        </ConfirmDialog>
      </aside>

      <section className={`desktop-left-panel desktop-left-${desktopSection}`}>
        {desktopSection === "personas" ? (
          <>
            <header><h2>Personas</h2><p>Añadí las personas que participan en los gastos.</p></header>
            <div className="desktop-panel-card">
              <h3>Añadir persona</h3>
              <PersonaForm nombre={nombre} onChange={onNombreChange} onAdd={onAddPersona} />
              <p className="desktop-tip">Tip: agregá todas las personas antes de empezar a cargar gastos.</p>
            </div>
          </>
        ) : null}
        {desktopSection === "movimientos" ? (
          <>
            <header><h2>Movimientos</h2><p>Registrá gastos y transferencias.</p></header>
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
            <header><h2>Resumen</h2><p>Revisá cuánto debe pagar o recibir cada persona.</p></header>
            <div className="desktop-panel-card desktop-summary-card">
              <h3>Resumen general</h3>
              <div className="desktop-mini-totals"><span>Total gastado<strong>{formatoARS.format(totalGastado)}</strong></span><span>Promedio por persona<strong>{formatoARS.format(promedio)}</strong></span></div>
              <CategoryPie data={gastosPorCategoria} />
              <CategoryDetailList data={gastosPorCategoria} />
              <RepartirDialog open={settlementOpen} onOpenChange={onSettlementOpenChange} pendientes={pendientes} resumenCopiable={resumenCopiable} onShare={onShareReparto} />
              <Button className="btn-outline desktop-share-summary" onClick={onShareLink} type="button"><ShareIcon data-icon="inline-start" />Compartir resumen</Button>
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
              <Button aria-label="Limpiar filtros" className="desktop-clear-filters" onClick={() => { setMovementSearch(""); setMovementType("todos"); setMovementCategory("todas"); setMovementPayer("todos"); setMovementPage(1) }} type="button"><EraserIcon /></Button>
              <label className="desktop-filter-search"><SearchIcon data-icon="inline-start" /><Input placeholder="Buscar por descripción..." value={movementSearch} onChange={(event) => { setMovementSearch(event.target.value); setMovementPage(1) }} /></label>
              <div className="desktop-filter-control"><span>Tipo</span><Select value={movementType} onValueChange={(value) => { setMovementType(value); setMovementPage(1) }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectGroup><SelectItem value="todos">Todos</SelectItem><SelectItem value="gasto">Gastos</SelectItem><SelectItem value="transferencia">Transferencias</SelectItem></SelectGroup></SelectContent></Select></div>
              <div className="desktop-filter-control"><span>Categoría</span><Select value={movementCategory} onValueChange={(value) => { setMovementCategory(value); setMovementPage(1) }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectGroup><SelectItem value="todas">Todas</SelectItem>{CATEGORIAS_GASTO.map((categoria) => <SelectItem key={categoria.key} value={categoria.key}><CategoriaIcon categoria={categoria.key} />{categoria.label}</SelectItem>)}</SelectGroup></SelectContent></Select></div>
              <div className="desktop-filter-control"><span>Pagó / De</span><Select value={movementPayer} onValueChange={(value) => { setMovementPayer(value); setMovementPage(1) }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectGroup><SelectItem value="todos">Todos</SelectItem>{personas.map((persona) => <SelectItem key={persona} value={persona}>{persona}</SelectItem>)}</SelectGroup></SelectContent></Select></div>
              <Pagination page={currentMovementPage} totalPages={movementTotalPages} onPage={setMovementPage} />
            </div>
          </section>
        ) : null}

        {desktopSection === "resumen" ? (
          <section className="desktop-content-card">
            <div className="desktop-content-head"><div><h2>Saldos por persona</h2><p>{filteredSaldos.length} personas</p></div></div>
            <ScrollArea className="desktop-scroll-list">
              <div className="desktop-summary-card-grid">
                {pagedSaldos.map((saldo) => {
                  const estado = estadoSaldo(saldo.saldo)
                  return (
                    <article className="desktop-summary-person-card" key={saldo.persona}>
                      <div className="desktop-summary-card-head"><SlidingText className="desktop-summary-card-name">{saldo.persona}</SlidingText><Badge className={estado.className}>{estado.label}</Badge></div>
                      <button onClick={() => { setSelectedPersona(saldo.persona); setSelectedDetail("parte") }} type="button">Le tocaba gastar<b>{formatoARS.format(saldo.totalDebidoEnGastos)}</b><ChevronRightIcon /></button>
                      <button onClick={() => { setSelectedPersona(saldo.persona); setSelectedDetail("gasto") }} type="button">Gastó<b>{formatoARS.format(saldo.totalSalioBolsillo)}</b><ChevronRightIcon /></button>
                      <button onClick={() => { setSelectedPersona(saldo.persona); setSelectedDetail("recibido") }} type="button">Ya recibió<b>{formatoARS.format(saldo.totalRecibido)}</b><ChevronRightIcon /></button>
                      <button onClick={() => { setSelectedPersona(saldo.persona); setSelectedDetail("transferencias") }} type="button">Saldo<b className={estado.className}>{formatoARS.format(saldo.saldo)}</b><ChevronRightIcon /></button>
                    </article>
                  )
                })}
              </div>
            </ScrollArea>
            <div className="desktop-filter-bar">
              <Button aria-label="Limpiar filtros" className="desktop-clear-filters" onClick={() => { setSummarySearch(""); setSummarySort("nombre"); setSummaryPage(1) }} type="button"><EraserIcon /></Button>
              <label className="desktop-filter-search"><SearchIcon data-icon="inline-start" /><Input placeholder="Buscar por nombre..." value={summarySearch} onChange={(event) => { setSummarySearch(event.target.value); setSummaryPage(1) }} /></label>
              <div className="desktop-filter-control desktop-filter-sort"><span>Ordenar por</span><Select value={summarySort} onValueChange={setSummarySort}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectGroup><SelectItem value="nombre">Nombre</SelectItem><SelectItem value="saldo">Saldo</SelectItem><SelectItem value="parte">Parte</SelectItem><SelectItem value="gasto">Gastó</SelectItem></SelectGroup></SelectContent></Select></div>
              <Pagination page={currentSummaryPage} totalPages={summaryTotalPages} onPage={setSummaryPage} />
            </div>
            {selectedPersona && selectedDetail ? <PersonSummaryDesktopDrawer detail={selectedDetail} movimientos={movimientos} onClose={() => { setSelectedPersona(null); setSelectedDetail(null) }} persona={selectedPersona} personas={personas} /> : null}
          </section>
        ) : null}
      </main>
    </div>
  )
}
