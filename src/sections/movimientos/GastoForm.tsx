import { PlusIcon, ReceiptTextIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CategoriaIcon } from "../../components/shared/CategoryBadge"
import { CATEGORIAS_GASTO } from "../../lib/categorias"
import type { CategoriaGasto, GastoFormState, Persona } from "../../types"
import { ParticipantsSelector } from "./ParticipantsSelector"

export function GastoForm({ value, personas, variant, demoPressed = false, onChange, onSubmit }: { value: GastoFormState; personas: Persona[]; variant: "mobile" | "desktop"; demoPressed?: boolean; onChange: (value: GastoFormState) => void; onSubmit: () => void }) {
  const update = (changes: Partial<GastoFormState>) => onChange({ ...value, ...changes })
  const personSelect = (
    <Select value={value.pagador} onValueChange={(pagador) => update({ pagador })}>
      <SelectTrigger><SelectValue placeholder={variant === "mobile" ? "Quién pagó" : "Seleccionar quién pagó"} /></SelectTrigger>
      <SelectContent><SelectGroup>{personas.map((persona) => <SelectItem key={persona} value={persona}>{persona}</SelectItem>)}</SelectGroup></SelectContent>
    </Select>
  )
  const categorySelect = (
    <Select value={value.categoria} onValueChange={(categoria) => update({ categoria: categoria as CategoriaGasto })}>
      <SelectTrigger><SelectValue placeholder={variant === "mobile" ? "Categoría" : "Seleccionar categoría"} /></SelectTrigger>
      <SelectContent><SelectGroup>{CATEGORIAS_GASTO.map((categoria) => <SelectItem key={categoria.key} value={categoria.key}><CategoriaIcon categoria={categoria.key} />{categoria.label}</SelectItem>)}</SelectGroup></SelectContent>
    </Select>
  )
  const addButton = <Button className={`add-movement ${demoPressed ? "tutorial-demo-press" : ""}`} data-tour="add-expense-button" onClick={onSubmit} type="button"><PlusIcon data-icon="inline-start" />Añadir gasto</Button>

  if (variant === "desktop") return (
    <div className="desktop-mini-form desktop-expense-form">
      <Input placeholder="Descripción (ej: cena, hotel, nafta...)" value={value.descripcion} onChange={(event) => update({ descripcion: event.target.value })} />
      <div className="desktop-form-split">
        <Input inputMode="decimal" min="0" placeholder="$  0,00" type="number" value={value.monto} onChange={(event) => update({ monto: event.target.value })} />
        {categorySelect}
      </div>
      {personSelect}
      <div className="desktop-participants-row"><ParticipantsSelector personas={personas} selected={value.participantes} onChange={(participantes) => update({ participantes })} /></div>
      <p className="desktop-split-note"><ReceiptTextIcon data-icon="inline-start" />Se dividirá el gasto en partes iguales entre los participantes seleccionados.</p>
      {addButton}
    </div>
  )

  return (
    <div className="form-body">
      <p className="tab-hint">Cargá un gasto y entre quiénes se reparte.</p>
      <label><Input placeholder="Descripción (cena, hotel, ...)" value={value.descripcion} onChange={(event) => update({ descripcion: event.target.value })} /></label>
      <label><Input inputMode="decimal" min="0" placeholder="Total" type="number" value={value.monto} onChange={(event) => update({ monto: event.target.value })} /></label>
      <div className="mobile-two-fields"><label>{personSelect}</label><label><ParticipantsSelector personas={personas} selected={value.participantes} onChange={(participantes) => update({ participantes })} /></label></div>
      <div className="add-expense-row">{categorySelect}{addButton}</div>
    </div>
  )
}
