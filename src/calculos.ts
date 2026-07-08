import Decimal from "decimal.js"
import { getCategoria } from "./categories.ts"
import type { FilaCalculo, Movimiento, Persona, ResumenCategoria, SaldoPersona, TransferenciaPendiente } from "./types"

type SaldoInterno = Omit<SaldoPersona, "saldo" | "totalPagadoEnGastos" | "totalDebidoEnGastos" | "totalTransferido" | "totalRecibido" | "totalSalioBolsillo"> & {
  saldo: Decimal
  totalPagadoEnGastos: Decimal
  totalDebidoEnGastos: Decimal
  totalTransferido: Decimal
  totalRecibido: Decimal
  totalSalioBolsillo: Decimal
}

const decimal = (monto: Decimal.Value) => new Decimal(monto)
const redondearMoneda = (monto: Decimal.Value) => decimal(monto).toDecimalPlaces(2).toNumber()

function parteGasto(movimiento: Extract<Movimiento, { tipo: "gasto" }>, persona: Persona) {
  if (!movimiento.participantes.includes(persona) || movimiento.participantes.length === 0) return decimal(0)
  return decimal(movimiento.monto).div(movimiento.participantes.length)
}

function aplicarMovimiento(movimiento: Movimiento, existe: (persona: Persona) => boolean, aplicar: (persona: Persona, monto: Decimal) => void) {
  if (movimiento.tipo === "gasto") {
    if (!existe(movimiento.pagador) || movimiento.participantes.length === 0) return
    aplicar(movimiento.pagador, decimal(movimiento.monto))
    for (const persona of movimiento.participantes) {
      if (existe(persona)) aplicar(persona, decimal(movimiento.monto).div(movimiento.participantes.length).neg())
    }
    return
  }

  if (!existe(movimiento.de) || !existe(movimiento.a)) return
  aplicar(movimiento.de, decimal(movimiento.monto))
  aplicar(movimiento.a, decimal(movimiento.monto).neg())
}

function textoMovimientoCalculo(movimiento: Movimiento) {
  return movimiento.descripcion?.trim() || (movimiento.tipo === "gasto" ? "Gasto" : "Pago realizado")
}

export function calcularSaldos(personas: Persona[], movimientos: Movimiento[]): SaldoPersona[] {
  const saldos = new Map<Persona, SaldoInterno>(
    personas.map((persona) => [
      persona,
      {
        persona,
        saldo: decimal(0),
        totalPagadoEnGastos: decimal(0),
        totalDebidoEnGastos: decimal(0),
        totalTransferido: decimal(0),
        totalRecibido: decimal(0),
        totalSalioBolsillo: decimal(0),
      },
    ]),
  )

  for (const movimiento of movimientos) {
    if (movimiento.tipo === "gasto") {
      const pagador = saldos.get(movimiento.pagador)
      if (!pagador || movimiento.participantes.length === 0) continue

      const monto = movimiento.monto
      pagador.totalPagadoEnGastos = pagador.totalPagadoEnGastos.plus(monto)

      for (const persona of movimiento.participantes) {
        const saldo = saldos.get(persona)
        if (!saldo) continue
        const debe = parteGasto(movimiento, persona)
        saldo.totalDebidoEnGastos = saldo.totalDebidoEnGastos.plus(debe)
      }
    } else {
      const origen = saldos.get(movimiento.de)
      const destino = saldos.get(movimiento.a)
      if (!origen || !destino) continue

      const monto = movimiento.monto
      origen.totalTransferido = origen.totalTransferido.plus(monto)
      destino.totalRecibido = destino.totalRecibido.plus(monto)
    }

    aplicarMovimiento(
      movimiento,
      (persona) => saldos.has(persona),
      (persona, monto) => {
        const saldo = saldos.get(persona)
        if (saldo) saldo.saldo = saldo.saldo.plus(monto)
      },
    )
  }

  return [...saldos.values()].map((saldo) => ({
    ...saldo,
    saldo: redondearMoneda(saldo.totalPagadoEnGastos.plus(saldo.totalTransferido).minus(saldo.totalRecibido).minus(saldo.totalDebidoEnGastos)),
    totalPagadoEnGastos: redondearMoneda(saldo.totalPagadoEnGastos),
    totalDebidoEnGastos: redondearMoneda(saldo.totalDebidoEnGastos),
    totalTransferido: redondearMoneda(saldo.totalTransferido),
    totalRecibido: redondearMoneda(saldo.totalRecibido),
    totalSalioBolsillo: redondearMoneda(saldo.totalPagadoEnGastos.plus(saldo.totalTransferido)),
  }))
}

export function calcularTransferenciasPendientes(saldos: SaldoPersona[]): TransferenciaPendiente[] {
  const acreedores = saldos
    .filter((saldo) => decimal(saldo.saldo).gt(0))
    .map((saldo) => ({ persona: saldo.persona, monto: decimal(saldo.saldo) }))
  const deudores = saldos
    .filter((saldo) => decimal(saldo.saldo).lt(0))
    .map((saldo) => ({ persona: saldo.persona, monto: decimal(saldo.saldo).abs() }))
  const transferencias: TransferenciaPendiente[] = []

  let i = 0
  let j = 0
  while (i < deudores.length && j < acreedores.length) {
    const monto = Decimal.min(deudores[i].monto, acreedores[j].monto)
    if (monto.gt(0)) transferencias.push({ de: deudores[i].persona, a: acreedores[j].persona, monto: redondearMoneda(monto) })
    deudores[i].monto = deudores[i].monto.minus(monto)
    acreedores[j].monto = acreedores[j].monto.minus(monto)
    if (deudores[i].monto.isZero()) i += 1
    if (acreedores[j].monto.isZero()) j += 1
  }

  return transferencias
}

export function getMatrizCalculos(personas: Persona[], movimientos: Movimiento[]): FilaCalculo[] {
  const saldos = new Map<Persona, Decimal>(personas.map((persona) => [persona, decimal(0)]))
  const fila = (paso: number, movimiento: string, monto: number, personaDestacada: Persona): FilaCalculo => ({
    paso,
    movimiento,
    monto,
    personaDestacada,
    saldos: Object.fromEntries(personas.map((persona) => [persona, redondearMoneda(saldos.get(persona) ?? 0)])),
  })
  const filas: FilaCalculo[] = []

  movimientos.forEach((movimiento, index) => {
    aplicarMovimiento(
      movimiento,
      (persona) => saldos.has(persona),
      (persona, monto) => saldos.set(persona, (saldos.get(persona) ?? decimal(0)).plus(monto)),
    )
    filas.push(fila(index + 1, textoMovimientoCalculo(movimiento), movimiento.monto, movimiento.tipo === "gasto" ? movimiento.pagador : movimiento.de))
  })

  return filas
}

export function getGastosPorCategoria(movimientos: Movimiento[]): ResumenCategoria[] {
  const grupos = new Map<string, { monto: Decimal; cantidadGastos: number }>()

  for (const movimiento of movimientos) {
    if (movimiento.tipo !== "gasto") continue
    const actual = grupos.get(movimiento.categoria) ?? { monto: decimal(0), cantidadGastos: 0 }
    grupos.set(movimiento.categoria, { monto: actual.monto.plus(movimiento.monto), cantidadGastos: actual.cantidadGastos + 1 })
  }

  const total = [...grupos.values()].reduce((acc, item) => acc.plus(item.monto), decimal(0))

  return [...grupos.entries()]
    .map(([categoria, item]) => {
      const meta = getCategoria(categoria as ResumenCategoria["categoria"])
      return {
        categoria: meta.key,
        label: meta.label,
        monto: redondearMoneda(item.monto),
        cantidadGastos: item.cantidadGastos,
        porcentaje: total.isZero() ? 0 : redondearMoneda(item.monto.mul(100).div(total)),
      }
    })
    .sort((a, b) => b.monto - a.monto)
}

export function getResumenPersona(persona: Persona, movimientos: Movimiento[]) {
  const personas = Array.from(new Set([persona, ...movimientos.flatMap((movimiento) => (movimiento.tipo === "gasto" ? [movimiento.pagador, ...movimiento.participantes] : [movimiento.de, movimiento.a]))]))
  const saldo = calcularSaldos(personas, movimientos).find((item) => item.persona === persona)
  const totalPuesto = saldo?.totalPagadoEnGastos ?? 0
  const totalLeTocaba = saldo?.totalDebidoEnGastos ?? 0
  const totalTransferido = saldo?.totalTransferido ?? 0
  const totalRecibido = saldo?.totalRecibido ?? 0
  const totalSalioBolsillo = saldo?.totalSalioBolsillo ?? redondearMoneda(decimal(totalPuesto).plus(totalTransferido))
  const saldoPendiente = redondearMoneda(decimal(totalSalioBolsillo).minus(totalRecibido).minus(totalLeTocaba))
  const gastosDondeParticipo = movimientos
    .filter((movimiento): movimiento is Extract<Movimiento, { tipo: "gasto" }> => movimiento.tipo === "gasto" && movimiento.participantes.includes(persona))
    .map((movimiento) => ({ movimiento, montoParte: redondearMoneda(parteGasto(movimiento, persona)) }))
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

export const formatoARS = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" })
