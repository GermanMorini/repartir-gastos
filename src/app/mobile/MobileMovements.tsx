import { ArrowLeftRightIcon, CopyIcon, PlusIcon, ShareIcon } from "lucide-react"
import type { CSSProperties, RefObject } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PaginationControls } from "../../components/shared/PaginationControls"
import type { IndexedMovement } from "../../domain/movements/selectors"
import { nombreMovimiento } from "../../lib/share-text"
import { GastoForm } from "../../sections/movimientos/GastoForm"
import { MovementEditForm } from "../../sections/movimientos/MovementEditForm"
import { MovimientoItem } from "../../sections/movimientos/MovimientoItem"
import { TransferenciaForm } from "../../sections/movimientos/TransferenciaForm"
import type { GastoFormState, GastoMovimiento, MovementEditState, Persona, TransferenciaFormState, TransferenciaMovimiento } from "../../types"

export function MobileMovements(props: {
  className: string
  personas: Persona[]
  movementCount: number
  visibleMovements: IndexedMovement[]
  page: number
  totalPages: number
  pageSize: number
  pageDirection: "next" | "prev"
  pageAnimating: boolean
  suppressAnimation: boolean
  sectionRef: RefObject<HTMLElement | null>
  listRef: RefObject<HTMLDivElement | null>
  formOpen: boolean
  edit: MovementEditState | null
  tab: "gasto" | "transferencia"
  gasto: GastoFormState
  transferencia: TransferenciaFormState
  demoTarget: string | null
  onFormOpenChange: (open: boolean) => void
  onEditChange: (edit: MovementEditState | null) => void
  onTabChange: (tab: "gasto" | "transferencia") => void
  onGastoChange: (form: GastoFormState) => void
  onTransferenciaChange: (form: TransferenciaFormState) => void
  onAddGasto: () => void
  onAddTransferencia: () => void
  onEdit: (index: number, movement: IndexedMovement["movimiento"]) => void
  onEditGasto: (changes: Partial<GastoMovimiento>) => void
  onEditTransferencia: (changes: Partial<TransferenciaMovimiento>) => void
  onSubmitEdit: () => void
  onDelete: (index: number) => void
  onPage: (page: number) => void
  onCopy: () => void
  onShare: () => void
}) {
  return <>
    <section className={`app-section movement-form movement-form-launcher ${props.className}`} id="movimientos" data-tour="movimientos"><div className="section-head movement-form-head"><div className="section-title section-title-movements"><span className="section-icon"><ArrowLeftRightIcon /></span><div><h2>Movimientos</h2><p>Registrá gastos y transferencias.</p></div></div><div className="movement-head-actions"><span className="muted">{props.movementCount} movimientos</span><Button className="movement-copy-button movement-copy-desktop" data-tour="copy-movimientos-desktop" onClick={props.onCopy} type="button"><CopyIcon data-icon="inline-start" />Copiar movimientos</Button></div></div><Button className="mobile-add-movement-trigger" onClick={() => props.onFormOpenChange(true)} type="button"><PlusIcon data-icon="inline-start" />Añadir</Button><Sheet open={props.formOpen} onOpenChange={props.onFormOpenChange}><SheetContent className="mobile-movement-sheet movement-form" side="bottom"><div className="mobile-sheet-head"><h2>Añadir movimiento</h2><p>Podés cargar varios movimientos sin cerrar esta ventana.</p></div><Tabs value={props.tab} onValueChange={(value) => props.onTabChange(value as "gasto" | "transferencia")}><TabsList className="tabs-list"><TabsTrigger className="tabs-trigger" value="gasto">Gasto</TabsTrigger><TabsTrigger className="tabs-trigger" value="transferencia">Transferencia</TabsTrigger></TabsList><TabsContent value="gasto"><GastoForm demoPressed={props.demoTarget === "add-expense-button"} onChange={props.onGastoChange} onSubmit={props.onAddGasto} personas={props.personas} value={props.gasto} variant="mobile" /></TabsContent><TabsContent value="transferencia"><TransferenciaForm demoPressed={props.demoTarget === "add-transfer-button"} onChange={props.onTransferenciaChange} onSubmit={props.onAddTransferencia} personas={props.personas} value={props.transferencia} variant="mobile" /></TabsContent></Tabs></SheetContent></Sheet></section>
    <section className={`app-section movements-section ${props.className}`} ref={props.sectionRef}><div className="section-head"><h2>Listado</h2></div><p className="movement-hint"><span className="hint-mobile">Tocá en un movimiento para editarlo.</span><span className="hint-desktop">Clickeá en un movimiento para editarlo.</span></p><div className={`movement-list ${props.pageAnimating && !props.suppressAnimation ? `page-slide-${props.pageDirection}` : ""}`} key={props.page} ref={props.listRef} style={{ "--visible-items": props.pageSize } as CSSProperties}>{props.movementCount === 0 ? <Badge className="empty-state-badge">Sin movimientos</Badge> : null}{props.visibleMovements.map(({ movimiento, index }) => <MovimientoItem index={index} key={`${movimiento.tipo}-${index}`} movimiento={movimiento} nombreMovimiento={nombreMovimiento} onDelete={props.onDelete} onEdit={props.onEdit} />)}</div><div className="movement-list-actions"><PaginationControls page={props.page} totalPages={props.totalPages} onPage={props.onPage} /><Button className="movement-copy-button movement-copy-mobile" data-tour="copy-movimientos-mobile" disabled={props.movementCount === 0} onClick={props.onShare} type="button"><ShareIcon data-icon="inline-start" />Compartir</Button></div><Sheet open={props.edit !== null} onOpenChange={(open) => !open && props.onEditChange(null)}><SheetContent className="edit-dialog mobile-movement-editor-sheet" side="bottom"><DialogTitle>Editar movimiento</DialogTitle><DialogDescription>Cambia los datos de este movimiento</DialogDescription><MovementEditForm edit={props.edit} personas={props.personas} onChange={props.onEditChange} onClose={() => props.onEditChange(null)} onEditExpense={props.onEditGasto} onEditTransfer={props.onEditTransferencia} onSubmit={props.onSubmitEdit} /></SheetContent></Sheet></section>
  </>
}
