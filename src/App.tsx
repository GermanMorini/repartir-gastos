import { CopyIcon, PlusIcon, Trash2Icon } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { toast, Toaster } from "sonner"
import { calcularSaldos, calcularTransferenciasPendientes, formatoARS } from "./calculos"
import { Badge, Button, Card, Checkbox, Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger, Input, Select, Separator, Tabs, TabsContent, TabsList, TabsTrigger, Textarea } from "./components/ui"
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
    if (!confirm(`Eliminar ${persona} también eliminará sus movimientos asociados.`)) return
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
    if (!confirm("¿Limpiar todos los datos?")) return
    clearState()
    setPersonas([])
    setMovimientos([])
    setGasto({ descripcion: "", pagador: sinSeleccion, monto: "", participantes: [] })
    setTransferencia({ descripcion: "", de: sinSeleccion, a: sinSeleccion, monto: "" })
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <Toaster richColors position="top-center" />
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-5 md:px-6 md:py-8">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-normal">Repartir cuentas</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Cargá gastos y transferencias realizadas para saber quién debe pagarle a quién.</p>
          </div>
          <Button className="btn-outline" onClick={limpiarTodo} type="button">
            Limpiar datos
          </Button>
        </header>

        <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="flex flex-col gap-5">
            <Card>
              <h2>Personas</h2>
              <div className="mt-4 flex gap-2">
                <Input placeholder="Nombre" value={nombre} onChange={(event) => setNombre(event.target.value)} onKeyDown={(event) => event.key === "Enter" && agregarPersona()} />
                <Button onClick={agregarPersona} type="button">
                  <PlusIcon data-icon="inline-start" />
                  Agregar
                </Button>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {personas.length === 0 ? <p className="empty">Todavía no hay personas.</p> : null}
                {personas.map((persona) => (
                  <Badge key={persona}>
                    {persona}
                    <button aria-label={`Eliminar ${persona}`} onClick={() => borrarPersona(persona)} type="button">
                      <Trash2Icon data-icon="inline-start" />
                    </button>
                  </Badge>
                ))}
              </div>
            </Card>

            <Card>
              <h2>Nuevo movimiento</h2>
              <Tabs defaultValue="gasto" className="mt-4">
                <TabsList className="tabs-list">
                  <TabsTrigger className="tabs-trigger" value="gasto">Gasto</TabsTrigger>
                  <TabsTrigger className="tabs-trigger" value="transferencia">Transferencia realizada</TabsTrigger>
                </TabsList>
                <TabsContent className="mt-4 flex flex-col gap-3" value="gasto">
                  <Textarea placeholder="Descripción opcional" value={gasto.descripcion} onChange={(event) => setGasto({ ...gasto, descripcion: event.target.value })} />
                  <Select value={gasto.pagador} onChange={(event) => setGasto({ ...gasto, pagador: event.target.value })}>
                    <option value="">Quién pagó</option>
                    {personas.map((persona) => <option key={persona}>{persona}</option>)}
                  </Select>
                  <Input inputMode="decimal" min="0" placeholder="Monto" type="number" value={gasto.monto} onChange={(event) => setGasto({ ...gasto, monto: event.target.value })} />
                  <div className="participants">
                    <div className="flex items-center justify-between gap-3">
                      <strong>Participantes</strong>
                      <Button className="btn-ghost" onClick={() => setGasto({ ...gasto, participantes: personas })} type="button">Seleccionar todos</Button>
                    </div>
                    {personas.map((persona) => (
                      <label className="check-row" key={persona}>
                        <Checkbox checked={gasto.participantes.includes(persona)} onCheckedChange={(checked) => setGasto({ ...gasto, participantes: checked ? [...gasto.participantes, persona] : gasto.participantes.filter((item) => item !== persona) })} />
                        {persona}
                      </label>
                    ))}
                  </div>
                  <Button onClick={agregarGasto} type="button">Agregar gasto</Button>
                </TabsContent>
                <TabsContent className="mt-4 flex flex-col gap-3" value="transferencia">
                  <Textarea placeholder="Descripción opcional" value={transferencia.descripcion} onChange={(event) => setTransferencia({ ...transferencia, descripcion: event.target.value })} />
                  <Select value={transferencia.de} onChange={(event) => setTransferencia({ ...transferencia, de: event.target.value })}>
                    <option value="">De</option>
                    {personas.map((persona) => <option key={persona}>{persona}</option>)}
                  </Select>
                  <Select value={transferencia.a} onChange={(event) => setTransferencia({ ...transferencia, a: event.target.value })}>
                    <option value="">A</option>
                    {personas.map((persona) => <option key={persona}>{persona}</option>)}
                  </Select>
                  <Input inputMode="decimal" min="0" placeholder="Monto" type="number" value={transferencia.monto} onChange={(event) => setTransferencia({ ...transferencia, monto: event.target.value })} />
                  <Button onClick={agregarTransferencia} type="button">Agregar transferencia</Button>
                </TabsContent>
              </Tabs>
            </Card>

            <Card>
              <h2>Movimientos</h2>
              <div className="mt-4">
                {movimientos.length === 0 ? <p className="empty">Todavía no hay movimientos.</p> : null}
                {movimientos.length > 0 ? (
                  <div className="table-wrap">
                    <table className="movements-table">
                      <thead>
                        <tr>
                          <th>Pagó</th>
                          <th>Monto</th>
                          <th>Dividido entre</th>
                          <th aria-label="Acciones" />
                        </tr>
                      </thead>
                      <tbody>
                        {movimientos.map((movimiento, index) => (
                          <tr key={`${movimiento.tipo}-${index}`}>
                            <td>
                              {movimiento.tipo === "gasto" ? (
                                <>
                                  <strong>{movimiento.pagador}</strong>
                                  <span>{movimiento.descripcion?.trim() || "Gasto"}</span>
                                </>
                              ) : (
                                <>
                                  <strong>{movimiento.de}</strong>
                                  <span>Transfirió a {movimiento.a}</span>
                                </>
                              )}
                            </td>
                            <td>{formatoARS.format(movimiento.monto)}</td>
                            <td>{movimiento.tipo === "gasto" ? movimiento.participantes.join(", ") : "Transferencia realizada"}</td>
                            <td>
                              <Button className="btn-icon btn-ghost" aria-label="Eliminar movimiento" onClick={() => setMovimientos(movimientos.filter((_, item) => item !== index))} type="button">
                                <Trash2Icon data-icon="inline-start" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : null}
              </div>
            </Card>
          </div>

          <aside className="flex flex-col gap-5 lg:sticky lg:top-6 lg:self-start">
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
            </Card>

            <Dialog>
              <DialogTrigger asChild>
                <Button className="btn-primary sticky bottom-4 w-full text-base shadow-lg" type="button">Repartir!</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogTitle>Reparto final</DialogTitle>
                <DialogDescription>{pendientes.length === 0 ? "Las cuentas ya están equilibradas." : "Transferencias pendientes para saldar las cuentas."}</DialogDescription>
                <Separator />
                <div className="flex flex-col gap-3">
                  {pendientes.map((transferencia) => (
                    <div className="row" key={`${transferencia.de}-${transferencia.a}-${transferencia.monto}`}>
                      {transferencia.de} debe transferir {formatoARS.format(transferencia.monto)} a {transferencia.a}
                    </div>
                  ))}
                </div>
                <Button onClick={() => navigator.clipboard.writeText(resumenCopiable).then(() => toast.success("Resumen copiado."))} type="button">
                  <CopyIcon data-icon="inline-start" />
                  Copiar resumen
                </Button>
              </DialogContent>
            </Dialog>
          </aside>
        </div>
      </div>
    </main>
  )
}
