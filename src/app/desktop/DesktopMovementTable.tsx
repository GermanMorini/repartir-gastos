import { ArrowUpRightIcon } from "lucide-react"
import { useState } from "react"
import type { MouseEvent as ReactMouseEvent } from "react"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { CategoriaIcon, CategoryBadge } from "../../components/shared/CategoryBadge"
import { formatoARS } from "../../lib/money"
import type { IndexedMovement } from "../../domain/movements/selectors"
import type { Movimiento, Persona } from "../../types"

const headers = ["Movimiento", "Tipo", "Pagó / De", "Participantes", "Categoría", "Total"]
const initialWidths = [24, 12, 16, 15, 15, 18]

function MovementParticipants({ participantes }: { participantes: Persona[] }) {
  const visible = participantes.slice(0, 2)
  const remaining = participantes.length - visible.length
  const text = participantes.join(", ")
  return <Tooltip><TooltipTrigger asChild><span className="desktop-participants-tooltip" aria-label={`Participantes: ${text}`}><span className="desktop-participant-dots">{visible.map((persona) => <span className="avatar" key={persona}>{persona[0]?.toUpperCase()}</span>)}{remaining > 0 ? <small>+{remaining}</small> : null}</span></span></TooltipTrigger><TooltipContent className="desktop-participants-tooltip-portal" side="top">{text}</TooltipContent></Tooltip>
}

function MovementRow({ movimiento, index, onEdit, getName }: { movimiento: Movimiento; index: number; onEdit: (index: number, movimiento: Movimiento) => void; getName: (movimiento: Movimiento) => string }) {
  return <TableRow className="desktop-movement-row" onClick={() => onEdit(index, movimiento)}>
    <TableCell className="desktop-movement-name">{movimiento.tipo === "gasto" ? <span className="desktop-movement-icon"><CategoriaIcon categoria={movimiento.categoria} /></span> : <span className="desktop-movement-icon type-transfer"><ArrowUpRightIcon /></span>}<strong>{getName(movimiento)}</strong><small>{movimiento.tipo === "gasto" ? movimiento.categoria : `De ${movimiento.de} a ${movimiento.a}`}</small></TableCell>
    <TableCell><Badge className={movimiento.tipo === "gasto" ? "type-badge" : "type-badge type-transfer"}>{movimiento.tipo === "gasto" ? "Gasto" : "Transferencia"}</Badge></TableCell>
    <TableCell><strong>{movimiento.tipo === "gasto" ? movimiento.pagador : `${movimiento.de} → ${movimiento.a}`}</strong></TableCell>
    <TableCell>{movimiento.tipo === "gasto" ? <MovementParticipants participantes={movimiento.participantes} /> : "—"}</TableCell>
    <TableCell>{movimiento.tipo === "gasto" ? <CategoryBadge categoria={movimiento.categoria} /> : "—"}</TableCell>
    <TableCell className="desktop-movement-total"><strong>{formatoARS.format(movimiento.monto)}</strong></TableCell>
  </TableRow>
}

export function DesktopMovementTable({ items, allCount, onEdit, getName }: { items: IndexedMovement[]; allCount: number; onEdit: (index: number, movimiento: Movimiento) => void; getName: (movimiento: Movimiento) => string }) {
  const [widths, setWidths] = useState(initialWidths)
  const startResize = (column: number, event: ReactMouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()
    const tableWidth = event.currentTarget.closest("table")?.getBoundingClientRect().width ?? 1
    const startX = event.clientX
    const startWidths = [...widths]
    const pairTotal = startWidths[column] + startWidths[column + 1]
    const onMove = (moveEvent: MouseEvent) => {
      const current = Math.max(8, startWidths[column] + ((moveEvent.clientX - startX) / tableWidth) * 100)
      if (pairTotal - current < 8) return
      setWidths((values) => values.map((value, index) => index === column ? current : index === column + 1 ? pairTotal - current : value))
    }
    const onUp = () => {
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseup", onUp)
      document.body.classList.remove("is-resizing-column")
    }
    document.body.classList.add("is-resizing-column")
    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)
  }
  return <>
    <Table className="desktop-movement-table">
      <colgroup>{widths.map((width, index) => <col key={headers[index]} style={{ width: `${width}%` }} />)}</colgroup>
      <TableHeader><TableRow>{headers.map((header, index) => <TableHead className={index === headers.length - 1 ? "desktop-movement-total" : ""} key={header}><span>{header}</span>{index < headers.length - 1 ? <button aria-label={`Cambiar ancho de ${header}`} className="desktop-column-resizer" onMouseDown={(event) => startResize(index, event)} type="button" /> : null}</TableHead>)}</TableRow></TableHeader>
      <TableBody>{items.map(({ movimiento, index }) => <MovementRow getName={getName} index={index} key={`${movimiento.tipo}-${index}`} movimiento={movimiento} onEdit={onEdit} />)}</TableBody>
    </Table>
    {items.length === 0 ? <div className="desktop-empty-table-state"><Badge className="empty-state-badge">{allCount === 0 ? "Sin movimientos" : "Sin resultados"}</Badge></div> : null}
  </>
}
