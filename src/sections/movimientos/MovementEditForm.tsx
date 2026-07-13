import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CategoriaIcon } from "../../components/shared/CategoryBadge"
import { CATEGORIAS_GASTO } from "../../lib/categorias"
import type { CategoriaGasto, GastoMovimiento, MovementEditState, Persona, TransferenciaMovimiento } from "../../types"
import { ParticipantsSelector } from "./ParticipantsSelector"
import "./edit-movement-sheet.css"

export function MovementEditForm({ edit, personas, onChange, onEditExpense, onEditTransfer, onClose, onSubmit }: { edit: MovementEditState | null; personas: Persona[]; onChange: (edit: MovementEditState | null) => void; onEditExpense: (changes: Partial<GastoMovimiento>) => void; onEditTransfer: (changes: Partial<TransferenciaMovimiento>) => void; onClose: () => void; onSubmit: () => void }) {
  return (
    <form className="edit-form" onSubmit={(event) => { event.preventDefault(); onSubmit() }}>
      <label className="edit-field"><span>Nombre</span><Input placeholder="Nombre" value={edit?.movimiento.descripcion ?? ""} onChange={(event) => onChange(edit ? { ...edit, movimiento: { ...edit.movimiento, descripcion: event.target.value } } : null)} /></label>
      <label className="edit-field"><span>Total</span><Input inputMode="decimal" min="0" placeholder="Total" type="number" value={edit?.monto ?? ""} onChange={(event) => onChange(edit ? { ...edit, monto: event.target.value } : null)} /></label>
      {edit?.movimiento.tipo === "gasto" ? <>
        <div className="edit-field"><span>Pagó</span><Select value={edit.movimiento.pagador} onValueChange={(pagador) => onEditExpense({ pagador })}><SelectTrigger><SelectValue placeholder="Quién pagó" /></SelectTrigger><SelectContent className="edit-select-content"><SelectGroup>{personas.map((persona) => <SelectItem key={persona} value={persona}>{persona}</SelectItem>)}</SelectGroup></SelectContent></Select></div>
        <div className="edit-field"><span>Categoría</span><Select value={edit.movimiento.categoria} onValueChange={(categoria) => onEditExpense({ categoria: categoria as CategoriaGasto })}><SelectTrigger><SelectValue placeholder="Categoría" /></SelectTrigger><SelectContent className="edit-select-content"><SelectGroup>{CATEGORIAS_GASTO.map((categoria) => <SelectItem key={categoria.key} value={categoria.key}><CategoriaIcon categoria={categoria.key} />{categoria.label}</SelectItem>)}</SelectGroup></SelectContent></Select></div>
        <div className="edit-field"><span>Participantes</span><ParticipantsSelector className="edit-participants-menu" personas={personas} selected={edit.movimiento.participantes} onChange={(participantes) => onEditExpense({ participantes })} /></div>
      </> : null}
      {edit?.movimiento.tipo === "transferencia" ? <>
        <div className="edit-field"><span>Origen</span><Select value={edit.movimiento.de} onValueChange={(de) => onEditTransfer({ de })}><SelectTrigger><SelectValue placeholder="Origen" /></SelectTrigger><SelectContent className="edit-select-content"><SelectGroup>{personas.map((persona) => <SelectItem key={persona} value={persona}>{persona}</SelectItem>)}</SelectGroup></SelectContent></Select></div>
        <div className="edit-field"><span>Destino</span><Select value={edit.movimiento.a} onValueChange={(a) => onEditTransfer({ a })}><SelectTrigger><SelectValue placeholder="Destino" /></SelectTrigger><SelectContent className="edit-select-content"><SelectGroup>{personas.map((persona) => <SelectItem key={persona} value={persona}>{persona}</SelectItem>)}</SelectGroup></SelectContent></Select></div>
      </> : null}
      <div className="dialog-actions"><Button className="btn-outline" onClick={onClose} type="button">Cancelar</Button><Button type="submit">Aceptar</Button></div>
    </form>
  )
}
