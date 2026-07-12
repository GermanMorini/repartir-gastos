import assert from "node:assert/strict"
import { gzipSync, strToU8 } from "fflate"
import { calcularSaldos, calcularTransferenciasPendientes, getGastosPorCategoria, getMatrizCalculos, getResumenPersona } from "./lib/calculos.ts"
import { decodeShareState } from "./features/share/decodeShare.ts"
import { encodeShareState } from "./features/share/encodeShare.ts"
import type { AppState, Movimiento } from "./types/index.ts"

const centavos = (monto: number) => Math.round(monto * 100)
const suma = (montos: number[]) => montos.reduce((total, monto) => total + centavos(monto), 0)
const saldoPorPersona = (saldos: ReturnType<typeof calcularSaldos>) => new Map(saldos.map((saldo) => [saldo.persona, centavos(saldo.saldo)]))
const assertCasiCero = (monto: number, tolerancia = 1) => assert.ok(Math.abs(monto) <= tolerancia)
const payloadShare = (data: unknown) => btoa(Array.from(gzipSync(strToU8(JSON.stringify(data))), (byte) => String.fromCharCode(byte)).join("")).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "")

{
  const state: AppState = {
    personas: ["Ana", "Luis"],
    movimientos: [
      { tipo: "gasto", descripcion: "Cena", pagador: "Ana", monto: 100, categoria: "comida", participantes: ["Ana", "Luis"] },
      { tipo: "transferencia", de: "Luis", a: "Ana", monto: 50 },
    ],
  }
  assert.deepEqual(decodeShareState(encodeShareState(state)), state)
  assert.throws(() => decodeShareState("payload-invalido"), /No se pudo abrir/)
}

{
  const legacy = { personas: ["Ana"], movimientos: [{ tipo: "gasto", pagador: "Ana", monto: 10, participantes: ["Ana"] }] } as unknown as AppState
  assert.equal(decodeShareState(encodeShareState(legacy)).movimientos[0]?.tipo, "gasto")
  assert.equal((decodeShareState(encodeShareState(legacy)).movimientos[0] as Extract<Movimiento, { tipo: "gasto" }>).categoria, "otros")
  assert.throws(() => decodeShareState(payloadShare({ v: 2, personas: ["Ana"], movimientos: [] })), /No se pudo abrir/)
}

{
  assert.deepEqual(getGastosPorCategoria([
    { tipo: "gasto", pagador: "Ana", monto: 100, categoria: "comida", participantes: ["Ana"] },
    { tipo: "gasto", pagador: "Luis", monto: 50, categoria: "transporte", participantes: ["Luis"] },
    { tipo: "gasto", pagador: "Ana", monto: 50, categoria: "comida", participantes: ["Ana", "Luis"] },
    { tipo: "transferencia", de: "Luis", a: "Ana", monto: 200 },
  ]), [
    { categoria: "comida", label: "Comida", monto: 150, cantidadGastos: 2, porcentaje: 75 },
    { categoria: "transporte", label: "Transporte", monto: 50, cantidadGastos: 1, porcentaje: 25 },
  ])
}

{
  const movimientos: Movimiento[] = [
    { tipo: "gasto", pagador: "Juan", monto: 9000, categoria: "comida", participantes: ["Juan", "Ana", "Luis"] },
    { tipo: "transferencia", de: "Ana", a: "Juan", monto: 1000 },
  ]

  const saldos = calcularSaldos(["Juan", "Ana", "Luis"], movimientos)

  assert.deepEqual(
    saldos.map(({ persona, saldo }) => ({ persona, saldo })),
    [
      { persona: "Juan", saldo: 5000 },
      { persona: "Ana", saldo: -2000 },
      { persona: "Luis", saldo: -3000 },
    ],
  )
  assert.deepEqual(calcularTransferenciasPendientes(saldos), [
    { de: "Ana", a: "Juan", monto: 2000 },
    { de: "Luis", a: "Juan", monto: 3000 },
  ])
}

{
  const saldos = calcularSaldos(["Ana", "Juan"], [
    { tipo: "gasto", pagador: "Juan", monto: 100, categoria: "comida", participantes: ["Ana", "Juan"] },
    { tipo: "transferencia", de: "Ana", a: "Juan", monto: 50 },
  ])

  assert.deepEqual(
    saldos.map(({ persona, saldo }) => ({ persona, saldo })),
    [
      { persona: "Ana", saldo: 0 },
      { persona: "Juan", saldo: 0 },
    ],
  )
  assert.deepEqual(calcularTransferenciasPendientes(saldos), [])
  for (const saldo of saldos) {
    assert.equal(centavos(saldo.totalSalioBolsillo - saldo.totalRecibido), centavos(saldo.totalDebidoEnGastos))
  }
}

{
  const saldos = calcularSaldos(["A", "B", "C"], [{ tipo: "gasto", pagador: "A", monto: 100, categoria: "comida", participantes: ["A", "B", "C"] }])
  const pendientes = calcularTransferenciasPendientes(saldos)

  assertCasiCero(suma(saldos.map((saldo) => saldo.saldo)))
  assert.deepEqual(pendientes, [
    { de: "B", a: "A", monto: 33.33 },
    { de: "C", a: "A", monto: 33.33 },
  ])
}

{
  const personas = ["A", "B", "C", "D"]
  const movimientos: Movimiento[] = [
    { tipo: "gasto", pagador: "A", monto: 10.01, categoria: "comida", participantes: personas },
    { tipo: "gasto", pagador: "B", monto: 20.02, categoria: "comida", participantes: ["B", "C", "D"] },
    { tipo: "transferencia", de: "D", a: "A", monto: 3.33 },
  ]
  const saldos = calcularSaldos(personas, movimientos)
  const pendientes = calcularTransferenciasPendientes(saldos)

  assertCasiCero(suma(saldos.map((saldo) => saldo.saldo)), personas.length)
  assert.equal(suma(pendientes.map((pendiente) => pendiente.monto)), suma(saldos.filter((saldo) => saldo.saldo > 0).map((saldo) => saldo.saldo)))
}

{
  const movimientos: Movimiento[] = [
    { tipo: "gasto", pagador: "Ana", monto: 12000, categoria: "comida", participantes: ["Ana", "Luis"] },
    { tipo: "gasto", pagador: "Luis", monto: 8000, categoria: "comida", participantes: ["Ana", "Luis"] },
    { tipo: "transferencia", de: "Ana", a: "Luis", monto: 3000 },
    { tipo: "transferencia", de: "Luis", a: "Ana", monto: 2000 },
  ]
  const resumen = getResumenPersona("Ana", movimientos)

  assert.equal(resumen.totalPuesto, 12000)
  assert.equal(resumen.totalLeTocaba, 10000)
  assert.equal(resumen.totalTransferido, 3000)
  assert.equal(resumen.totalRecibido, 2000)
  assert.equal(resumen.totalSalioBolsillo, 15000)
  assert.equal(resumen.saldo, 3000)
  assert.equal(resumen.saldoPendiente, 3000)
  assert.equal(resumen.resultadoFinal, 10000)
  assert.equal(resumen.gastosDondeParticipo.length, 2)
  assert.equal(resumen.gastosQuePago.length, 1)
}

{
  const resumen = getResumenPersona("Ana", [])

  assert.equal(resumen.totalPuesto, 0)
  assert.equal(resumen.totalLeTocaba, 0)
  assert.equal(resumen.totalTransferido, 0)
  assert.equal(resumen.totalRecibido, 0)
  assert.equal(resumen.totalSalioBolsillo, 0)
  assert.equal(resumen.saldo, 0)
  assert.equal(resumen.tieneMovimientos, false)
}

{
  const resumen = getResumenPersona("A", [{ tipo: "gasto", pagador: "A", monto: 100, categoria: "comida", participantes: ["A", "B", "C"] }])

  assert.equal(resumen.totalPuesto, 100)
  assert.equal(resumen.totalLeTocaba, 33.33)
  assert.equal(resumen.saldo, 66.67)
}

{
  const personas = ["german", "carlos", "flecha"]
  const movimientos: Movimiento[] = [
    { tipo: "gasto", descripcion: "cena fruta + super", pagador: "german", monto: 40800, categoria: "comida", participantes: ["german", "carlos"] },
    { tipo: "gasto", descripcion: "ubers", pagador: "german", monto: 6200, categoria: "comida", participantes: ["german", "carlos", "flecha"] },
    { tipo: "gasto", descripcion: "cena", pagador: "carlos", monto: 98000, categoria: "comida", participantes: ["german", "carlos", "flecha"] },
    { tipo: "gasto", descripcion: "entradas chilli", pagador: "flecha", monto: 66000, categoria: "comida", participantes: ["german", "carlos", "flecha"] },
    { tipo: "transferencia", descripcion: "transferencia en la cena", de: "flecha", a: "carlos", monto: 40000 },
  ]
  const saldos = calcularSaldos(personas, movimientos)
  const matriz = getMatrizCalculos(personas, movimientos)

  assert.deepEqual(
    saldos.map(({ persona, saldo }) => ({ persona, saldo })),
    [
      { persona: "german", saldo: -30133.33 },
      { persona: "carlos", saldo: -19133.33 },
      { persona: "flecha", saldo: 49266.67 },
    ],
  )
  const pendientes = calcularTransferenciasPendientes(saldos)
  assert.deepEqual(pendientes, [
    { de: "german", a: "flecha", monto: 30133.33 },
    { de: "carlos", a: "flecha", monto: 19133.33 },
  ])
  assert.deepEqual(
    personas.map((persona) => {
      const resumen = getResumenPersona(persona, movimientos)
      return {
        persona,
        totalPuesto: resumen.totalPuesto,
        totalLeTocaba: resumen.totalLeTocaba,
        totalTransferido: resumen.totalTransferido,
        totalRecibido: resumen.totalRecibido,
        totalSalioBolsillo: resumen.totalSalioBolsillo,
        saldo: resumen.saldo,
      }
    }),
    [
      { persona: "german", totalPuesto: 47000, totalLeTocaba: 77133.33, totalTransferido: 0, totalRecibido: 0, totalSalioBolsillo: 47000, saldo: -30133.33 },
      { persona: "carlos", totalPuesto: 98000, totalLeTocaba: 77133.33, totalTransferido: 0, totalRecibido: 40000, totalSalioBolsillo: 98000, saldo: -19133.33 },
      { persona: "flecha", totalPuesto: 66000, totalLeTocaba: 56733.33, totalTransferido: 40000, totalRecibido: 0, totalSalioBolsillo: 106000, saldo: 49266.67 },
    ],
  )
  assert.equal(matriz.length, movimientos.length)
  assert.deepEqual(matriz.map((fila) => fila.personaDestacada), ["german", "german", "carlos", "flecha", "flecha"])
  assert.deepEqual(matriz.map((fila) => fila.saldos), [
    { german: 20400, carlos: -20400, flecha: 0 },
    { german: 24533.33, carlos: -22466.67, flecha: -2066.67 },
    { german: -8133.33, carlos: 42866.67, flecha: -34733.33 },
    { german: -30133.33, carlos: 20866.67, flecha: 9266.67 },
    { german: -30133.33, carlos: -19133.33, flecha: 49266.67 },
  ])
  assert.deepEqual(matriz.at(-1)?.saldos, Object.fromEntries(saldos.map(({ persona, saldo }) => [persona, saldo])))
  for (const saldo of saldos) {
    const pagaPendiente = suma(pendientes.filter((pendiente) => pendiente.de === saldo.persona).map((pendiente) => pendiente.monto))
    const recibePendiente = suma(pendientes.filter((pendiente) => pendiente.a === saldo.persona).map((pendiente) => pendiente.monto))
    const finalPagado = centavos(saldo.totalSalioBolsillo) + pagaPendiente - centavos(saldo.totalRecibido) - recibePendiente
    assertCasiCero(finalPagado - centavos(saldo.totalDebidoEnGastos))
  }
}

for (let cantidad = 1; cantidad <= 5; cantidad += 1) {
  const personas = Array.from({ length: cantidad }, (_, index) => `P${index + 1}`)

  for (const pagador of personas) {
    for (let montoCentavos = 1; montoCentavos <= 100; montoCentavos += 1) {
      const saldos = calcularSaldos(personas, [{ tipo: "gasto", pagador, monto: montoCentavos / 100, categoria: "comida", participantes: personas }])
      const pendientes = calcularTransferenciasPendientes(saldos)
      const liquidados = saldoPorPersona(saldos)

      for (const pendiente of pendientes) {
        liquidados.set(pendiente.de, (liquidados.get(pendiente.de) ?? 0) + centavos(pendiente.monto))
        liquidados.set(pendiente.a, (liquidados.get(pendiente.a) ?? 0) - centavos(pendiente.monto))
      }

      assertCasiCero(suma(saldos.map((saldo) => saldo.saldo)), personas.length)
      for (const saldo of liquidados.values()) assertCasiCero(saldo, personas.length)
    }
  }
}
