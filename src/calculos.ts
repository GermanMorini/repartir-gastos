import type { FilaCalculo, Movimiento, Persona, SaldoPersona, TransferenciaPendiente } from "./types"

const aCentavos = (monto: number) => Math.sign(monto) * Math.round((Math.abs(monto) + Number.EPSILON) * 100)
const aPesos = (centavos: number) => centavos / 100
const redondearMoneda = (monto: number) => aPesos(aCentavos(monto))

function parteGasto(movimiento: Extract<Movimiento, { tipo: "gasto" }>, persona: Persona) {
  if (!movimiento.participantes.includes(persona) || movimiento.participantes.length === 0) return 0
  return movimiento.monto / movimiento.participantes.length
}

function aplicarMovimiento(movimiento: Movimiento, existe: (persona: Persona) => boolean, aplicar: (persona: Persona, monto: number) => void) {
  if (movimiento.tipo === "gasto") {
    if (!existe(movimiento.pagador) || movimiento.participantes.length === 0) return
    aplicar(movimiento.pagador, movimiento.monto)
    for (const persona of movimiento.participantes) {
      if (existe(persona)) aplicar(persona, -movimiento.monto / movimiento.participantes.length)
    }
    return
  }

  if (!existe(movimiento.de) || !existe(movimiento.a)) return
  aplicar(movimiento.de, movimiento.monto)
  aplicar(movimiento.a, -movimiento.monto)
}

function textoMovimientoCalculo(movimiento: Movimiento) {
  return movimiento.descripcion?.trim() || (movimiento.tipo === "gasto" ? "Gasto" : "Pago realizado")
}

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
        totalSalioBolsillo: 0,
      },
    ]),
  )

  for (const movimiento of movimientos) {
    if (movimiento.tipo === "gasto") {
      const pagador = saldos.get(movimiento.pagador)
      if (!pagador || movimiento.participantes.length === 0) continue

      const monto = movimiento.monto
      pagador.totalPagadoEnGastos += monto

      for (const persona of movimiento.participantes) {
        const saldo = saldos.get(persona)
        if (!saldo) continue
        const debe = parteGasto(movimiento, persona)
        saldo.totalDebidoEnGastos += debe
      }
    } else {
      const origen = saldos.get(movimiento.de)
      const destino = saldos.get(movimiento.a)
      if (!origen || !destino) continue

      const monto = movimiento.monto
      origen.totalTransferido += monto
      destino.totalRecibido += monto
    }

    aplicarMovimiento(
      movimiento,
      (persona) => saldos.has(persona),
      (persona, monto) => {
        const saldo = saldos.get(persona)
        if (saldo) saldo.saldo += monto
      },
    )
  }

  return [...saldos.values()].map((saldo) => ({
    ...saldo,
    saldo: redondearMoneda(saldo.totalPagadoEnGastos + saldo.totalTransferido - saldo.totalRecibido - saldo.totalDebidoEnGastos),
    totalPagadoEnGastos: redondearMoneda(saldo.totalPagadoEnGastos),
    totalDebidoEnGastos: redondearMoneda(saldo.totalDebidoEnGastos),
    totalTransferido: redondearMoneda(saldo.totalTransferido),
    totalRecibido: redondearMoneda(saldo.totalRecibido),
    totalSalioBolsillo: redondearMoneda(saldo.totalPagadoEnGastos + saldo.totalTransferido),
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

export function getMatrizCalculos(personas: Persona[], movimientos: Movimiento[]): FilaCalculo[] {
  const saldos = new Map<Persona, number>(personas.map((persona) => [persona, 0]))
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
      (persona, monto) => saldos.set(persona, (saldos.get(persona) ?? 0) + monto),
    )
    filas.push(fila(index + 1, textoMovimientoCalculo(movimiento), movimiento.monto, movimiento.tipo === "gasto" ? movimiento.pagador : movimiento.a))
  })

  return filas
}

export function getResumenPersona(persona: Persona, movimientos: Movimiento[]) {
  const personas = Array.from(new Set([persona, ...movimientos.flatMap((movimiento) => (movimiento.tipo === "gasto" ? [movimiento.pagador, ...movimiento.participantes] : [movimiento.de, movimiento.a]))]))
  const saldo = calcularSaldos(personas, movimientos).find((item) => item.persona === persona)
  const totalPuesto = saldo?.totalPagadoEnGastos ?? 0
  const totalLeTocaba = saldo?.totalDebidoEnGastos ?? 0
  const totalTransferido = saldo?.totalTransferido ?? 0
  const totalRecibido = saldo?.totalRecibido ?? 0
  const totalSalioBolsillo = saldo?.totalSalioBolsillo ?? redondearMoneda(totalPuesto + totalTransferido)
  const saldoPendiente = redondearMoneda(totalSalioBolsillo - totalRecibido - totalLeTocaba)
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
