import { gunzipSync, strFromU8 } from "fflate"
import { CATEGORIA_DEFAULT, CATEGORIAS_GASTO } from "../../lib/categorias.ts"
import type { AppState, CategoriaGasto, Movimiento, Persona } from "../../types/index.ts"
import type { SharePayloadV1 } from "./encodeShare.ts"

const categorias = new Set(CATEGORIAS_GASTO.map((categoria) => categoria.key))

function fromBase64Url(payload: string) {
  const base64 = payload.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(payload.length / 4) * 4, "=")
  return Uint8Array.from(atob(base64), (char) => char.charCodeAt(0))
}

function isPersona(value: unknown): value is Persona {
  return typeof value === "string" && value.trim().length > 0
}

function cleanMovimiento(value: unknown): Movimiento | null {
  if (!value || typeof value !== "object") return null
  const movimiento = value as Partial<Movimiento>
  if (typeof movimiento.monto !== "number" || !Number.isFinite(movimiento.monto) || movimiento.monto <= 0) return null
  if (movimiento.tipo === "gasto") {
    if (!isPersona(movimiento.pagador) || !Array.isArray(movimiento.participantes) || !movimiento.participantes.every(isPersona)) return null
    return {
      tipo: "gasto",
      ...(typeof movimiento.descripcion === "string" ? { descripcion: movimiento.descripcion } : {}),
      pagador: movimiento.pagador,
      monto: movimiento.monto,
      participantes: movimiento.participantes,
      categoria: categorias.has(movimiento.categoria as CategoriaGasto) ? movimiento.categoria as CategoriaGasto : CATEGORIA_DEFAULT,
    }
  }
  if (movimiento.tipo === "transferencia") {
    if (!isPersona(movimiento.de) || !isPersona(movimiento.a)) return null
    return {
      tipo: "transferencia",
      ...(typeof movimiento.descripcion === "string" ? { descripcion: movimiento.descripcion } : {}),
      de: movimiento.de,
      a: movimiento.a,
      monto: movimiento.monto,
    }
  }
  return null
}

export function decodeShareState(payload: string): AppState {
  try {
    const json = strFromU8(gunzipSync(fromBase64Url(payload)))
    const data = JSON.parse(json) as Partial<SharePayloadV1>
    if (data.v !== 1 || !Array.isArray(data.personas) || !Array.isArray(data.movimientos)) throw new Error("invalid")
    const personas = data.personas.filter(isPersona)
    const movimientos = data.movimientos.map(cleanMovimiento).filter((movimiento): movimiento is Movimiento => Boolean(movimiento))
    if (personas.length === 0) throw new Error("invalid")
    return { personas, movimientos }
  } catch {
    throw new Error("No se pudo abrir este resumen compartido.")
  }
}
