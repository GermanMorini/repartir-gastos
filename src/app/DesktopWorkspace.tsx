import { ChevronRightIcon, CopyIcon, EraserIcon, SearchIcon, ShareIcon } from "lucide-react"
import { useMemo, useState } from "react"
import type { ReactNode } from "react"
import { CategoriaIcon } from "../components/shared/CategoryBadge"
import { PersonSummaryDesktopDrawer } from "../features/person-summary/PersonSummary"
import { PersonaForm } from "../sections/personas/PersonaForm"
import { PersonaItem } from "../sections/personas/PersonaItem"
import { SlidingText } from "../components/shared/SlidingText"
import { PaginationControls } from "../components/shared/PaginationControls"
import { CategoryDetailList, CategoryPie } from "../sections/total/CategoryChart"
import { RepartirDialog } from "../sections/total/RepartirDialog"
import { getResumenPersona } from "../lib/calculos"
import { CATEGORIAS_GASTO } from "../lib/categorias"
import { formatoARS } from "../lib/money"
import { textoResumenPersona } from "../lib/share-text"
import type { Movimiento, Persona, ResumenCategoria, SaldoPersona, TransferenciaPendiente } from "../types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TooltipProvider } from "@/components/ui/tooltip"
import { toast } from "sonner"
import { filterAndSortBalances, filterDesktopMovements } from "../domain/movements/selectors"
import { getBalancePresentation } from "../domain/calculations/presentation"
import { copyText } from "../infrastructure/browser/sharing"
import { DesktopSidebar } from "./desktop/DesktopSidebar"
import { DesktopMovementTable } from "./desktop/DesktopMovementTable"
import type { DesktopSection, SummaryDetail } from "./desktop-types"

type DesktopWorkspaceProps = {
  desktopSection: DesktopSection
  personas: Persona[]
  nombre: string
  movimientos: Movimiento[]
  movimientosCard: { movimiento: Movimiento; index: number }[]
  saldos: SaldoPersona[]
  gastosPorCategoria: ResumenCategoria[]
  totalGastado: number
  promedio: number
  pendientes: TransferenciaPendiente[]
  settlementOpen: boolean
  onSettlementOpenChange: (open: boolean) => void
  onClear: () => void
  onNombreChange: (nombre: string) => void
  onAddPersona: () => void
  onDeletePersona: (persona: Persona) => void
  onDesktopSectionChange: (section: DesktopSection) => void
  onEditMovimiento: (index: number, movimiento: Movimiento) => void
  onCopyMovimientos: () => void
  nombreMovimiento: (movimiento: Movimiento) => string
  onShareReparto: () => void
  onShareLink: () => void
  gastoForm: ReactNode
  transferenciaForm: ReactNode
  movementTab: "gasto" | "transferencia"
  onMovementTabChange: (value: "gasto" | "transferencia") => void
}

const summaryPageSize = 6
const movementPageSize = 8
export function DesktopWorkspace({
  desktopSection,
  personas,
  nombre,
  movimientos,
  movimientosCard,
  saldos,
  gastosPorCategoria,
  totalGastado,
  promedio,
  pendientes,
  settlementOpen,
  onSettlementOpenChange,
  onClear,
  onNombreChange,
  onAddPersona,
  onDeletePersona,
  onDesktopSectionChange,
  onEditMovimiento,
  onCopyMovimientos,
  nombreMovimiento,
  onShareReparto,
  onShareLink,
  gastoForm,
  transferenciaForm,
  movementTab,
  onMovementTabChange,
}: DesktopWorkspaceProps) {
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

  const filteredMovements = useMemo(() => filterDesktopMovements(movimientosCard, { search: movementSearch, type: movementType, category: movementCategory, payer: movementPayer }, nombreMovimiento), [movementCategory, movementPayer, movementSearch, movementType, movimientosCard, nombreMovimiento])
  const filteredSaldos = useMemo(() => filterAndSortBalances(saldos, summarySearch, summarySort), [saldos, summarySearch, summarySort])

  const movementTotalPages = Math.max(1, Math.ceil(filteredMovements.length / movementPageSize))
  const summaryTotalPages = Math.max(1, Math.ceil(filteredSaldos.length / summaryPageSize))
  const currentMovementPage = Math.min(movementPage, movementTotalPages)
  const currentSummaryPage = Math.min(summaryPage, summaryTotalPages)
  const pagedMovements = filteredMovements.slice((currentMovementPage - 1) * movementPageSize, currentMovementPage * movementPageSize)
  const pagedSaldos = filteredSaldos.slice((currentSummaryPage - 1) * summaryPageSize, currentSummaryPage * summaryPageSize)
  const copyResumenPersona = (persona: Persona) => {
    void copyText(textoResumenPersona(getResumenPersona(persona, movimientos), pendientes))
      .then((result) => result === "copied" ? toast.success("Resumen copiado.") : toast.error("No se pudo copiar el resumen."))
  }

  return (
    <TooltipProvider>
    <div className="desktop-shell">
      <DesktopSidebar movementCount={movimientos.length} onClear={onClear} onSectionChange={(section) => { onDesktopSectionChange(section); setSelectedPersona(null); setSelectedDetail(null) }} peopleCount={personas.length} section={desktopSection} />

      <section className={`desktop-left-panel desktop-left-${desktopSection}`} data-tour={desktopSection === "resumen" ? undefined : `desktop-${desktopSection}`}>
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
              <Tabs value={movementTab} onValueChange={(value) => onMovementTabChange(value as "gasto" | "transferencia")}>
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
              <RepartirDialog open={settlementOpen} onOpenChange={onSettlementOpenChange} pendientes={pendientes} onShare={onShareReparto} />
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
                {personas.length === 0 ? <Badge className="empty-state-badge">Sin personas</Badge> : null}
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
              <DesktopMovementTable allCount={movimientos.length} getName={nombreMovimiento} items={pagedMovements} onEdit={onEditMovimiento} />
            </ScrollArea>
            <div className="desktop-filter-bar">
              <Button aria-label="Limpiar filtros" className="desktop-clear-filters" onClick={() => { setMovementSearch(""); setMovementType("todos"); setMovementCategory("todas"); setMovementPayer("todos"); setMovementPage(1) }} type="button"><EraserIcon /></Button>
              <label className="desktop-filter-search"><SearchIcon data-icon="inline-start" /><Input placeholder="Buscar por descripción..." value={movementSearch} onChange={(event) => { setMovementSearch(event.target.value); setMovementPage(1) }} /></label>
              <div className="desktop-filter-control"><span>Tipo</span><Select value={movementType} onValueChange={(value) => { setMovementType(value); setMovementPage(1) }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectGroup><SelectItem value="todos">Todos</SelectItem><SelectItem value="gasto">Gastos</SelectItem><SelectItem value="transferencia">Transferencias</SelectItem></SelectGroup></SelectContent></Select></div>
              <div className="desktop-filter-control"><span>Categoría</span><Select value={movementCategory} onValueChange={(value) => { setMovementCategory(value); setMovementPage(1) }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectGroup><SelectItem value="todas">Todas</SelectItem>{CATEGORIAS_GASTO.map((categoria) => <SelectItem key={categoria.key} value={categoria.key}><CategoriaIcon categoria={categoria.key} />{categoria.label}</SelectItem>)}</SelectGroup></SelectContent></Select></div>
              <div className="desktop-filter-control"><span>Pagó / De</span><Select value={movementPayer} onValueChange={(value) => { setMovementPayer(value); setMovementPage(1) }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectGroup><SelectItem value="todos">Todos</SelectItem>{personas.map((persona) => <SelectItem key={persona} value={persona}>{persona}</SelectItem>)}</SelectGroup></SelectContent></Select></div>
              <PaginationControls orientation="horizontal" page={currentMovementPage} totalPages={movementTotalPages} onPage={setMovementPage} />
            </div>
          </section>
        ) : null}

        {desktopSection === "resumen" ? (
          <section className="desktop-content-card">
            <div className="desktop-content-head"><div><h2>Saldos por persona</h2><p>{filteredSaldos.length} personas</p></div></div>
            <ScrollArea className="desktop-scroll-list">
              <div className="desktop-summary-card-grid">
                {filteredSaldos.length === 0 ? <Badge className="empty-state-badge">Sin saldos</Badge> : null}
                {pagedSaldos.map((saldo) => {
                  const estado = getBalancePresentation(saldo.saldo)
                  return (
                    <article className="desktop-summary-person-card" key={saldo.persona} onClick={() => copyResumenPersona(saldo.persona)} role="button" tabIndex={0} onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault()
                        copyResumenPersona(saldo.persona)
                      }
                    }}>
                      <div className="desktop-summary-card-head"><SlidingText className="desktop-summary-card-name">{saldo.persona}</SlidingText><Badge className={estado.className}>{estado.label}</Badge></div>
                      <button onClick={(event) => { event.stopPropagation(); setSelectedPersona(saldo.persona); setSelectedDetail("parte") }} type="button">Le tocaba gastar<b>{formatoARS.format(saldo.totalDebidoEnGastos)}</b><ChevronRightIcon /></button>
                      <button onClick={(event) => { event.stopPropagation(); setSelectedPersona(saldo.persona); setSelectedDetail("gasto") }} type="button">Gastó<b>{formatoARS.format(saldo.totalSalioBolsillo)}</b><ChevronRightIcon /></button>
                      <button onClick={(event) => { event.stopPropagation(); setSelectedPersona(saldo.persona); setSelectedDetail("recibido") }} type="button">Ya recibió<b>{formatoARS.format(saldo.totalRecibido)}</b><ChevronRightIcon /></button>
                      <button onClick={(event) => { event.stopPropagation(); setSelectedPersona(saldo.persona); setSelectedDetail("transferencias") }} type="button">Saldo<b className={estado.className}>{formatoARS.format(saldo.saldo)}</b><ChevronRightIcon /></button>
                    </article>
                  )
                })}
              </div>
            </ScrollArea>
            <div className="desktop-filter-bar">
              <Button aria-label="Limpiar filtros" className="desktop-clear-filters" onClick={() => { setSummarySearch(""); setSummarySort("nombre"); setSummaryPage(1) }} type="button"><EraserIcon /></Button>
              <label className="desktop-filter-search"><SearchIcon data-icon="inline-start" /><Input placeholder="Buscar por nombre..." value={summarySearch} onChange={(event) => { setSummarySearch(event.target.value); setSummaryPage(1) }} /></label>
              <div className="desktop-filter-control desktop-filter-sort"><span>Ordenar por</span><Select value={summarySort} onValueChange={setSummarySort}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectGroup><SelectItem value="nombre">Nombre</SelectItem><SelectItem value="saldo">Saldo</SelectItem><SelectItem value="parte">Parte</SelectItem><SelectItem value="gasto">Gastó</SelectItem></SelectGroup></SelectContent></Select></div>
              <PaginationControls orientation="horizontal" page={currentSummaryPage} totalPages={summaryTotalPages} onPage={setSummaryPage} />
            </div>
            {selectedPersona && selectedDetail ? <PersonSummaryDesktopDrawer detail={selectedDetail} movimientos={movimientos} onClose={() => { setSelectedPersona(null); setSelectedDetail(null) }} persona={selectedPersona} personas={personas} /> : null}
          </section>
        ) : null}
      </main>
      {desktopSection === "resumen" ? <div className="desktop-tour-resumen-target" data-tour="desktop-resumen" /> : null}
    </div>
    </TooltipProvider>
  )
}
