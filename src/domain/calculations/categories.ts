import { decimal, roundMoney } from "./ledger.ts"
import { getCategoria, getCategoriaOrden } from "../../lib/categorias.ts"
import type { CategoriaGasto, Movimiento, ResumenCategoria } from "../../types"

export function getGastosPorCategoria(movimientos: Movimiento[]): ResumenCategoria[] {
  const grupos = new Map<CategoriaGasto, { monto: ReturnType<typeof decimal>; cantidadGastos: number }>()
  for (const movimiento of movimientos) {
    if (movimiento.tipo !== "gasto") continue
    const actual = grupos.get(movimiento.categoria) ?? { monto: decimal(0), cantidadGastos: 0 }
    grupos.set(movimiento.categoria, { monto: actual.monto.plus(movimiento.monto), cantidadGastos: actual.cantidadGastos + 1 })
  }
  const total = [...grupos.values()].reduce((sum, item) => sum.plus(item.monto), decimal(0))
  return [...grupos.entries()].map(([categoria, item]) => ({
    categoria,
    label: getCategoria(categoria).label,
    monto: roundMoney(item.monto),
    cantidadGastos: item.cantidadGastos,
    porcentaje: total.isZero() ? 0 : roundMoney(item.monto.mul(100).div(total)),
  })).sort((a, b) => getCategoriaOrden(a.categoria) - getCategoriaOrden(b.categoria))
}

export function sumCategoryAmounts(categories: ResumenCategoria[]) {
  return roundMoney(categories.reduce((total, category) => total.plus(category.monto), decimal(0)))
}
