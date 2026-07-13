import { buildLedger, roundMoney } from "./ledger.ts"
import type { Movimiento, Persona, SaldoPersona } from "../../types"

export function calcularSaldos(personas: Persona[], movimientos: Movimiento[]): SaldoPersona[] {
  return [...buildLedger(personas, movimientos).values()].map((entry) => ({
    persona: entry.persona,
    saldo: roundMoney(entry.saldo),
    totalPagadoEnGastos: roundMoney(entry.totalPagadoEnGastos),
    totalDebidoEnGastos: roundMoney(entry.totalDebidoEnGastos),
    totalTransferido: roundMoney(entry.totalTransferido),
    totalRecibido: roundMoney(entry.totalRecibido),
    totalSalioBolsillo: roundMoney(entry.totalPagadoEnGastos.plus(entry.totalTransferido)),
  }))
}
