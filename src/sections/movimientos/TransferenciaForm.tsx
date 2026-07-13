import { PlusIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Persona, TransferenciaFormState } from "../../types"

export function TransferenciaForm({ value, personas, variant, demoPressed = false, onChange, onSubmit }: { value: TransferenciaFormState; personas: Persona[]; variant: "mobile" | "desktop"; demoPressed?: boolean; onChange: (value: TransferenciaFormState) => void; onSubmit: () => void }) {
  const update = (changes: Partial<TransferenciaFormState>) => onChange({ ...value, ...changes })
  const personSelect = (field: "de" | "a", placeholder: string) => (
    <Select value={value[field]} onValueChange={(persona) => update({ [field]: persona })}>
      <SelectTrigger><SelectValue placeholder={placeholder} /></SelectTrigger>
      <SelectContent><SelectGroup>{personas.map((persona) => <SelectItem key={persona} value={persona}>{persona}</SelectItem>)}</SelectGroup></SelectContent>
    </Select>
  )
  const addButton = <Button className={`add-movement ${demoPressed ? "tutorial-demo-press" : ""}`} data-tour="add-transfer-button" onClick={onSubmit} type="button"><PlusIcon data-icon="inline-start" />Registrar transferencia</Button>

  if (variant === "desktop") return (
    <div className="desktop-mini-form desktop-transfer-form">
      <Input placeholder="Descripción" value={value.descripcion} onChange={(event) => update({ descripcion: event.target.value })} />
      <div className="desktop-transfer-amount"><Input inputMode="decimal" min="0" placeholder="$  0,00" type="number" value={value.monto} onChange={(event) => update({ monto: event.target.value })} /></div>
      {personSelect("de", "Seleccionar origen")}
      {personSelect("a", "Seleccionar destino")}
      {addButton}
    </div>
  )

  return (
    <div className="form-body">
      <p className="tab-hint">Registrá un pago realizado.</p>
      <label><Input placeholder="Descripción (cena, hotel, ...)" value={value.descripcion} onChange={(event) => update({ descripcion: event.target.value })} /></label>
      <label><Input inputMode="decimal" min="0" placeholder="Total" type="number" value={value.monto} onChange={(event) => update({ monto: event.target.value })} /></label>
      <div className="mobile-two-fields"><label>{personSelect("de", "Origen")}</label><label>{personSelect("a", "Destino")}</label></div>
      {addButton}
    </div>
  )
}
