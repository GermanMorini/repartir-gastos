import { CATEGORIA_DEFAULT, CATEGORIAS_GASTO } from "../../lib/categorias.ts"
import type { AppState, CategoriaGasto, Movimiento, Persona } from "../../types"

const categories = new Set<CategoriaGasto>(CATEGORIAS_GASTO.map(({ key }) => key))

export function isPerson(value: unknown): value is Persona {
  return typeof value === "string" && value.trim().length > 0
}

export function normalizeMovement(value: unknown): Movimiento | null {
  if (!value || typeof value !== "object") return null
  const candidate = value as Record<string, unknown>
  if (typeof candidate.monto !== "number" || !Number.isFinite(candidate.monto) || candidate.monto <= 0) return null
  const description = typeof candidate.descripcion === "string" ? { descripcion: candidate.descripcion } : {}

  if (candidate.tipo === "gasto") {
    if (!isPerson(candidate.pagador) || !Array.isArray(candidate.participantes) || !candidate.participantes.every(isPerson)) return null
    const categoria = categories.has(candidate.categoria as CategoriaGasto) ? candidate.categoria as CategoriaGasto : CATEGORIA_DEFAULT
    return { tipo: "gasto", ...description, pagador: candidate.pagador, monto: candidate.monto, participantes: [...candidate.participantes], categoria }
  }
  if (candidate.tipo === "transferencia") {
    if (!isPerson(candidate.de) || !isPerson(candidate.a)) return null
    return { tipo: "transferencia", ...description, de: candidate.de, a: candidate.a, monto: candidate.monto }
  }
  return null
}

export function normalizeAppState(value: unknown): AppState {
  if (!value || typeof value !== "object") return { personas: [], movimientos: [] }
  const candidate = value as Record<string, unknown>
  const personas = Array.isArray(candidate.personas) ? candidate.personas.filter(isPerson) : []
  const movimientos = Array.isArray(candidate.movimientos)
    ? candidate.movimientos.map(normalizeMovement).filter((movimiento): movimiento is Movimiento => movimiento !== null)
    : []
  return { personas, movimientos }
}
