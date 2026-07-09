import type { CSSProperties } from "react"
import { Trash2Icon } from "lucide-react"
import { ConfirmDialog } from "../../components/shared/ConfirmDialog"
import { SlidingNames, SlidingText } from "../../components/shared/SlidingText"
import { CategoryBadge } from "../../components/shared/CategoryBadge"
import { formatoARS } from "../../lib/money"
import { getCategoria } from "../../lib/categorias"
import type { Movimiento } from "../../types"

export function MovimientoItem({
  movimiento,
  index,
  onEdit,
  onDelete,
  nombreMovimiento,
}: {
  movimiento: Movimiento
  index: number
  onEdit: (index: number, movimiento: Movimiento) => void
  onDelete: (index: number) => void
  nombreMovimiento: (movimiento: Movimiento) => string
}) {
  return (
    <div className="movement-row" style={movimiento.tipo === "gasto" ? { "--movement-color": getCategoria(movimiento.categoria).color } as CSSProperties : undefined}>
      <button className="movement-edit" onClick={() => onEdit(index, movimiento)} type="button">
        <span className="movement-copy">
          <span className="movement-title">
            <SlidingText className="movement-name">{nombreMovimiento(movimiento)}</SlidingText>
            {movimiento.tipo === "gasto" ? <SlidingText className="movement-paid-by">Pagó {movimiento.pagador}</SlidingText> : null}
            {movimiento.tipo === "gasto" ? <CategoryBadge categoria={movimiento.categoria} /> : null}
          </span>
          {movimiento.tipo === "gasto" ? (
            <span className="movement-participants">
              <SlidingNames names={movimiento.participantes.join(", ")} />
            </span>
          ) : (
            <>
              <SlidingText className="movement-transfer-label">{movimiento.de} pagó {formatoARS.format(movimiento.monto)} a {movimiento.a}</SlidingText>
              <span className="movement-transfer-participants">
                <SlidingNames names={`${movimiento.de}, ${movimiento.a}`} />
              </span>
            </>
          )}
        </span>
      </button>
      <strong className={`movement-amount ${movimiento.tipo === "transferencia" ? "movement-amount-transfer" : ""}`}>{formatoARS.format(movimiento.monto)}</strong>
      <ConfirmDialog title="Eliminar movimiento" description={<>Esto elimina <strong>{nombreMovimiento(movimiento)}</strong> del reparto.</>} onConfirm={() => onDelete(index)}>
        <button aria-label="Eliminar movimiento" className="movement-delete" type="button">
          <Trash2Icon />
        </button>
      </ConfirmDialog>
    </div>
  )
}
