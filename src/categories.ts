import { BedIcon, CarIcon, CircleEllipsisIcon, CoffeeIcon, HeartPulseIcon, HomeIcon, PartyPopperIcon, UtensilsIcon } from "lucide-react"
import type { CategoriaGasto } from "./types"

export const CATEGORIAS_GASTO: { key: CategoriaGasto; label: string; color: string; icon: typeof UtensilsIcon }[] = [
  { key: "comida", label: "Comida", color: "#86efac", icon: UtensilsIcon },
  { key: "bebida", label: "Bebida", color: "#7dd3fc", icon: CoffeeIcon },
  { key: "transporte", label: "Transporte", color: "#fdba74", icon: CarIcon },
  { key: "salud", label: "Salud", color: "#fda4af", icon: HeartPulseIcon },
  { key: "ocio", label: "Ocio", color: "#d8b4fe", icon: PartyPopperIcon },
  { key: "alojamiento", label: "Alojamiento", color: "#c4b5fd", icon: BedIcon },
  { key: "hogar", label: "Hogar", color: "#99f6e4", icon: HomeIcon },
  { key: "otros", label: "Otros", color: "#cbd5e1", icon: CircleEllipsisIcon },
]

export const CATEGORIA_DEFAULT: CategoriaGasto = "otros"

export function getCategoria(categoria: CategoriaGasto) {
  return CATEGORIAS_GASTO.find((item) => item.key === categoria) ?? CATEGORIAS_GASTO.at(-1)!
}
