import { useCallback, useEffect, useMemo, useState } from "react"
import { calcularSaldos, calcularTransferenciasPendientes, getGastosPorCategoria, getMatrizCalculos } from "../../lib/calculos"
import { clearState, loadState, saveState } from "../../lib/storage"
import { appendMovement, removeMovement, replaceMovement } from "../../domain/movements/operations"
import { sortMovementsForList } from "../../domain/movements/selectors"
import { validateExpense, validateMovementEdit, validateTransfer } from "../../domain/movements/validation"
import { removePerson } from "../../domain/people/operations"
import { validatePersonName } from "../../domain/people/validation"
import { getGroupTotals } from "../../domain/calculations/statistics"
import type { AppState, GastoFormState, MovementEditState, Movimiento, Persona, TransferenciaFormState } from "../../types"

export function useAppState() {
  const [state, setState] = useState<AppState>(loadState)

  useEffect(() => { saveState(state) }, [state])

  const setPersonas = useCallback((next: Persona[] | ((current: Persona[]) => Persona[])) => {
    setState((current) => ({ ...current, personas: typeof next === "function" ? next(current.personas) : next }))
  }, [])
  const setMovimientos = useCallback((next: Movimiento[] | ((current: Movimiento[]) => Movimiento[])) => {
    setState((current) => ({ ...current, movimientos: typeof next === "function" ? next(current.movimientos) : next }))
  }, [])
  const replaceState = useCallback((next: AppState) => setState(next), [])

  const movimientosCard = useMemo(() => sortMovementsForList(state.movimientos), [state.movimientos])
  const saldos = useMemo(() => calcularSaldos(state.personas, state.movimientos), [state.movimientos, state.personas])
  const pendientes = useMemo(() => calcularTransferenciasPendientes(saldos), [saldos])
  const matrizCalculos = useMemo(() => getMatrizCalculos(state.personas, movimientosCard.map(({ movimiento }) => movimiento)), [movimientosCard, state.personas])
  const gastosPorCategoria = useMemo(() => getGastosPorCategoria(state.movimientos), [state.movimientos])
  const totals = useMemo(() => getGroupTotals(state.personas, saldos), [saldos, state.personas])

  const addPerson = useCallback((rawName: string) => {
    const result = validatePersonName(state.personas, rawName)
    if (result.ok) setState((current) => ({ ...current, personas: [...current.personas, result.value] }))
    return result
  }, [state.personas])
  const deletePerson = useCallback((persona: Persona) => setState((current) => removePerson(current, persona)), [])
  const addExpense = useCallback((form: GastoFormState) => {
    const result = validateExpense(form)
    if (result.ok) setState((current) => appendMovement(current, result.value))
    return result
  }, [])
  const addTransfer = useCallback((form: TransferenciaFormState) => {
    const result = validateTransfer(form)
    if (result.ok) setState((current) => appendMovement(current, result.value))
    return result
  }, [])
  const updateMovement = useCallback((edit: MovementEditState) => {
    const result = validateMovementEdit(edit.movimiento, edit.monto)
    if (result.ok) setState((current) => replaceMovement(current, edit.index, result.value))
    return result
  }, [])
  const deleteMovement = useCallback((index: number) => setState((current) => removeMovement(current, index)), [])
  const clearAll = useCallback(() => {
    clearState()
    setState({ personas: [], movimientos: [] })
  }, [])

  return {
    ...state,
    ...totals,
    movimientosCard,
    saldos,
    pendientes,
    matrizCalculos,
    gastosPorCategoria,
    setPersonas,
    setMovimientos,
    replaceState,
    addPerson,
    deletePerson,
    addExpense,
    addTransfer,
    updateMovement,
    deleteMovement,
    clearAll,
  }
}
