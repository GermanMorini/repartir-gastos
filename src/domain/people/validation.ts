import type { Persona } from "../../types"
import type { ValidationResult } from "../movements/validation"

export function validatePersonName(personas: Persona[], rawName: string): ValidationResult<Persona> {
  const persona = rawName.trim()
  if (!persona) return { ok: false, message: "El nombre no puede estar vacío." }
  if (personas.includes(persona)) return { ok: false, message: "Ya existe una persona con ese nombre." }
  return { ok: true, value: persona }
}
