import { UsersIcon } from "lucide-react"
import { SectionHeader } from "../../components/layout/SectionHeader"
import type { Persona } from "../../types"
import { PersonaForm } from "./PersonaForm"
import { PersonaItem } from "./PersonaItem"

export function PersonasSection({
  className,
  personas,
  nombre,
  onNombreChange,
  onAdd,
  onDelete,
  onStartTutorial,
}: {
  className: string
  personas: Persona[]
  nombre: string
  onNombreChange: (nombre: string) => void
  onAdd: () => void
  onDelete: (persona: Persona) => void
  onStartTutorial: () => void
}) {
  return (
    <section className={`app-section people-section ${className}`} id="personas" data-tour="personas">
      <SectionHeader
        icon={<UsersIcon />}
        title="Personas"
        description="Añadí las personas que participan en los gastos."
        variant="people"
        action={<div className="people-actions"><span>{personas.length} personas</span></div>}
      />
      <div className="person-chips">
        {personas.map((persona) => <PersonaItem key={persona} persona={persona} onDelete={onDelete} />)}
      </div>
      <PersonaForm nombre={nombre} onChange={onNombreChange} onAdd={onAdd} />
      <p className="people-tutorial-hint">
        ¿No sabés que hacer? haz <button onClick={onStartTutorial} type="button">este</button> tutorial para comenzar
      </p>
      <p className="site-footer-inline">
        ¿Te gustó la aplicación? Seguime en <a href="https://github.com/GermanMorini/repartir-gastos" rel="noreferrer" target="_blank">github</a>
      </p>
    </section>
  )
}
