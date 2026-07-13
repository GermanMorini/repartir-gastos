import Decimal from "decimal.js"
import { decimal, roundMoney } from "./ledger.ts"
import type { SaldoPersona, TransferenciaPendiente } from "../../types"

export function calcularTransferenciasPendientes(saldos: SaldoPersona[]): TransferenciaPendiente[] {
  const acreedores = saldos.filter(({ saldo }) => decimal(saldo).gt(0)).map(({ persona, saldo }) => ({ persona, monto: decimal(saldo) }))
  const deudores = saldos.filter(({ saldo }) => decimal(saldo).lt(0)).map(({ persona, saldo }) => ({ persona, monto: decimal(saldo).abs() }))
  const transferencias: TransferenciaPendiente[] = []

  let deudor = 0
  let acreedor = 0
  while (deudor < deudores.length && acreedor < acreedores.length) {
    const monto = Decimal.min(deudores[deudor].monto, acreedores[acreedor].monto)
    if (monto.gt(0)) transferencias.push({ de: deudores[deudor].persona, a: acreedores[acreedor].persona, monto: roundMoney(monto) })
    deudores[deudor].monto = deudores[deudor].monto.minus(monto)
    acreedores[acreedor].monto = acreedores[acreedor].monto.minus(monto)
    if (deudores[deudor].monto.isZero()) deudor += 1
    if (acreedores[acreedor].monto.isZero()) acreedor += 1
  }
  return transferencias
}
