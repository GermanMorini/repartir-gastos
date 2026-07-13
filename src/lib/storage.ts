import type { AppState } from "../types"
import { normalizeAppState } from "../domain/state/normalize"

const KEY = "repartir-gastos:v1"
const initialState: AppState = { personas: [], movimientos: [] }

export function loadState(): AppState {
  try {
    const data = localStorage.getItem(KEY)
    return data ? normalizeAppState(JSON.parse(data)) : initialState
  } catch {
    return initialState
  }
}

export function saveState(state: AppState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
    return true
  } catch (error) {
    console.error("No se pudo guardar el estado.", error)
    return false
  }
}

export function clearState() {
  localStorage.removeItem(KEY)
}
