import { ChevronDownIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuGroup, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import type { Persona } from "../../types"

export function ParticipantsSelector({ personas, selected, onChange, className = "" }: { personas: Persona[]; selected: Persona[]; onChange: (personas: Persona[]) => void; className?: string }) {
  const allSelected = personas.length > 0 && selected.length === personas.length
  const toggle = (persona: Persona, checked: boolean) => onChange(checked ? [...selected, persona] : selected.filter((item) => item !== persona))

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="select-like" type="button">
          {selected.length === 0 ? "Participantes" : allSelected ? "Todos" : `${selected.length} seleccionados`}
          <ChevronDownIcon data-icon="inline-end" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className={`participants-menu ${className}`}>
        <DropdownMenuLabel>Participantes</DropdownMenuLabel>
        <DropdownMenuSeparator className="dropdown-separator" />
        <DropdownMenuGroup>
          {personas.map((persona) => (
            <DropdownMenuCheckboxItem checked={selected.includes(persona)} key={persona} onCheckedChange={(checked) => toggle(persona, checked)}>
              {persona}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator className="dropdown-separator" />
        <Button className="menu-action" onClick={() => onChange(allSelected ? [] : personas)} type="button">
          {allSelected ? "Deseleccionar todos" : "Seleccionar todos"}
        </Button>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
