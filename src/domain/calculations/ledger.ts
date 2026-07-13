import Decimal from "decimal.js"
import type { Movimiento, Persona } from "../../types"

export type LedgerEntry = {
  persona: Persona
  saldo: Decimal
  totalPagadoEnGastos: Decimal
  totalDebidoEnGastos: Decimal
  totalTransferido: Decimal
  totalRecibido: Decimal
}

export const decimal = (value: Decimal.Value) => new Decimal(value)
export const roundMoney = (value: Decimal.Value) => decimal(value).toDecimalPlaces(2).toNumber()

export function expenseShare(movimiento: Extract<Movimiento, { tipo: "gasto" }>, persona: Persona) {
  if (movimiento.participantes.length === 0 || !movimiento.participantes.includes(persona)) return decimal(0)
  return decimal(movimiento.monto).div(movimiento.participantes.length)
}

export function createLedger(personas: Persona[]) {
  return new Map<Persona, LedgerEntry>(personas.map((persona) => [persona, {
    persona,
    saldo: decimal(0),
    totalPagadoEnGastos: decimal(0),
    totalDebidoEnGastos: decimal(0),
    totalTransferido: decimal(0),
    totalRecibido: decimal(0),
  }]))
}

/** Aplica una sola regla monetaria a saldos y subtotales explicativos. */
export function applyMovementToLedger(ledger: Map<Persona, LedgerEntry>, movimiento: Movimiento) {
  if (movimiento.tipo === "gasto") {
    const pagador = ledger.get(movimiento.pagador)
    if (!pagador || movimiento.participantes.length === 0) return

    const monto = decimal(movimiento.monto)
    pagador.totalPagadoEnGastos = pagador.totalPagadoEnGastos.plus(monto)
    pagador.saldo = pagador.saldo.plus(monto)

    for (const persona of movimiento.participantes) {
      const participante = ledger.get(persona)
      if (!participante) continue
      const parte = monto.div(movimiento.participantes.length)
      participante.totalDebidoEnGastos = participante.totalDebidoEnGastos.plus(parte)
      participante.saldo = participante.saldo.minus(parte)
    }
    return
  }

  const origen = ledger.get(movimiento.de)
  const destino = ledger.get(movimiento.a)
  if (!origen || !destino) return

  const monto = decimal(movimiento.monto)
  origen.totalTransferido = origen.totalTransferido.plus(monto)
  origen.saldo = origen.saldo.plus(monto)
  destino.totalRecibido = destino.totalRecibido.plus(monto)
  destino.saldo = destino.saldo.minus(monto)
}

export function buildLedger(personas: Persona[], movimientos: Movimiento[]) {
  const ledger = createLedger(personas)
  for (const movimiento of movimientos) applyMovementToLedger(ledger, movimiento)
  return ledger
}
