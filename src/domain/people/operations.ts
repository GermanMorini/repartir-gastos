import type { AppState, Persona } from "../../types"

/** Conserva regla actual: elimina movimientos pagados o transferidos por persona. */
export function removePerson(state: AppState, persona: Persona): AppState {
  return {
    personas: state.personas.filter((item) => item !== persona),
    movimientos: state.movimientos
      .filter((movimiento) => movimiento.tipo === "gasto" ? movimiento.pagador !== persona : movimiento.de !== persona && movimiento.a !== persona)
      .map((movimiento) => movimiento.tipo === "gasto" ? { ...movimiento, participantes: movimiento.participantes.filter((item) => item !== persona) } : movimiento)
      .filter((movimiento) => movimiento.tipo === "transferencia" || movimiento.participantes.length > 0),
  }
}
