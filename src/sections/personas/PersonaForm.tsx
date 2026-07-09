import { UserIcon, UserPlusIcon } from "lucide-react"
import { Input } from "../../components/ui"

export function PersonaForm({
  nombre,
  onChange,
  onAdd,
}: {
  nombre: string
  onChange: (nombre: string) => void
  onAdd: () => void
}) {
  return (
    <div className="add-person-row">
      <button aria-label="Agregar persona" onClick={onAdd} type="button">
        <UserPlusIcon />
        Añadir
      </button>
      <div className="add-person">
        <UserIcon />
        <Input placeholder="Añadir persona por nombre o alias" value={nombre} onChange={(event) => onChange(event.target.value)} onKeyDown={(event) => event.key === "Enter" && onAdd()} />
      </div>
    </div>
  )
}
