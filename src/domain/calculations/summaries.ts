import { calcularSaldos } from "./balances.ts"
import { expenseShare, roundMoney } from "./ledger.ts"
import type { Movimiento, Persona } from "../../types"

export type ResumenPersona = ReturnType<typeof buildPersonSummary>

function relatedPeople(persona: Persona, movimientos: Movimiento[]) {
  return Array.from(new Set([persona, ...movimientos.flatMap((movimiento) => movimiento.tipo === "gasto"
    ? [movimiento.pagador, ...movimiento.participantes]
    : [movimiento.de, movimiento.a])]))
}

function buildPersonSummary(persona: Persona, movimientos: Movimiento[], saldo = calcularSaldos(relatedPeople(persona, movimientos), movimientos).find((item) => item.persona === persona)) {
  const totalPuesto = saldo?.totalPagadoEnGastos ?? 0
  const totalLeTocaba = saldo?.totalDebidoEnGastos ?? 0
  const totalTransferido = saldo?.totalTransferido ?? 0
  const totalRecibido = saldo?.totalRecibido ?? 0
  const totalSalioBolsillo = saldo?.totalSalioBolsillo ?? roundMoney(totalPuesto + totalTransferido)
  const saldoPendiente = saldo?.saldo ?? roundMoney(totalSalioBolsillo - totalRecibido - totalLeTocaba)
  const gastosDondeParticipo = movimientos
    .filter((movimiento): movimiento is Extract<Movimiento, { tipo: "gasto" }> => movimiento.tipo === "gasto" && movimiento.participantes.includes(persona))
    .map((movimiento) => ({ movimiento, montoParte: roundMoney(expenseShare(movimiento, persona)) }))
  const gastosQuePago = movimientos.filter((movimiento): movimiento is Extract<Movimiento, { tipo: "gasto" }> => movimiento.tipo === "gasto" && movimiento.pagador === persona)
  const transferenciasEnviadas = movimientos.filter((movimiento): movimiento is Extract<Movimiento, { tipo: "transferencia" }> => movimiento.tipo === "transferencia" && movimiento.de === persona)
  const transferenciasRecibidas = movimientos.filter((movimiento): movimiento is Extract<Movimiento, { tipo: "transferencia" }> => movimiento.tipo === "transferencia" && movimiento.a === persona)

  return {
    persona,
    totalPuesto,
    totalLeTocaba,
    totalTransferido,
    totalRecibido,
    totalSalioBolsillo,
    saldo: saldoPendiente,
    saldoPendiente,
    resultadoFinal: totalLeTocaba,
    gastosDondeParticipo,
    gastosQuePago,
    transferenciasEnviadas,
    transferenciasRecibidas,
    tieneMovimientos: gastosDondeParticipo.length + gastosQuePago.length + transferenciasEnviadas.length + transferenciasRecibidas.length > 0,
  }
}

export function getResumenPersona(persona: Persona, movimientos: Movimiento[]) {
  return buildPersonSummary(persona, movimientos)
}

export function getResumenesPersonas(personas: Persona[], movimientos: Movimiento[]) {
  const saldos = new Map(calcularSaldos(personas, movimientos).map((saldo) => [saldo.persona, saldo]))
  return new Map(personas.map((persona) => [persona, buildPersonSummary(persona, movimientos, saldos.get(persona))]))
}
