import type { Movimiento, Persona, SaldoPersona, TransferenciaPendiente } from "./types"

const aCentavos = (monto: number) => Math.round((monto + Number.EPSILON) * 100)
const aPesos = (centavos: number) => centavos / 100

export function calcularSaldos(personas: Persona[], movimientos: Movimiento[]): SaldoPersona[] {
  const saldos = new Map<Persona, SaldoPersona>(
    personas.map((persona) => [
      persona,
      {
        persona,
        saldo: 0,
        totalPagadoEnGastos: 0,
        totalDebidoEnGastos: 0,
        totalTransferido: 0,
        totalRecibido: 0,
      },
    ]),
  )

  for (const movimiento of movimientos) {
    if (movimiento.tipo === "gasto") {
      const pagador = saldos.get(movimiento.pagador)
      if (!pagador || movimiento.participantes.length === 0) continue

      const monto = aCentavos(movimiento.monto)
      pagador.saldo += monto
      pagador.totalPagadoEnGastos += monto

      const parte = Math.floor(monto / movimiento.participantes.length)
      const resto = monto % movimiento.participantes.length
      for (const [index, persona] of movimiento.participantes.entries()) {
        const saldo = saldos.get(persona)
        if (!saldo) continue
        const debe = parte + (index < resto ? 1 : 0)
        saldo.saldo -= debe
        saldo.totalDebidoEnGastos += debe
      }
    } else {
      const origen = saldos.get(movimiento.de)
      const destino = saldos.get(movimiento.a)
      if (!origen || !destino) continue

      const monto = aCentavos(movimiento.monto)
      origen.saldo += monto
      origen.totalTransferido += monto
      destino.saldo -= monto
      destino.totalRecibido += monto
    }
  }

  return [...saldos.values()].map((saldo) => ({
    ...saldo,
    saldo: aPesos(saldo.saldo),
    totalPagadoEnGastos: aPesos(saldo.totalPagadoEnGastos),
    totalDebidoEnGastos: aPesos(saldo.totalDebidoEnGastos),
    totalTransferido: aPesos(saldo.totalTransferido),
    totalRecibido: aPesos(saldo.totalRecibido),
  }))
}

export function calcularTransferenciasPendientes(saldos: SaldoPersona[]): TransferenciaPendiente[] {
  const acreedores = saldos
    .filter((saldo) => saldo.saldo > 0)
    .map((saldo) => ({ persona: saldo.persona, monto: aCentavos(saldo.saldo) }))
  const deudores = saldos
    .filter((saldo) => saldo.saldo < 0)
    .map((saldo) => ({ persona: saldo.persona, monto: Math.abs(aCentavos(saldo.saldo)) }))
  const transferencias: TransferenciaPendiente[] = []

  let i = 0
  let j = 0
  while (i < deudores.length && j < acreedores.length) {
    const monto = Math.min(deudores[i].monto, acreedores[j].monto)
    if (monto > 0) transferencias.push({ de: deudores[i].persona, a: acreedores[j].persona, monto: aPesos(monto) })
    deudores[i].monto -= monto
    acreedores[j].monto -= monto
    if (deudores[i].monto === 0) i += 1
    if (acreedores[j].monto === 0) j += 1
  }

  return transferencias
}

export const formatoARS = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" })
