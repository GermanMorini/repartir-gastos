import Decimal from "decimal.js"
import type { GastoFormState, Movimiento, TransferenciaFormState } from "../../types"

export type ValidationResult<T> = { ok: true; value: T } | { ok: false; message: string }

export function parsePositiveAmount(raw: string): ValidationResult<number> {
  try {
    const amount = new Decimal(raw)
    if (!amount.isFinite() || !amount.gt(0)) return { ok: false, message: "El monto debe ser positivo." }
    return { ok: true, value: amount.toNumber() }
  } catch {
    return { ok: false, message: "El monto debe ser positivo." }
  }
}

export function validateExpense(form: GastoFormState): ValidationResult<Extract<Movimiento, { tipo: "gasto" }>> {
  if (!form.pagador) return { ok: false, message: "Elegí quién pagó." }
  const amount = parsePositiveAmount(form.monto)
  if (!amount.ok) return amount
  if (form.participantes.length === 0) return { ok: false, message: "Elegí al menos un participante." }
  return { ok: true, value: {
    tipo: "gasto",
    descripcion: form.descripcion.trim(),
    pagador: form.pagador,
    monto: amount.value,
    participantes: [...form.participantes],
    categoria: form.categoria,
  } }
}

export function validateTransfer(form: TransferenciaFormState): ValidationResult<Extract<Movimiento, { tipo: "transferencia" }>> {
  if (!form.de || !form.a) return { ok: false, message: "Elegí origen y destino." }
  if (form.de === form.a) return { ok: false, message: "Origen y destino deben ser distintos." }
  const amount = parsePositiveAmount(form.monto)
  if (!amount.ok) return amount
  return { ok: true, value: {
    tipo: "transferencia",
    descripcion: form.descripcion.trim(),
    de: form.de,
    a: form.a,
    monto: amount.value,
  } }
}

export function validateMovementEdit(movimiento: Movimiento, rawAmount: string): ValidationResult<Movimiento> {
  const description = movimiento.descripcion?.trim()
  if (!description) return { ok: false, message: "El nombre no puede estar vacío." }
  const amount = parsePositiveAmount(rawAmount)
  if (!amount.ok) return amount
  if (movimiento.tipo === "gasto" && movimiento.participantes.length === 0) return { ok: false, message: "Elegí al menos un participante." }
  if (movimiento.tipo === "transferencia" && movimiento.de === movimiento.a) return { ok: false, message: "Origen y destino deben ser distintos." }
  return { ok: true, value: { ...movimiento, descripcion: description, monto: amount.value } }
}
