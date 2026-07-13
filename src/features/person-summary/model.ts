import { calcularSaldos, calcularTransferenciasPendientes } from "../../lib/calculos"
import type { Movimiento, Persona } from "../../types"

export type DetailView = "parte" | "gasto" | "recibido" | "transferencias"
export type PendingPersonTransfer = { tipo: "pagar" | "recibir"; persona: Persona; monto: number }

export function personInitials(persona: Persona) {
  return persona.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || persona[0]?.toUpperCase() || "?"
}

export function pendingForPerson(persona: Persona, personas: Persona[], movimientos: Movimiento[]) {
  return calcularTransferenciasPendientes(calcularSaldos(personas, movimientos)).flatMap((transferencia): PendingPersonTransfer[] => {
    if (transferencia.de === persona) return [{ tipo: "pagar", persona: transferencia.a, monto: transferencia.monto }]
    if (transferencia.a === persona) return [{ tipo: "recibir", persona: transferencia.de, monto: transferencia.monto }]
    return []
  })
}
