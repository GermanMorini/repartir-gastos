import { getCategoriaOrden } from "../../lib/categorias.ts"
import type { Movimiento, Persona, SaldoPersona } from "../../types"

export type IndexedMovement = { movimiento: Movimiento; index: number }

export function sortMovementsForList(movimientos: Movimiento[]): IndexedMovement[] {
  return movimientos.map((movimiento, index) => ({ movimiento, index })).sort((a, b) => {
    if (a.movimiento.tipo !== b.movimiento.tipo) return Number(a.movimiento.tipo === "transferencia") - Number(b.movimiento.tipo === "transferencia")
    if (a.movimiento.tipo === "transferencia" || b.movimiento.tipo === "transferencia") return a.index - b.index
    return getCategoriaOrden(a.movimiento.categoria) - getCategoriaOrden(b.movimiento.categoria)
      || a.movimiento.monto - b.movimiento.monto
      || a.index - b.index
  })
}

export function filterDesktopMovements(items: IndexedMovement[], filters: { search: string; type: string; category: string; payer: string }, getName: (movimiento: Movimiento) => string) {
  const text = filters.search.trim().toLowerCase()
  return items
    .filter(({ movimiento }) => !text || getName(movimiento).toLowerCase().includes(text))
    .filter(({ movimiento }) => filters.type === "todos" || movimiento.tipo === filters.type)
    .filter(({ movimiento }) => filters.category === "todas" || (movimiento.tipo === "gasto" && movimiento.categoria === filters.category))
    .filter(({ movimiento }) => filters.payer === "todos" || (movimiento.tipo === "gasto" ? movimiento.pagador === filters.payer : movimiento.de === filters.payer))
    .sort((a, b) => b.movimiento.monto - a.movimiento.monto)
}

export function filterAndSortBalances(saldos: SaldoPersona[], search: string, sort: string) {
  const text = search.trim().toLowerCase()
  return saldos.filter(({ persona }) => !text || persona.toLowerCase().includes(text)).sort((a, b) => {
    if (sort === "saldo") return b.saldo - a.saldo
    if (sort === "parte") return b.totalDebidoEnGastos - a.totalDebidoEnGastos
    if (sort === "gasto") return b.totalSalioBolsillo - a.totalSalioBolsillo
    return a.persona.localeCompare(b.persona)
  })
}

export function movementPeople(movimiento: Movimiento): Persona[] {
  return movimiento.tipo === "gasto" ? [movimiento.pagador, ...movimiento.participantes] : [movimiento.de, movimiento.a]
}
