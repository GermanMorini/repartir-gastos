import { BedIcon, CarIcon, CircleEllipsisIcon, CoffeeIcon, FuelIcon, HeartPulseIcon, HomeIcon, PartyPopperIcon, UtensilsIcon } from "lucide-react"
import type { CategoriaGasto } from "../types/index.ts"

export const CATEGORIAS_GASTO: { key: CategoriaGasto; label: string; color: string; icon: typeof UtensilsIcon }[] = [
  { key: "comida", label: "Comida", color: "#86efac", icon: UtensilsIcon },
  { key: "bebida", label: "Bebida", color: "#7dd3fc", icon: CoffeeIcon },
  { key: "combustible", label: "Combustible", color: "#fde68a", icon: FuelIcon },
  { key: "transporte", label: "Transporte", color: "#fdba74", icon: CarIcon },
  { key: "ocio", label: "Ocio", color: "#d8b4fe", icon: PartyPopperIcon },
  { key: "alojamiento", label: "Alojamiento", color: "#d6b08a", icon: BedIcon },
  { key: "salud", label: "Salud", color: "#fda4af", icon: HeartPulseIcon },
  { key: "hogar", label: "Hogar", color: "#99f6e4", icon: HomeIcon },
  { key: "otros", label: "Otros", color: "#cbd5e1", icon: CircleEllipsisIcon },
]

export const CATEGORIA_DEFAULT: CategoriaGasto = "otros"

export function getCategoria(categoria: CategoriaGasto) {
  return CATEGORIAS_GASTO.find((item) => item.key === categoria) ?? CATEGORIAS_GASTO.at(-1)!
}

export function getCategoriaOrden(categoria: CategoriaGasto) {
  const index = CATEGORIAS_GASTO.findIndex((item) => item.key === categoria)
  return index === -1 ? CATEGORIAS_GASTO.length : index
}
