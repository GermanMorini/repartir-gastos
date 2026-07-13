import { applyMovementToLedger, createLedger, roundMoney } from "./ledger.ts"
import type { FilaCalculo, Movimiento, Persona } from "../../types"

function movementLabel(movimiento: Movimiento) {
  return movimiento.descripcion?.trim() || (movimiento.tipo === "gasto" ? "Gasto" : "Pago realizado")
}

export function getMatrizCalculos(personas: Persona[], movimientos: Movimiento[]): FilaCalculo[] {
  const ledger = createLedger(personas)
  return movimientos.map((movimiento, index) => {
    applyMovementToLedger(ledger, movimiento)
    return {
      paso: index + 1,
      movimiento: movementLabel(movimiento),
      monto: movimiento.monto,
      personaDestacada: movimiento.tipo === "gasto" ? movimiento.pagador : movimiento.de,
      saldos: Object.fromEntries(personas.map((persona) => [persona, roundMoney(ledger.get(persona)?.saldo ?? 0)])),
    }
  })
}
