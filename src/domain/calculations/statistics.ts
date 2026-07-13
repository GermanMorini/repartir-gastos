import { decimal, roundMoney } from "./ledger"
import type { Persona, SaldoPersona } from "../../types"

export function getGroupTotals(personas: Persona[], saldos: SaldoPersona[]) {
  const totalGastado = saldos.reduce((total, saldo) => total.plus(saldo.totalPagadoEnGastos), decimal(0))
  return {
    totalGastado: roundMoney(totalGastado),
    promedio: personas.length ? roundMoney(totalGastado.div(personas.length)) : 0,
  }
}
