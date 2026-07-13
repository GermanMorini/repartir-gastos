import { CategoryBadge } from "../../components/shared/CategoryBadge"
import { Card } from "@/components/ui/card"
import { getCategoria } from "../../lib/categorias"
import { formatoARS, porcentaje } from "../../lib/money"
import type { ResumenCategoria } from "../../types"
import { sumCategoryAmounts } from "../../domain/calculations/categories"

export function CategoryPie({ data }: { data: ResumenCategoria[] }) {
  const radio = 72
  const circunferencia = 2 * Math.PI * radio
  let acumulado = 0

  if (data.length === 0) return <div className="category-pie-empty">Sin gastos</div>

  return (
    <svg className="category-pie" viewBox="0 0 180 180" role="img" aria-label="Gastos por categoría">
      <circle cx="90" cy="90" fill="none" r={radio} stroke="#edf1f4" strokeWidth="28" />
      {data.map((item) => {
        const largo = circunferencia * item.porcentaje / 100
        const segmento = (
          <circle
            cx="90"
            cy="90"
            fill="none"
            key={item.categoria}
            r={radio}
            stroke={getCategoria(item.categoria).color}
            strokeDasharray={`${largo} ${circunferencia}`}
            strokeDashoffset={-acumulado}
            strokeWidth="28"
            transform="rotate(-90 90 90)"
          />
        )
        acumulado += largo
        return segmento
      })}
      <text dominantBaseline="middle" textAnchor="middle" x="90" y="84">Total</text>
      <text dominantBaseline="middle" textAnchor="middle" x="90" y="104">{formatoARS.format(sumCategoryAmounts(data))}</text>
    </svg>
  )
}

export function CategoryDetailList({ data }: { data: ResumenCategoria[] }) {
  return (
    <div className="category-detail-list">
      {data.length === 0 ? <p className="empty">Todavía no hay gastos para graficar.</p> : null}
      {data.map((item) => (
        <div className="category-detail-row" key={item.categoria}>
          <CategoryBadge categoria={item.categoria} />
          <strong>{formatoARS.format(item.monto)}</strong>
          <span>{item.cantidadGastos} {item.cantidadGastos === 1 ? "gasto" : "gastos"}</span>
          <small>{porcentaje(item.porcentaje)}</small>
        </div>
      ))}
    </div>
  )
}

export function CategoryChartShareCard({ data, total }: { data: ResumenCategoria[]; total: number }) {
  return (
    <Card className="category-share-card">
      <header>
        <h2>Gastos por categoría</h2>
        <p>Compará cuánto se gastó en cada categoría.</p>
      </header>
      <div className="category-chart-layout">
        <CategoryPie data={data} />
        <CategoryDetailList data={data} />
      </div>
      <footer><span>Total gastado</span><strong>{formatoARS.format(total)}</strong></footer>
    </Card>
  )
}
