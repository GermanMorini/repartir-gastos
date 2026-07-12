import type { AppState, Movimiento } from "../types"

const KEY = "repartir-gastos:v1"
const initialState: AppState = { personas: [], movimientos: [] }

function limpiarAportes(aportes: unknown, personas: string[]) {
  if (!aportes || typeof aportes !== "object") return {}
  const existentes = new Set(personas)
  return Object.fromEntries(
    Object.entries(aportes as Record<string, unknown>)
      .filter(([persona, monto]) => existentes.has(persona) && typeof monto === "number" && Number.isFinite(monto) && monto >= 0),
  ) as Record<string, number>
}

function normalizarMovimiento(movimiento: Movimiento, personas: string[]): Movimiento {
  if (movimiento.tipo !== "gasto") return movimiento
  const modoPago = movimiento.modoPago === "pago_multiple" ? "pago_multiple" : "pagador_unico"
  return {
    ...movimiento,
    categoria: movimiento.categoria ?? "otros",
    ...(modoPago === "pago_multiple" ? { aportes: limpiarAportes(movimiento.aportes, personas) } : {}),
    ...(modoPago === "pago_multiple" ? { modoPago } : {}),
  }
}

export function loadState(): AppState {
  try {
    const data = localStorage.getItem(KEY)
    const state: AppState = data ? { ...initialState, ...JSON.parse(data) } : initialState
    return {
      ...state,
      movimientos: state.movimientos.map((movimiento) => normalizarMovimiento(movimiento, state.personas)),
    }
  } catch {
    return initialState
  }
}

export function saveState(state: AppState) {
  localStorage.setItem(KEY, JSON.stringify(state))
}

export function clearState() {
  localStorage.removeItem(KEY)
}
