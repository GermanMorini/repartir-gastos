import { EllipsisVerticalIcon, UsersIcon } from "lucide-react"

export function Header({ onActionsClick }: { onActionsClick: () => void }) {
  return (
    <header className="app-header">
      <div className="brand-mark"><UsersIcon /></div>
      <h1>Repartir gastos</h1>
      <button aria-label="Abrir acciones" className="clear-button" type="button" onClick={onActionsClick}>
        <EllipsisVerticalIcon />
      </button>
    </header>
  )
}
