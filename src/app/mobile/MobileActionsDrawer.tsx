import { ArrowLeftIcon, CalculatorIcon, CopyIcon, DownloadIcon, PieChartIcon, ShareIcon, ShredderIcon } from "lucide-react"
import type { RefObject } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ConfirmDialog } from "../../components/shared/ConfirmDialog"
import { formatoARS, formatoSaldoMatriz } from "../../lib/money"
import { CategoryDetailList, CategoryPie } from "../../sections/total/CategoryChart"
import type { FilaCalculo, Persona, ResumenCategoria } from "../../types"

export function MobileActionsDrawer({ open, view, direction, animating, personas, rows, categories, total, calculationsRef, onOpenChange, onView, onBack, onClear, onCopyCategories, onExportCategories, onExportCalculations }: {
  open: boolean
  view: "menu" | "grafico" | "calculos"
  direction: "forward" | "back"
  animating: boolean
  personas: Persona[]
  rows: FilaCalculo[]
  categories: ResumenCategoria[]
  total: number
  calculationsRef: RefObject<HTMLDivElement | null>
  onOpenChange: (open: boolean) => void
  onView: (view: "grafico" | "calculos") => void
  onBack: () => void
  onClear: () => void
  onCopyCategories: () => void
  onExportCategories: () => void
  onExportCalculations: () => void
}) {
  const panelClass = `mobile-actions-panel ${animating ? `panel-${direction}` : ""}`
  return <Sheet open={open} onOpenChange={onOpenChange}><SheetContent className="mobile-actions-drawer" side="right">
    {view === "menu" ? <div className={panelClass} key="menu"><div className="mobile-actions-head"><button className="mobile-actions-back" onClick={() => onOpenChange(false)} type="button"><ArrowLeftIcon />Cerrar</button><h2>Acciones</h2><p>Herramientas del reparto.</p></div><div className="mobile-actions-list"><button onClick={() => onView("grafico")} type="button"><PieChartIcon /><span><strong>Graficar</strong><small>compara gastos por categoría</small></span></button><button onClick={() => onView("calculos")} type="button"><CalculatorIcon /><span><strong>Calcular</strong><small>revisa los cálculos paso a paso</small></span></button><ConfirmDialog title="Limpiar datos" description="Esto elimina todos los datos ingresados hasta el momento." confirmText="Limpiar datos" onConfirm={onClear}><button type="button"><ShredderIcon /><span><strong>Limpiar datos</strong><small>borra personas y movimientos</small></span></button></ConfirmDialog></div></div> : null}
    {view === "grafico" ? <div className={panelClass} key="grafico"><div className="mobile-actions-head"><button className="mobile-actions-back" onClick={onBack} type="button"><ArrowLeftIcon />Volver</button><h2>Gráfico</h2><p>Compará gastos por categoría.</p></div><div className="category-chart-card"><div className="category-chart-layout"><CategoryPie data={categories} /><CategoryDetailList data={categories} /></div><Separator /><div className="category-total"><span>Total gastado</span><strong>{formatoARS.format(total)}</strong></div></div><div className="dialog-actions"><Button className="btn-outline" onClick={onCopyCategories} type="button"><CopyIcon data-icon="inline-start" />Copiar resumen</Button><Button onClick={onExportCategories} type="button"><ShareIcon data-icon="inline-start" />Compartir</Button></div></div> : null}
    {view === "calculos" ? <div className={panelClass} key="calculos"><div className="mobile-actions-head"><button className="mobile-actions-back" onClick={onBack} type="button"><ArrowLeftIcon />Volver</button></div><div className="calculations-content" ref={calculationsRef}><div className="calculations-head"><DialogTitle className="dialog-title">Cálculos</DialogTitle><DialogDescription className="dialog-description">Cuentas hechas paso a paso. Se subraya quién pagó o transfirió cada movimiento.</DialogDescription><Badge>{personas.length} personas</Badge></div><Separator /><ScrollArea className="calculations-scroll"><Table><TableHeader><TableRow><TableHead className="calculation-movement-column">Movimiento</TableHead>{personas.map((persona) => <TableHead className="number" key={persona}>{persona}</TableHead>)}</TableRow></TableHeader><TableBody>{rows.map((row) => <TableRow key={row.paso}><TableCell className="calculation-movement-column">{row.movimiento} <strong className="calculation-movement-amount">({formatoARS.format(row.monto)})</strong></TableCell>{personas.map((persona) => { const balance = row.saldos[persona] ?? 0; const status = balance > 0 ? "amount-positive" : balance < 0 ? "amount-negative" : "amount-zero"; return <TableCell className={`number ${status}${persona === row.personaDestacada ? " amount-highlight" : ""}`} key={persona}>{formatoSaldoMatriz(balance)}</TableCell> })}</TableRow>)}</TableBody></Table></ScrollArea></div><div className="dialog-actions"><Button onClick={onExportCalculations} type="button"><DownloadIcon data-icon="inline-start" />Compartir</Button></div></div> : null}
  </SheetContent></Sheet>
}
