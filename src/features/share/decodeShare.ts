import { gunzipSync, strFromU8 } from "fflate"
import { normalizeAppState } from "../../domain/state/normalize.ts"
import type { AppState } from "../../types/index.ts"
import type { SharePayloadV1 } from "./encodeShare.ts"

function fromBase64Url(payload: string) {
  const base64 = payload.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(payload.length / 4) * 4, "=")
  return Uint8Array.from(atob(base64), (char) => char.charCodeAt(0))
}

export function decodeShareState(payload: string): AppState {
  try {
    const json = strFromU8(gunzipSync(fromBase64Url(payload)))
    const data = JSON.parse(json) as Partial<SharePayloadV1>
    if (data.v !== 1 || !Array.isArray(data.personas) || !Array.isArray(data.movimientos)) throw new Error("invalid")
    const state = normalizeAppState(data)
    if (state.personas.length === 0) throw new Error("invalid")
    return state
  } catch {
    throw new Error("No se pudo abrir este resumen compartido.")
  }
}
