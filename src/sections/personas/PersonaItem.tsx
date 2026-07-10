import { XIcon } from "lucide-react"
import { ConfirmDialog } from "../../components/shared/ConfirmDialog"
import { SlidingText } from "../../components/shared/SlidingText"
import type { Persona } from "../../types"

export function PersonaItem({ persona, onDelete }: { persona: Persona; onDelete: (persona: Persona) => void }) {
  return (
    <div className="person-chip">
      <span className="avatar">{persona[0].toUpperCase()}</span>
      <SlidingText className="person-chip-name">{persona}</SlidingText>
      <ConfirmDialog title="Eliminar persona" description={`Eliminar ${persona} borra lo que pagó y recalcula los gastos donde participaba.`} onConfirm={() => onDelete(persona)}>
        <button aria-label={`Eliminar ${persona}`} type="button">
          <XIcon />
        </button>
      </ConfirmDialog>
    </div>
  )
}
