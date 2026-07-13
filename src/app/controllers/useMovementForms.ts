import { useState } from "react"
import { toast } from "sonner"
import { CATEGORIA_DEFAULT } from "../../lib/categorias"
import { nombreMovimiento } from "../../lib/share-text"
import type { GastoFormState, GastoMovimiento, MovementEditState, Movimiento, Persona, TransferenciaFormState, TransferenciaMovimiento } from "../../types"
import type { ValidationResult } from "../../domain/movements/validation"

type Options = {
  personas: Persona[]
  addExpense: (form: GastoFormState) => ValidationResult<GastoMovimiento>
  addTransfer: (form: TransferenciaFormState) => ValidationResult<TransferenciaMovimiento>
  updateMovement: (edit: MovementEditState) => ValidationResult<Movimiento>
}

export function useMovementForms({ personas, addExpense, addTransfer, updateMovement }: Options) {
  const [gasto, setGasto] = useState<GastoFormState>({ descripcion: "", pagador: "", monto: "", participantes: [], categoria: CATEGORIA_DEFAULT })
  const [transferencia, setTransferencia] = useState<TransferenciaFormState>({ descripcion: "", de: "", a: "", monto: "" })
  const [edicion, setEdicion] = useState<MovementEditState | null>(null)
  const [movementTab, setMovementTab] = useState<"gasto" | "transferencia">("gasto")

  const submitExpense = () => {
    const result = addExpense(gasto)
    if (!result.ok) return toast.error(result.message)
    setGasto({ descripcion: "", pagador: gasto.pagador, monto: "", participantes: personas, categoria: gasto.categoria })
  }
  const submitTransfer = () => {
    const result = addTransfer(transferencia)
    if (!result.ok) return toast.error(result.message)
    setTransferencia({ descripcion: "", de: transferencia.de, a: transferencia.a, monto: "" })
  }
  const openEdit = (index: number, movimiento: Movimiento) => setEdicion({
    index,
    monto: String(movimiento.monto),
    movimiento: movimiento.tipo === "gasto"
      ? { ...movimiento, descripcion: nombreMovimiento(movimiento), participantes: [...movimiento.participantes] }
      : { ...movimiento, descripcion: nombreMovimiento(movimiento) },
  })
  const submitEdit = () => {
    if (!edicion) return
    const result = updateMovement(edicion)
    if (!result.ok) return toast.error(result.message)
    setEdicion(null)
  }
  const editExpense = (changes: Partial<GastoMovimiento>) => {
    if (edicion?.movimiento.tipo !== "gasto") return
    setEdicion({ ...edicion, movimiento: { ...edicion.movimiento, ...changes } })
  }
  const editTransfer = (changes: Partial<TransferenciaMovimiento>) => {
    if (edicion?.movimiento.tipo !== "transferencia") return
    setEdicion({ ...edicion, movimiento: { ...edicion.movimiento, ...changes } })
  }
  const reset = () => {
    setGasto({ descripcion: "", pagador: "", monto: "", participantes: [], categoria: CATEGORIA_DEFAULT })
    setTransferencia({ descripcion: "", de: "", a: "", monto: "" })
    setEdicion(null)
  }

  return {
    gasto,
    transferencia,
    edicion,
    movementTab,
    setGasto,
    setTransferencia,
    setEdicion,
    setMovementTab,
    submitExpense,
    submitTransfer,
    openEdit,
    submitEdit,
    editExpense,
    editTransfer,
    reset,
  }
}
