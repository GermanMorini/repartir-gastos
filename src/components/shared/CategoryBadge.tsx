import type { CSSProperties } from "react"
import type { CategoriaGasto } from "../../types"
import { getCategoria } from "../../lib/categorias"
import { Badge } from "@/components/ui/badge"

export function CategoriaIcon({ categoria }: { categoria: CategoriaGasto }) {
  const meta = getCategoria(categoria)
  const Icon = meta.icon
  return <span className="category-icon" data-icon="inline-start" style={{ "--category-color": meta.color, color: meta.color } as CSSProperties}><Icon /></span>
}

export function CategoryBadge({ categoria }: { categoria: CategoriaGasto }) {
  return <Badge className="category-badge"><CategoriaIcon categoria={categoria} />{getCategoria(categoria).label}</Badge>
}
