import { CategoriaIcon } from "../../components/shared/CategoryBadge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { CATEGORIAS_GASTO } from "../../lib/categorias"
import type { CategoriaGasto, Movimiento, Persona } from "../../types"
import { ParticipantsSelector } from "./ParticipantsSelector"

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
  onEditarAporte,
}: {
  edicion: EdicionMovimiento
  personas: Persona[]
  onClose: () => void
  onSubmit: () => void
  onChange: (edicion: Exclude<EdicionMovimiento, null> | null) => void
  onEditarGasto: (cambios: Partial<Gasto>) => void
  onEditarTransferencia: (cambios: Partial<Transferencia>) => void
  onEditarAporte: (persona: Persona, monto: string) => void
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
              <div className="edit-field edit-payment-mode-row">
                <span>Modo</span>
                <label className="payment-mode-switch">
                  <Switch checked={(edicion.movimiento.modoPago ?? "pagador_unico") === "pago_multiple"} onCheckedChange={(checked) => onEditarGasto({ modoPago: checked ? "pago_multiple" : "pagador_unico" })} />
                  Pagado entre varios
                </label>
              </div>
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
                <ParticipantsSelector
                  aportes={Object.fromEntries(Object.entries(edicion.movimiento.aportes ?? {}).map(([persona, monto]) => [persona, String(monto)]))}
                  multiplePayment={(edicion.movimiento.modoPago ?? "pagador_unico") === "pago_multiple"}
                  onAporteChange={onEditarAporte}
                  onParticipantesChange={(participantes) => onEditarGasto({ participantes })}
                  participantes={edicion.movimiento.participantes}
                  personas={personas}
                />
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
