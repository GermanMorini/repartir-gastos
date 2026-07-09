import { ChevronDownIcon } from "lucide-react"
import { CategoriaIcon } from "../../components/shared/CategoryBadge"
import { Button, Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle, DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuGroup, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, Input, Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "../../components/ui"
import { CATEGORIAS_GASTO } from "../../lib/categorias"
import type { CategoriaGasto, Movimiento, Persona } from "../../types"

type Gasto = Extract<Movimiento, { tipo: "gasto" }>
type Transferencia = Extract<Movimiento, { tipo: "transferencia" }>
export type EdicionMovimiento = { index: number; movimiento: Movimiento; monto: string } | null

export function EditMovimientoDialog({
  edicion,
  personas,
  onClose,
  onSubmit,
  onChange,
  onEditarGasto,
  onEditarTransferencia,
  onEditarParticipante,
}: {
  edicion: EdicionMovimiento
  personas: Persona[]
  onClose: () => void
  onSubmit: () => void
  onChange: (edicion: Exclude<EdicionMovimiento, null> | null) => void
  onEditarGasto: (cambios: Partial<Gasto>) => void
  onEditarTransferencia: (cambios: Partial<Transferencia>) => void
  onEditarParticipante: (persona: Persona, checked: boolean) => void
}) {
  return (
    <Dialog open={edicion !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="edit-dialog">
        <DialogTitle>Editar movimiento</DialogTitle>
        <DialogDescription>Cambia los datos de este movimiento</DialogDescription>
        <form className="edit-form" onSubmit={(event) => { event.preventDefault(); onSubmit() }}>
          <label className="edit-field">
            <span>Nombre</span>
            <Input placeholder="Nombre" value={edicion?.movimiento.descripcion ?? ""} onChange={(event) => onChange(edicion ? { ...edicion, movimiento: { ...edicion.movimiento, descripcion: event.target.value } } : null)} />
          </label>
          <label className="edit-field">
            <span>Total</span>
            <Input inputMode="decimal" min="0" placeholder="Total" type="number" value={edicion?.monto ?? ""} onChange={(event) => onChange(edicion ? { ...edicion, monto: event.target.value } : null)} />
          </label>
          {edicion?.movimiento.tipo === "gasto" ? (
            <>
              <div className="edit-field">
                <span>Pagó</span>
                <Select value={edicion.movimiento.pagador} onValueChange={(pagador) => onEditarGasto({ pagador })}>
                  <SelectTrigger><SelectValue placeholder="Quién pagó" /></SelectTrigger>
                  <SelectContent className="edit-select-content"><SelectGroup>{personas.map((persona) => <SelectItem key={persona} value={persona}>{persona}</SelectItem>)}</SelectGroup></SelectContent>
                </Select>
              </div>
              <div className="edit-field">
                <span>Categoría</span>
                <Select value={edicion.movimiento.categoria} onValueChange={(categoria) => onEditarGasto({ categoria: categoria as CategoriaGasto })}>
                  <SelectTrigger><SelectValue placeholder="Categoría" /></SelectTrigger>
                  <SelectContent className="edit-select-content">
                    <SelectGroup>
                      {CATEGORIAS_GASTO.map((categoria) => (
                        <SelectItem key={categoria.key} value={categoria.key}>
                          <CategoriaIcon categoria={categoria.key} />
                          {categoria.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <div className="edit-field">
                <span>Participantes</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button className="select-like" type="button">
                      {edicion.movimiento.participantes.length === 0 ? "Participantes" : edicion.movimiento.participantes.length === personas.length ? "Todos los seleccionados" : `${edicion.movimiento.participantes.length} seleccionados`}
                      <ChevronDownIcon data-icon="inline-end" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="participants-menu edit-participants-menu">
                    <DropdownMenuLabel>Participantes</DropdownMenuLabel>
                    <DropdownMenuSeparator className="dropdown-separator" />
                    <DropdownMenuGroup>
                      {personas.map((persona) => (
                        <DropdownMenuCheckboxItem checked={edicion.movimiento.tipo === "gasto" && edicion.movimiento.participantes.includes(persona)} key={persona} onCheckedChange={(checked) => onEditarParticipante(persona, checked)}>
                          {persona}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator className="dropdown-separator" />
                    <Button className="menu-action" onClick={() => edicion.movimiento.tipo === "gasto" && onEditarGasto({ participantes: edicion.movimiento.participantes.length === personas.length ? [] : personas })} type="button">
                      {edicion.movimiento.participantes.length === personas.length ? "Deseleccionar todos" : "Seleccionar todos"}
                    </Button>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </>
          ) : null}
          {edicion?.movimiento.tipo === "transferencia" ? (
            <>
              <div className="edit-field">
                <span>Origen</span>
                <Select value={edicion.movimiento.de} onValueChange={(de) => onEditarTransferencia({ de })}>
                  <SelectTrigger><SelectValue placeholder="Origen" /></SelectTrigger>
                  <SelectContent className="edit-select-content"><SelectGroup>{personas.map((persona) => <SelectItem key={persona} value={persona}>{persona}</SelectItem>)}</SelectGroup></SelectContent>
                </Select>
              </div>
              <div className="edit-field">
                <span>Destino</span>
                <Select value={edicion.movimiento.a} onValueChange={(a) => onEditarTransferencia({ a })}>
                  <SelectTrigger><SelectValue placeholder="Destino" /></SelectTrigger>
                  <SelectContent className="edit-select-content"><SelectGroup>{personas.map((persona) => <SelectItem key={persona} value={persona}>{persona}</SelectItem>)}</SelectGroup></SelectContent>
                </Select>
              </div>
            </>
          ) : null}
          <div className="dialog-actions">
            <DialogClose asChild><Button className="btn-outline" type="button">Cancelar</Button></DialogClose>
            <Button type="submit">Aceptar</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
