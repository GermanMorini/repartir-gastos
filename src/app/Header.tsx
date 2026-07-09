import { BrushCleaningIcon, UsersIcon } from "lucide-react"
import { ConfirmDialog } from "../components/shared/ConfirmDialog"

export function Header({ onClear }: { onClear: () => void }) {
  return (
    <header className="app-header">
      <div className="brand-mark"><UsersIcon /></div>
      <h1>Repartir gastos</h1>
      <ConfirmDialog title="Limpiar datos" description="Esto elimina todos los datos ingresados hasta el momento." confirmText="Limpiar datos" onConfirm={onClear}>
        <button aria-label="Limpiar datos" className="clear-button" type="button">
          <BrushCleaningIcon />
        </button>
      </ConfirmDialog>
    </header>
  )
}
