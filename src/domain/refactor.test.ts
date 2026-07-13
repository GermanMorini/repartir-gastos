import assert from "node:assert/strict"
import test from "node:test"
import { getResumenPersona, getResumenesPersonas } from "../lib/calculos.ts"
import { appendMovement, removeMovement, replaceMovement } from "./movements/operations.ts"
import { sortMovementsForList } from "./movements/selectors.ts"
import { validateExpense, validateMovementEdit, validateTransfer } from "./movements/validation.ts"
import { removePerson } from "./people/operations.ts"
import { validatePersonName } from "./people/validation.ts"
import { normalizeAppState } from "./state/normalize.ts"
import type { AppState, Movimiento } from "../types/index.ts"
import { textoReparto, textoResumenPersona } from "../lib/share-text.ts"

const gasto: Movimiento = { tipo: "gasto", descripcion: "Cena", pagador: "Ana", monto: 100, participantes: ["Ana", "Luis"], categoria: "comida" }
const transferencia: Movimiento = { tipo: "transferencia", descripcion: "Pago", de: "Luis", a: "Ana", monto: 50 }

test("normaliza estado legacy y descarta movimientos inválidos", () => {
  assert.deepEqual(normalizeAppState({ personas: ["Ana", ""], movimientos: [
    { tipo: "gasto", pagador: "Ana", monto: 10, participantes: ["Ana"] },
    { tipo: "transferencia", de: "Ana", a: "Luis", monto: -1 },
  ] }), {
    personas: ["Ana"],
    movimientos: [{ tipo: "gasto", pagador: "Ana", monto: 10, participantes: ["Ana"], categoria: "otros" }],
  })
})

test("valida formularios sin alterar mensajes existentes", () => {
  assert.deepEqual(validatePersonName([], " "), { ok: false, message: "El nombre no puede estar vacío." })
  assert.deepEqual(validateExpense({ descripcion: "", pagador: "", monto: "10", participantes: [], categoria: "otros" }), { ok: false, message: "Elegí quién pagó." })
  assert.deepEqual(validateTransfer({ descripcion: "", de: "Ana", a: "Ana", monto: "10" }), { ok: false, message: "Origen y destino deben ser distintos." })
  assert.deepEqual(validateMovementEdit({ ...gasto, descripcion: "" }, "100"), { ok: false, message: "El nombre no puede estar vacío." })
})

test("operaciones preservan estado inmutable", () => {
  const state: AppState = { personas: ["Ana", "Luis"], movimientos: [gasto] }
  const withTransfer = appendMovement(state, transferencia)
  assert.equal(state.movimientos.length, 1)
  assert.equal(withTransfer.movimientos.length, 2)
  assert.deepEqual(replaceMovement(withTransfer, 1, { ...transferencia, monto: 25 }).movimientos[1], { ...transferencia, monto: 25 })
  assert.deepEqual(removeMovement(withTransfer, 0).movimientos, [transferencia])
})

test("eliminar persona conserva semántica existente", () => {
  const state: AppState = {
    personas: ["Ana", "Luis", "Marta"],
    movimientos: [
      gasto,
      { tipo: "gasto", pagador: "Marta", monto: 30, participantes: ["Luis", "Marta"], categoria: "otros" },
      transferencia,
    ],
  }
  assert.deepEqual(removePerson(state, "Luis"), {
    personas: ["Ana", "Marta"],
    movimientos: [
      { ...gasto, participantes: ["Ana"] },
      { tipo: "gasto", pagador: "Marta", monto: 30, participantes: ["Marta"], categoria: "otros" },
    ],
  })
})

test("resumen agregado coincide con función compatible", () => {
  const movimientos = [gasto, transferencia]
  const resumenes = getResumenesPersonas(["Ana", "Luis"], movimientos)
  assert.deepEqual(resumenes.get("Ana"), getResumenPersona("Ana", movimientos))
  assert.deepEqual(resumenes.get("Luis"), getResumenPersona("Luis", movimientos))
})

test("orden de movimientos conserva categorías, montos y transferencias al final", () => {
  const movimientos: Movimiento[] = [
    transferencia,
    { ...gasto, descripcion: "Mayor", monto: 200 },
    { ...gasto, descripcion: "Menor", monto: 50 },
  ]
  assert.deepEqual(sortMovementsForList(movimientos).map(({ movimiento }) => movimiento.descripcion), ["Menor", "Mayor", "Pago"])
})

test("textos compartidos incluyen liquidación pendiente", () => {
  const resumen = getResumenPersona("Luis", [gasto])
  const pendientes = [{ de: "Luis", a: "Ana", monto: 50 }]
  assert.match(textoResumenPersona(resumen, pendientes), /Debe transferir a Ana:.*50/)
  assert.match(textoReparto(pendientes), /Luis transfiere.*a Ana/)
})
