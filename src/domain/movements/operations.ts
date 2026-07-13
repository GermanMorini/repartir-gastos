import type { AppState, Movimiento } from "../../types"

export function appendMovement(state: AppState, movimiento: Movimiento): AppState {
  return { ...state, movimientos: [...state.movimientos, movimiento] }
}

export function replaceMovement(state: AppState, index: number, movimiento: Movimiento): AppState {
  return { ...state, movimientos: state.movimientos.map((current, currentIndex) => currentIndex === index ? movimiento : current) }
}

export function removeMovement(state: AppState, index: number): AppState {
  return { ...state, movimientos: state.movimientos.filter((_, currentIndex) => currentIndex !== index) }
}
