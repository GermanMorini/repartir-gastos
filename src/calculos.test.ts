import assert from "node:assert/strict"
import { calcularSaldos, calcularTransferenciasPendientes } from "./calculos.ts"
import type { Movimiento } from "./types.ts"

const centavos = (monto: number) => Math.round(monto * 100)
const suma = (montos: number[]) => montos.reduce((total, monto) => total + centavos(monto), 0)
const saldoPorPersona = (saldos: ReturnType<typeof calcularSaldos>) => new Map(saldos.map((saldo) => [saldo.persona, centavos(saldo.saldo)]))

{
  const movimientos: Movimiento[] = [
    { tipo: "gasto", pagador: "Juan", monto: 9000, participantes: ["Juan", "Ana", "Luis"] },
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
    { tipo: "gasto", pagador: "Juan", monto: 100, participantes: ["Ana", "Juan"] },
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
}

{
  const saldos = calcularSaldos(["A", "B", "C"], [{ tipo: "gasto", pagador: "A", monto: 100, participantes: ["A", "B", "C"] }])
  const pendientes = calcularTransferenciasPendientes(saldos)

  assert.equal(suma(saldos.map((saldo) => saldo.saldo)), 0)
  assert.deepEqual(pendientes, [
    { de: "B", a: "A", monto: 33.33 },
    { de: "C", a: "A", monto: 33.33 },
  ])
}

{
  const personas = ["A", "B", "C", "D"]
  const movimientos: Movimiento[] = [
    { tipo: "gasto", pagador: "A", monto: 10.01, participantes: personas },
    { tipo: "gasto", pagador: "B", monto: 20.02, participantes: ["B", "C", "D"] },
    { tipo: "transferencia", de: "D", a: "A", monto: 3.33 },
  ]
  const saldos = calcularSaldos(personas, movimientos)
  const pendientes = calcularTransferenciasPendientes(saldos)

  assert.equal(suma(saldos.map((saldo) => saldo.saldo)), 0)
  assert.equal(suma(pendientes.map((pendiente) => pendiente.monto)), suma(saldos.filter((saldo) => saldo.saldo > 0).map((saldo) => saldo.saldo)))
}

for (let cantidad = 1; cantidad <= 5; cantidad += 1) {
  const personas = Array.from({ length: cantidad }, (_, index) => `P${index + 1}`)

  for (const pagador of personas) {
    for (let montoCentavos = 1; montoCentavos <= 100; montoCentavos += 1) {
      const saldos = calcularSaldos(personas, [{ tipo: "gasto", pagador, monto: montoCentavos / 100, participantes: personas }])
      const pendientes = calcularTransferenciasPendientes(saldos)
      const liquidados = saldoPorPersona(saldos)

      for (const pendiente of pendientes) {
        liquidados.set(pendiente.de, (liquidados.get(pendiente.de) ?? 0) + centavos(pendiente.monto))
        liquidados.set(pendiente.a, (liquidados.get(pendiente.a) ?? 0) - centavos(pendiente.monto))
      }

      assert.equal(suma(saldos.map((saldo) => saldo.saldo)), 0)
      assert.deepEqual([...liquidados.values()], personas.map(() => 0))
    }
  }
}
