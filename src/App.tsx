import { BrushCleaningIcon, CheckIcon, ChevronDownIcon, CopyIcon, PlusIcon, Trash2Icon, UserIcon, UserPlusIcon, XIcon } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { toast, Toaster } from "sonner"
import { calcularSaldos, calcularTransferenciasPendientes, formatoARS } from "./calculos"
import { Button, Card, Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle, DialogTrigger, DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuGroup, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, Input, Select, Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui"
import { clearState, loadState, saveState } from "./storage"
import type { Movimiento, Persona } from "./types"

const sinSeleccion = ""

export default function App() {
  const [personas, setPersonas] = useState<Persona[]>(() => loadState().personas)
  const [movimientos, setMovimientos] = useState<Movimiento[]>(() => loadState().movimientos)
  const [nombre, setNombre] = useState("")
  const [gasto, setGasto] = useState({ descripcion: "", pagador: sinSeleccion, monto: "", participantes: [] as Persona[] })
  const [transferencia, setTransferencia] = useState({ descripcion: "", de: sinSeleccion, a: sinSeleccion, monto: "" })

  useEffect(() => saveState({ personas, movimientos }), [personas, movimientos])

  const saldos = useMemo(() => calcularSaldos(personas, movimientos), [personas, movimientos])
  const pendientes = useMemo(() => calcularTransferenciasPendientes(saldos), [saldos])
  const totalGastado = saldos.reduce((total, saldo) => total + saldo.totalPagadoEnGastos, 0)
  const promedio = personas.length ? totalGastado / personas.length : 0
  const resumenCopiable = pendientes.length
    ? `Reparto final:\n${pendientes.map((t) => `- ${t.de} transfiere ${formatoARS.format(t.monto)} a ${t.a}`).join("\n")}`
    : "Reparto final:\nLas cuentas ya están equilibradas."

  function agregarPersona() {
    const limpia = nombre.trim()
    if (!limpia) return toast.error("El nombre no puede estar vacío.")
    if (personas.includes(limpia)) return toast.error("Ya existe una persona con ese nombre.")
    setPersonas([...personas, limpia])
    setNombre("")
  }

  function borrarPersona(persona: Persona) {
    setPersonas(personas.filter((item) => item !== persona))
    setMovimientos(
      movimientos.filter((movimiento) =>
        movimiento.tipo === "gasto"
          ? movimiento.pagador !== persona && !movimiento.participantes.includes(persona)
          : movimiento.de !== persona && movimiento.a !== persona,
      ),
    )
  }

  function agregarGasto() {
    const monto = Number(gasto.monto)
    if (!gasto.pagador) return toast.error("Elegí quién pagó.")
    if (!Number.isFinite(monto) || monto <= 0) return toast.error("El monto debe ser positivo.")
    if (gasto.participantes.length === 0) return toast.error("Elegí al menos un participante.")
    setMovimientos([...movimientos, { tipo: "gasto", descripcion: gasto.descripcion.trim(), pagador: gasto.pagador, monto, participantes: gasto.participantes }])
    setGasto({ descripcion: "", pagador: gasto.pagador, monto: "", participantes: personas })
  }

  function agregarTransferencia() {
    const monto = Number(transferencia.monto)
    if (!transferencia.de || !transferencia.a) return toast.error("Elegí origen y destino.")
    if (transferencia.de === transferencia.a) return toast.error("Origen y destino deben ser distintos.")
    if (!Number.isFinite(monto) || monto <= 0) return toast.error("El monto debe ser positivo.")
    setMovimientos([...movimientos, { tipo: "transferencia", descripcion: transferencia.descripcion.trim(), de: transferencia.de, a: transferencia.a, monto }])
    setTransferencia({ descripcion: "", de: transferencia.de, a: transferencia.a, monto: "" })
  }

  function limpiarTodo() {
    clearState()
    setPersonas([])
    setMovimientos([])
    setGasto({ descripcion: "", pagador: sinSeleccion, monto: "", participantes: [] })
    setTransferencia({ descripcion: "", de: sinSeleccion, a: sinSeleccion, monto: "" })
  }

  return (
    <main className="app-bg">
      <Toaster richColors position="top-center" />
      <div className="app-grid">
        <div className="app-panel">
          <header className="app-header">
            <span />
            <h1>Repartir cuentas</h1>
            <Dialog>
              <DialogTrigger asChild>
                <button aria-label="Limpiar datos" type="button">
                  <BrushCleaningIcon />
                </button>
              </DialogTrigger>
              <DialogContent>
                <DialogTitle>Limpiar datos</DialogTitle>
                <DialogDescription>Esto elimina personas, gastos y transferencias guardadas en este dispositivo.</DialogDescription>
                <div className="dialog-actions">
                  <DialogClose asChild>
                    <Button className="btn-outline" type="button">Cancelar</Button>
                  </DialogClose>
                  <DialogClose asChild>
                    <Button className="btn-danger" onClick={limpiarTodo} type="button">Limpiar datos</Button>
                  </DialogClose>
                </div>
              </DialogContent>
            </Dialog>
          </header>

          <section className="app-section people-section">
            <div className="section-head">
              <h2>Personas</h2>
              <div className="people-actions">
                <span>{personas.length} personas</span>
              </div>
            </div>
            <div className="person-chips">
              {personas.map((persona) => (
                <div className="person-chip" key={persona}>
                  <span className="avatar">{persona[0].toUpperCase()}</span>
                  <span>
                    <strong>{persona}</strong>
                  </span>
                  <Dialog>
                    <DialogTrigger asChild>
                      <button aria-label={`Eliminar ${persona}`} type="button">
                        <XIcon />
                      </button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogTitle>Eliminar persona</DialogTitle>
                      <DialogDescription>Eliminar {persona} también elimina todos sus movimientos asociados.</DialogDescription>
                      <div className="dialog-actions">
                        <DialogClose asChild>
                          <Button className="btn-outline" type="button">Cancelar</Button>
                        </DialogClose>
                        <DialogClose asChild>
                          <Button className="btn-danger" onClick={() => borrarPersona(persona)} type="button">Eliminar</Button>
                        </DialogClose>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              ))}
            </div>
            <div className="add-person-row">
              <button aria-label="Agregar persona" onClick={agregarPersona} type="button">
                <UserPlusIcon />
                Añadir
              </button>
              <div className="add-person">
                <UserIcon />
                <Input placeholder="Añadir persona por nombre o alias" value={nombre} onChange={(event) => setNombre(event.target.value)} onKeyDown={(event) => event.key === "Enter" && agregarPersona()} />
              </div>
            </div>
          </section>

          <section className="app-section movement-form">
            <Tabs defaultValue="gasto">
              <TabsList className="tabs-list">
                <TabsTrigger className="tabs-trigger" value="gasto">Gasto</TabsTrigger>
                <TabsTrigger className="tabs-trigger" value="transferencia">Transferencia</TabsTrigger>
              </TabsList>
              <TabsContent className="form-body" value="gasto">
                <p className="tab-hint">Carga un gasto y entre quienes se reparte.</p>
                <label>
                  <Input placeholder="Descripción (cena, hotel, ...)" value={gasto.descripcion} onChange={(event) => setGasto({ ...gasto, descripcion: event.target.value })} />
                </label>
                <label>
                  <Input inputMode="decimal" min="0" placeholder="Total" type="number" value={gasto.monto} onChange={(event) => setGasto({ ...gasto, monto: event.target.value })} />
                </label>
                <label>
                  <Select value={gasto.pagador} onChange={(event) => setGasto({ ...gasto, pagador: event.target.value })}>
                    <option value="">Quién pagó</option>
                    {personas.map((persona) => <option key={persona}>{persona}</option>)}
                  </Select>
                </label>
                <label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button className="select-like" type="button">
                        {gasto.participantes.length === personas.length ? "Todos los seleccionados" : `${gasto.participantes.length} seleccionados`}
                        <ChevronDownIcon data-icon="inline-end" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="participants-menu">
                      <DropdownMenuLabel>Participantes</DropdownMenuLabel>
                      <DropdownMenuSeparator className="dropdown-separator" />
                      <DropdownMenuGroup>
                        {personas.map((persona) => (
                          <DropdownMenuCheckboxItem
                            checked={gasto.participantes.includes(persona)}
                            key={persona}
                            onCheckedChange={(checked) =>
                              setGasto({
                                ...gasto,
                                participantes: checked ? [...gasto.participantes, persona] : gasto.participantes.filter((item) => item !== persona),
                              })
                            }
                          >
                            {persona}
                          </DropdownMenuCheckboxItem>
                        ))}
                      </DropdownMenuGroup>
                      <DropdownMenuSeparator className="dropdown-separator" />
                      <Button className="menu-action" onClick={() => setGasto({ ...gasto, participantes: personas })} type="button">
                        Seleccionar todos
                      </Button>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </label>
                <Button className="add-movement" onClick={agregarGasto} type="button">
                  <PlusIcon data-icon="inline-start" />
                  Añadir gasto
                </Button>
              </TabsContent>
              <TabsContent className="form-body" value="transferencia">
                <p className="tab-hint">Por si ya se realizaron transferencias.</p>
                <label>
                  <Input placeholder="Descripción (cena, hotel, ...)" value={transferencia.descripcion} onChange={(event) => setTransferencia({ ...transferencia, descripcion: event.target.value })} />
                </label>
                <label>
                  <Input inputMode="decimal" min="0" placeholder="Total" type="number" value={transferencia.monto} onChange={(event) => setTransferencia({ ...transferencia, monto: event.target.value })} />
                </label>
                <label>
                  <Select value={transferencia.de} onChange={(event) => setTransferencia({ ...transferencia, de: event.target.value })}>
                    <option value="">Origen</option>
                    {personas.map((persona) => <option key={persona}>{persona}</option>)}
                  </Select>
                </label>
                <label>
                  <Select value={transferencia.a} onChange={(event) => setTransferencia({ ...transferencia, a: event.target.value })}>
                    <option value="">Destino</option>
                    {personas.map((persona) => <option key={persona}>{persona}</option>)}
                  </Select>
                </label>
                <Button className="add-movement" onClick={agregarTransferencia} type="button">
                  <PlusIcon data-icon="inline-start" />
                  Añadir transferencia
                </Button>
              </TabsContent>
            </Tabs>
          </section>

          <section className="app-section movements-section">
            <div className="section-head">
              <h2>Movimientos</h2>
              <span className="muted">{movimientos.length} movimientos</span>
            </div>
            {movimientos.length === 0 ? <p className="empty">Todavía no hay movimientos.</p> : null}
            {movimientos.length > 0 ? (
              <div className="movement-list">
                {movimientos.map((movimiento, index) => (
                  <div className="movement-row" key={`${movimiento.tipo}-${index}`}>
                    <div className="movement-copy">
                      <strong>{movimiento.descripcion?.trim() || (movimiento.tipo === "gasto" ? "Gasto" : "Transferencia")}</strong>
                      {movimiento.tipo === "gasto" ? (
                        <span className="movement-label">
                          Pagado por {movimiento.pagador} <span aria-hidden="true">•</span>
                          <span className="marquee">
                            <span>{movimiento.participantes.join(", ")}</span>
                          </span>
                        </span>
                      ) : (
                        <span>{movimiento.de} transfirió a {movimiento.a}</span>
                      )}
                    </div>
                    <strong className="movement-amount">{formatoARS.format(movimiento.monto)}</strong>
                    <button aria-label="Eliminar movimiento" onClick={() => setMovimientos(movimientos.filter((_, item) => item !== index))} type="button">
                      <Trash2Icon />
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
          </section>

        </div>

        <aside className="desktop-summary">
          <Card className="summary-card">
            <h2>Resumen por persona</h2>
            <div className="summary-list">
              {saldos.length === 0 ? <p className="empty">Agregá personas para ver saldos.</p> : null}
              {saldos.map((saldo) => (
                <div className="summary-person" key={saldo.persona}>
                  <div className={saldo.saldo > 0 ? "avatar avatar-positive" : "avatar"}>{saldo.persona[0].toUpperCase()}</div>
                  <strong>{saldo.persona}</strong>
                  <div className="summary-balance">
                    <span className={saldo.saldo > 0 ? "positive" : ""}>{formatoARS.format(saldo.saldo)}</span>
                    <small>{saldo.saldo > 0 ? "debe recibir" : saldo.saldo < 0 ? "debe pagar" : "saldado"}</small>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="totals-card">
            <h2>Totales</h2>
            <div className="totals-grid">
              <div>
                <span>Total gastado</span>
                <strong>{formatoARS.format(totalGastado)}</strong>
              </div>
              <div>
                <span>Por persona (promedio)</span>
                <strong>{formatoARS.format(promedio)}</strong>
              </div>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="btn-primary settle-button" type="button">Repartir!</Button>
              </DialogTrigger>
              <DialogContent className="settlement-dialog">
                <div className="success-icon"><CheckIcon /></div>
                <DialogTitle>¡Reparto completo!</DialogTitle>
                <DialogDescription>
                  {pendientes.length === 0 ? "Todos los saldos están igualados." : "Estas son las transferencias necesarias:"}
                </DialogDescription>
                <div className="settlement-summary">
                  {pendientes.length === 0 ? <p>Las cuentas ya están equilibradas.</p> : null}
                  {pendientes.map((transferencia) => (
                    <div className="settlement-line" key={`${transferencia.de}-${transferencia.a}-${transferencia.monto}`}>
                      <span className="avatar">{transferencia.de[0].toUpperCase()}</span>
                      <span>{transferencia.de}</span>
                      <span>→</span>
                      <span className="avatar avatar-positive">{transferencia.a[0].toUpperCase()}</span>
                      <span>{transferencia.a}</span>
                      <strong>{formatoARS.format(transferencia.monto)}</strong>
                    </div>
                  ))}
                </div>
                <DialogClose asChild>
                  <Button className="settlement-ok" type="button">Entendido</Button>
                </DialogClose>
                <Button className="settlement-copy" onClick={() => navigator.clipboard.writeText(resumenCopiable).then(() => toast.success("Resumen copiado."))} type="button">
                  <CopyIcon data-icon="inline-start" />
                  Copiar resumen
                </Button>
              </DialogContent>
            </Dialog>
          </Card>
        </aside>
      </div>
    </main>
  )
}
