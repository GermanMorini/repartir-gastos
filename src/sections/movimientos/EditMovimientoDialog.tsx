import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import type { GastoMovimiento, MovementEditState, Persona, TransferenciaMovimiento } from "../../types"
import { MovementEditForm } from "./MovementEditForm"

export type EdicionMovimiento = MovementEditState | null

export function EditMovimientoDialog({ edicion, personas, onClose, onSubmit, onChange, onEditarGasto, onEditarTransferencia }: {
  edicion: EdicionMovimiento
  personas: Persona[]
  onClose: () => void
  onSubmit: () => void
  onChange: (edicion: EdicionMovimiento) => void
  onEditarGasto: (cambios: Partial<GastoMovimiento>) => void
  onEditarTransferencia: (cambios: Partial<TransferenciaMovimiento>) => void
}) {
  return (
    <Dialog open={edicion !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="edit-dialog">
        <DialogTitle>Editar movimiento</DialogTitle>
        <DialogDescription>Cambia los datos de este movimiento</DialogDescription>
        <MovementEditForm edit={edicion} personas={personas} onChange={onChange} onClose={onClose} onEditExpense={onEditarGasto} onEditTransfer={onEditarTransferencia} onSubmit={onSubmit} />
      </DialogContent>
    </Dialog>
  )
}
