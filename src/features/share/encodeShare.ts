import { gzipSync, strToU8 } from "fflate"
import type { AppState, Movimiento } from "../../types"

export type SharePayloadV1 = {
  v: 1
  personas: string[]
  movimientos: Movimiento[]
}

function base64Url(bytes: Uint8Array) {
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("")
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "")
}

export function encodeShareState(state: AppState) {
  const payload: SharePayloadV1 = {
    v: 1,
    personas: state.personas.map((persona) => persona.trim()).filter(Boolean),
    movimientos: state.movimientos.map((movimiento) => ({ ...movimiento })),
  }

  return base64Url(gzipSync(strToU8(JSON.stringify(payload))))
}
