import type { AppState } from "./types"

const KEY = "repartir-cuentas:v1"
const initialState: AppState = { personas: [], movimientos: [] }

export function loadState(): AppState {
  try {
    const data = localStorage.getItem(KEY)
    return data ? { ...initialState, ...JSON.parse(data) } : initialState
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
