import { ChevronDownIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import type { Persona } from "../../types"

type ParticipantsSelectorProps = {
  personas: Persona[]
  participantes: Persona[]
  aportes?: Record<Persona, string>
  multiplePayment?: boolean
  onParticipantesChange: (personas: Persona[]) => void
  onAporteChange?: (persona: Persona, monto: string) => void
}

function triggerLabel(participantes: Persona[], personas: Persona[]) {
  if (participantes.length === 0) return "Participantes"
  if (participantes.length === personas.length) return "Todos"
  return `${participantes.length} seleccionados`
}

export function ParticipantsSelector({
  personas,
  participantes,
  aportes = {},
  multiplePayment = false,
  onParticipantesChange,
  onAporteChange,
}: ParticipantsSelectorProps) {
  const selected = new Set(participantes)
  const toggleParticipante = (persona: Persona, checked: boolean) => {
    onParticipantesChange(checked ? [...participantes, persona] : participantes.filter((item) => item !== persona))
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="select-like participants-trigger" type="button">
          {triggerLabel(participantes, personas)}
          <ChevronDownIcon data-icon="inline-end" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className={`participants-menu participants-selector-menu${multiplePayment ? " is-multiple-payment" : ""}`}>
        <DropdownMenuLabel>{multiplePayment ? "Participantes y aportes" : "Participantes"}</DropdownMenuLabel>
        <DropdownMenuSeparator className="dropdown-separator" />
        <DropdownMenuGroup>
          {personas.map((persona) => {
            const checked = selected.has(persona)
            return (
              <div className="participant-option" key={persona}>
                <div
                  className="participant-check"
                  onClick={() => toggleParticipante(persona, !checked)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") toggleParticipante(persona, !checked)
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <Checkbox checked={checked} onCheckedChange={(value) => toggleParticipante(persona, value === true)} onClick={(event) => event.stopPropagation()} tabIndex={-1} />
                  <span>{persona}</span>
                </div>
                {multiplePayment ? (
                  <Input
                    aria-label={`Aporte de ${persona}`}
                    className="participant-contribution"
                    inputMode="decimal"
                    min="0"
                    onChange={(event) => onAporteChange?.(persona, event.target.value)}
                    onClick={(event) => event.stopPropagation()}
                    placeholder="$ 0"
                    type="number"
                    value={aportes[persona] ?? ""}
                  />
                ) : null}
              </div>
            )
          })}
        </DropdownMenuGroup>
        <DropdownMenuSeparator className="dropdown-separator" />
        <Button className="menu-action" onClick={() => onParticipantesChange(participantes.length === personas.length ? [] : personas)} type="button">
          {participantes.length === personas.length ? "Deseleccionar todos" : "Seleccionar todos"}
        </Button>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
