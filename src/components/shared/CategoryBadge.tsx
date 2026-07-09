import type { CategoriaGasto } from "../../types"
import { getCategoria } from "../../lib/categorias"
import { Badge } from "../ui"

export function CategoriaIcon({ categoria }: { categoria: CategoriaGasto }) {
  const meta = getCategoria(categoria)
  const Icon = meta.icon
  return <Icon data-icon="inline-start" style={{ color: meta.color }} />
}

export function CategoryBadge({ categoria }: { categoria: CategoriaGasto }) {
  return <Badge className="category-badge"><CategoriaIcon categoria={categoria} />{getCategoria(categoria).label}</Badge>
}
