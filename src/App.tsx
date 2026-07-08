import { ArrowDownLeftIcon, ArrowUpRightIcon, BrushCleaningIcon, CalculatorIcon, CheckIcon, ChevronDownIcon, CopyIcon, PlusIcon, ReceiptTextIcon, Trash2Icon, UserIcon, UserPlusIcon, UsersIcon, WalletCardsIcon, XIcon } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import type { CSSProperties, ReactNode } from "react"
import { toast, Toaster } from "sonner"
import { calcularSaldos, calcularTransferenciasPendientes, formatoARS, getMatrizCalculos, getResumenPersona } from "./calculos"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger, Badge, Button, Card, Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle, DialogTrigger, DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuGroup, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, Input, ScrollArea, Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue, Separator, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui"
import { clearState, loadState, saveState } from "./storage"
import type { Movimiento, Persona } from "./types"

const sinSeleccion = ""
type Gasto = Extract<Movimiento, { tipo: "gasto" }>
type Transferencia = Extract<Movimiento, { tipo: "transferencia" }>

function SlidingNames({ names }: { names: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [distance, setDistance] = useState(0)

  useEffect(() => {
    const element = ref.current
    if (!element) return
    const measure = () => setDistance(Math.max(0, element.scrollWidth - element.clientWidth))
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [names])

  return (
    <span className={distance ? "marquee is-moving" : "marquee"} ref={ref} style={{ "--slide-distance": `${distance}px` } as CSSProperties}>
      <span>{names}</span>
    </span>
  )
}

function SlidingSettlement({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const [distance, setDistance] = useState(0)

  useEffect(() => {
    const element = ref.current
    if (!element) return
    const measure = () => setDistance(Math.max(0, element.scrollWidth - element.clientWidth))
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [children])

  return (
    <div className={distance ? "settlement-marquee is-moving" : "settlement-marquee"} ref={ref} style={{ "--slide-distance": `${distance}px` } as CSSProperties}>
      {children}
    </div>
  )
}

function iniciales(persona: Persona) {
  return persona.split(/\s+/).filter(Boolean).slice(0, 2).map((parte) => parte[0]?.toUpperCase()).join("") || persona[0]?.toUpperCase() || "?"
}

export default function App() {
  const [personas, setPersonas] = useState<Persona[]>(() => loadState().personas)
  const [movimientos, setMovimientos] = useState<Movimiento[]>(() => loadState().movimientos)
  const [nombre, setNombre] = useState("")
  const [gasto, setGasto] = useState({ descripcion: "", pagador: sinSeleccion, monto: "", participantes: [] as Persona[] })
  const [transferencia, setTransferencia] = useState({ descripcion: "", de: sinSeleccion, a: sinSeleccion, monto: "" })
  const [edicion, setEdicion] = useState<{ index: number; movimiento: Movimiento; monto: string } | null>(null)

  useEffect(() => saveState({ personas, movimientos }), [personas, movimientos])

  const saldos = useMemo(() => calcularSaldos(personas, movimientos), [personas, movimientos])
  const matrizCalculos = useMemo(() => getMatrizCalculos(personas, movimientos), [personas, movimientos])
  const pendientes = useMemo(() => calcularTransferenciasPendientes(saldos), [saldos])
  const totalGastado = saldos.reduce((total, saldo) => total + saldo.totalPagadoEnGastos, 0)
  const promedio = personas.length ? totalGastado / personas.length : 0
  const firmaResumen = "💲 Resumen hecho con https://germanmorini.github.io/repartir-gastos/"
  const resumenCopiable = pendientes.length
    ? `Reparto final:\n${pendientes.map((t) => `- ${t.de} transfiere ${formatoARS.format(t.monto)} a ${t.a}`).join("\n")}\n\n${firmaResumen}`
    : `Reparto final:\nLas cuentas ya están equilibradas.\n\n${firmaResumen}`

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

  function nombreMovimiento(movimiento: Movimiento) {
    return movimiento.descripcion?.trim() || (movimiento.tipo === "gasto" ? "Gasto" : "Transferencia")
  }

  function resultadoPersona(persona: Persona, saldo: number) {
    const centavos = Math.round(saldo * 100)
    if (centavos < 0) return `Debe pagar ${formatoARS.format(Math.abs(saldo))}`
    if (centavos > 0) return `Debe recibir ${formatoARS.format(saldo)}`
    return `${persona} está al día`
  }

  function resultadoCopiable(resumen: ReturnType<typeof getResumenPersona>) {
    const centavos = Math.round(resumen.saldo * 100)
    if (centavos < 0) return `debe pagar ${formatoARS.format(Math.abs(resumen.saldo))}`
    if (centavos > 0) return `le deben pagar ${formatoARS.format(resumen.saldo)}`
    return "está al día"
  }

  function formatoSaldoMatriz(monto: number) {
    const centavos = Math.round(monto * 100)
    const valor = formatoARS.format(Math.abs(monto)).replace(/\s/g, "")
    if (centavos === 0) return valor
    return `${centavos > 0 ? "+" : "-"}${valor}`
  }

  function textoResumenPersona(resumen: ReturnType<typeof getResumenPersona>) {
    const detalle = [
      ...resumen.gastosDondeParticipo.map(({ movimiento, montoParte }) => `- ${nombreMovimiento(movimiento)}: le tocaba ${formatoARS.format(montoParte)} de ${formatoARS.format(movimiento.monto)}`),
      ...resumen.gastosQuePago.map((movimiento) => `- ${nombreMovimiento(movimiento)}: puso ${formatoARS.format(movimiento.monto)}`),
      ...resumen.transferenciasEnviadas.map((movimiento) => `- Pagó a ${movimiento.a}: ${formatoARS.format(movimiento.monto)}`),
      ...resumen.transferenciasRecibidas.map((movimiento) => `- Recibió de ${movimiento.de}: ${formatoARS.format(movimiento.monto)}`),
    ]

    return [
      `Resumen de ${resumen.persona}:`,
      `- Le tocaba gastar: ${formatoARS.format(resumen.totalLeTocaba)}`,
      `- Ya salió de su bolsillo: ${formatoARS.format(resumen.totalSalioBolsillo)}`,
      `- Ya recibió: ${formatoARS.format(resumen.totalRecibido)}`,
      `- Resultado: ${resultadoCopiable(resumen)}`,
      ...(detalle.length ? ["", "Detalle:", ...detalle] : []),
    ].join("\n")
  }

  function abrirEdicion(index: number, movimiento: Movimiento) {
    setEdicion({
      index,
      monto: String(movimiento.monto),
      movimiento: movimiento.tipo === "gasto"
        ? { ...movimiento, descripcion: nombreMovimiento(movimiento), participantes: [...movimiento.participantes] }
        : { ...movimiento, descripcion: nombreMovimiento(movimiento) },
    })
  }

  function aceptarEdicion() {
    if (!edicion) return
    const nombreEditado = edicion.movimiento.descripcion?.trim()
    const monto = Number(edicion.monto)
    if (!nombreEditado) return toast.error("El nombre no puede estar vacío.")
    if (!Number.isFinite(monto) || monto <= 0) return toast.error("El monto debe ser positivo.")
    if (edicion.movimiento.tipo === "gasto" && edicion.movimiento.participantes.length === 0) return toast.error("Elegí al menos un participante.")
    if (edicion.movimiento.tipo === "transferencia" && edicion.movimiento.de === edicion.movimiento.a) return toast.error("Origen y destino deben ser distintos.")
    setMovimientos(movimientos.map((movimiento, index) => (index === edicion.index ? { ...edicion.movimiento, descripcion: nombreEditado, monto } : movimiento)))
    setEdicion(null)
  }

  function editarGasto(cambios: Partial<Gasto>) {
    if (edicion?.movimiento.tipo !== "gasto") return
    setEdicion({ ...edicion, movimiento: { ...edicion.movimiento, ...cambios } })
  }

  function editarTransferencia(cambios: Partial<Transferencia>) {
    if (edicion?.movimiento.tipo !== "transferencia") return
    setEdicion({ ...edicion, movimiento: { ...edicion.movimiento, ...cambios } })
  }

  function editarParticipante(persona: Persona, checked: boolean) {
    if (edicion?.movimiento.tipo !== "gasto") return
    editarGasto({ participantes: checked ? [...edicion.movimiento.participantes, persona] : edicion.movimiento.participantes.filter((item) => item !== persona) })
  }

  return (
    <main className="app-bg">
      <Toaster richColors position="top-center" />
      <div className="app-grid">
        <div className="app-panel">
          <header className="app-header">
            <span />
            <h1>Repartir gastos</h1>
            <Dialog>
              <DialogTrigger asChild>
                <button aria-label="Limpiar datos" type="button">
                  <BrushCleaningIcon />
                </button>
              </DialogTrigger>
              <DialogContent>
                <DialogTitle>Limpiar datos</DialogTitle>
                <DialogDescription>Esto elimina todos los datos ingresados hasta el momento.</DialogDescription>
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
                <p className="tab-hint">Cargá un gasto y entre quiénes se reparte.</p>
                <label>
                  <Input placeholder="Descripción (cena, hotel, ...)" value={gasto.descripcion} onChange={(event) => setGasto({ ...gasto, descripcion: event.target.value })} />
                </label>
                <label>
                  <Input inputMode="decimal" min="0" placeholder="Total" type="number" value={gasto.monto} onChange={(event) => setGasto({ ...gasto, monto: event.target.value })} />
                </label>
                <label>
                  <Select value={gasto.pagador} onValueChange={(pagador) => setGasto({ ...gasto, pagador })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Quién pagó" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {personas.map((persona) => <SelectItem key={persona} value={persona}>{persona}</SelectItem>)}
                      </SelectGroup>
                    </SelectContent>
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
                <p className="tab-hint">Registrá un pago realizado.</p>
                <label>
                  <Input placeholder="Descripción (cena, hotel, ...)" value={transferencia.descripcion} onChange={(event) => setTransferencia({ ...transferencia, descripcion: event.target.value })} />
                </label>
                <label>
                  <Input inputMode="decimal" min="0" placeholder="Total" type="number" value={transferencia.monto} onChange={(event) => setTransferencia({ ...transferencia, monto: event.target.value })} />
                </label>
                <label>
                  <Select value={transferencia.de} onValueChange={(de) => setTransferencia({ ...transferencia, de })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Origen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {personas.map((persona) => <SelectItem key={persona} value={persona}>{persona}</SelectItem>)}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </label>
                <label>
                  <Select value={transferencia.a} onValueChange={(a) => setTransferencia({ ...transferencia, a })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Destino" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {personas.map((persona) => <SelectItem key={persona} value={persona}>{persona}</SelectItem>)}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </label>
                <Button className="add-movement" onClick={agregarTransferencia} type="button">
                  <PlusIcon data-icon="inline-start" />
                  Registrar pago realizado
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
                    <button className="movement-edit" onClick={() => abrirEdicion(index, movimiento)} type="button">
                      <span className="movement-copy">
                        <strong>{nombreMovimiento(movimiento)}</strong>
                        {movimiento.tipo === "gasto" ? (
                          <span className="movement-label">
                            Pagó {movimiento.pagador} <span aria-hidden="true">•</span>
                            <SlidingNames names={movimiento.participantes.join(", ")} />
                          </span>
                        ) : (
                          <span>{movimiento.de} pagó {formatoARS.format(movimiento.monto)} a {movimiento.a}</span>
                        )}
                      </span>
                    </button>
                    <strong className="movement-amount">{formatoARS.format(movimiento.monto)}</strong>
                    <button aria-label="Eliminar movimiento" onClick={() => setMovimientos(movimientos.filter((_, item) => item !== index))} type="button">
                      <Trash2Icon />
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
            <Dialog open={edicion !== null} onOpenChange={(open) => !open && setEdicion(null)}>
              <DialogContent>
                <DialogTitle>Editar movimiento</DialogTitle>
                <DialogDescription>Cambia los datos de este movimiento</DialogDescription>
                <form className="edit-form" onSubmit={(event) => { event.preventDefault(); aceptarEdicion() }}>
                  <Input autoFocus placeholder="Nombre" value={edicion?.movimiento.descripcion ?? ""} onChange={(event) => setEdicion(edicion ? { ...edicion, movimiento: { ...edicion.movimiento, descripcion: event.target.value } } : null)} />
                  <Input inputMode="decimal" min="0" placeholder="Total" type="number" value={edicion?.monto ?? ""} onChange={(event) => setEdicion(edicion ? { ...edicion, monto: event.target.value } : null)} />
                  {edicion?.movimiento.tipo === "gasto" ? (
                    <>
                      <Select value={edicion.movimiento.pagador} onValueChange={(pagador) => editarGasto({ pagador })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Quién pagó" />
                        </SelectTrigger>
                        <SelectContent className="edit-select-content">
                          <SelectGroup>
                            {personas.map((persona) => <SelectItem key={persona} value={persona}>{persona}</SelectItem>)}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button className="select-like" type="button">
                            {edicion.movimiento.participantes.length === personas.length ? "Todos los seleccionados" : `${edicion.movimiento.participantes.length} seleccionados`}
                            <ChevronDownIcon data-icon="inline-end" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="participants-menu edit-participants-menu">
                          <DropdownMenuLabel>Participantes</DropdownMenuLabel>
                          <DropdownMenuSeparator className="dropdown-separator" />
                          <DropdownMenuGroup>
                            {personas.map((persona) => (
                              <DropdownMenuCheckboxItem
                                checked={edicion.movimiento.tipo === "gasto" && edicion.movimiento.participantes.includes(persona)}
                                key={persona}
                                onCheckedChange={(checked) => editarParticipante(persona, checked)}
                              >
                                {persona}
                              </DropdownMenuCheckboxItem>
                            ))}
                          </DropdownMenuGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </>
                  ) : null}
                  {edicion?.movimiento.tipo === "transferencia" ? (
                    <>
                      <Select value={edicion.movimiento.de} onValueChange={(de) => editarTransferencia({ de })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Origen" />
                        </SelectTrigger>
                        <SelectContent className="edit-select-content">
                          <SelectGroup>
                            {personas.map((persona) => <SelectItem key={persona} value={persona}>{persona}</SelectItem>)}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                      <Select value={edicion.movimiento.a} onValueChange={(a) => editarTransferencia({ a })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Destino" />
                        </SelectTrigger>
                        <SelectContent className="edit-select-content">
                          <SelectGroup>
                            {personas.map((persona) => <SelectItem key={persona} value={persona}>{persona}</SelectItem>)}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </>
                  ) : null}
                  <div className="dialog-actions">
                    <DialogClose asChild>
                      <Button className="btn-outline" type="button">Cancelar</Button>
                    </DialogClose>
                    <Button type="submit">Aceptar</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </section>

        </div>

        <aside className="desktop-summary">
          <Card className="summary-card">
            <div className="summary-head">
              <h2>Resumen por persona</h2>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="btn-outline" type="button">
                    <CalculatorIcon data-icon="inline-start" />
                    Cálculos
                  </Button>
                </DialogTrigger>
                <DialogContent className="calculations-dialog">
                  <Card className="calculations-card">
                    <div className="calculations-head">
                      <div>
                        <DialogTitle>Cálculos hechos</DialogTitle>
                        <DialogDescription>Para revisar las cuentas hechas.</DialogDescription>
                      </div>
                      <Badge>{movimientos.length} movimientos</Badge>
                    </div>
                    <Separator />
                    <ScrollArea className="calculations-scroll">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Movimiento</TableHead>
                            {personas.map((persona) => <TableHead className="number" key={persona}>{persona}</TableHead>)}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {matrizCalculos.map((fila) => (
                            <TableRow key={fila.paso}>
                              <TableCell>{fila.movimiento} <strong className="calculation-movement-amount">({formatoARS.format(fila.monto)})</strong></TableCell>
                              {personas.map((persona) => {
                                const saldo = fila.saldos[persona] ?? 0
                                const estadoSaldo = saldo > 0 ? "amount-positive" : saldo < 0 ? "amount-negative" : "amount-zero"
                                return <TableCell className={`number ${estadoSaldo}${persona === fila.personaDestacada ? " amount-highlight" : ""}`} key={persona}>{formatoSaldoMatriz(saldo)}</TableCell>
                              })}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </Card>
                </DialogContent>
              </Dialog>
            </div>
            <div className="summary-list">
              {saldos.length === 0 ? <p className="empty">Agregá personas para ver saldos.</p> : null}
              {saldos.map((saldo) => {
                const resumen = getResumenPersona(saldo.persona, movimientos)
                const fecha = new Intl.DateTimeFormat("es-AR", { dateStyle: "short", timeStyle: "short" }).format(new Date())
                const estado = Math.round(resumen.saldo * 100) < 0 ? "negative" : Math.round(resumen.saldo * 100) > 0 ? "positive" : "neutral"
                const pendiente = Math.round(resumen.saldo * 100) > 0 ? "Debe recibir" : Math.round(resumen.saldo * 100) < 0 ? "Debe pagar" : "Está al día"

                return (
                  <Dialog key={saldo.persona}>
                    <DialogTrigger asChild>
                      <button className="summary-person" type="button">
                        <div className={resumen.saldo > 0 ? "avatar avatar-positive" : "avatar"}>{saldo.persona[0].toUpperCase()}</div>
                        <strong>{saldo.persona}</strong>
                        <div className="summary-balance">
                          <span className={resumen.saldo > 0 ? "positive" : resumen.saldo < 0 ? "negative" : ""}>{formatoARS.format(resumen.saldo)}</span>
                          <small>Pendiente</small>
                        </div>
                      </button>
                    </DialogTrigger>
                    <DialogContent className="receipt-dialog">
                      <div className="receipt">
                        <header className="receipt-head">
                          <span className="receipt-avatar">{iniciales(saldo.persona)}</span>
                          <div>
                            <DialogTitle>Resumen de {saldo.persona}</DialogTitle>
                            <DialogDescription>Generado el {fecha}</DialogDescription>
                          </div>
                          <Button className="btn-outline receipt-copy" onClick={() => navigator.clipboard.writeText(textoResumenPersona(resumen)).then(() => toast.success("Resumen copiado."))} type="button">
                            <CopyIcon data-icon="inline-start" />
                            Copiar resumen
                          </Button>
                        </header>
                        <Separator />
                        {!resumen.tieneMovimientos ? (
                          <p className="empty">{saldo.persona} todavía no tiene movimientos.</p>
                        ) : (
                          <>
                            <Card className={`receipt-result receipt-result-${estado}`}>
                              <strong>{resultadoPersona(saldo.persona, resumen.saldo)}</strong>
                            </Card>
                            <div className="receipt-table">
                              <div><UsersIcon data-icon="inline-start" /><span>Le tocaba gastar</span><small></small><strong>{formatoARS.format(resumen.totalLeTocaba)}</strong></div>
                              <div><WalletCardsIcon data-icon="inline-start" /><span>Ya salió de su bolsillo</span><small></small><strong>{formatoARS.format(resumen.totalSalioBolsillo)}</strong></div>
                              <div><ArrowDownLeftIcon data-icon="inline-start" /><span>Ya recibió</span><small></small><strong>{formatoARS.format(resumen.totalRecibido)}</strong></div>
                              <div className="receipt-balance"><span>Resultado final</span><small>{pendiente}</small><strong className={estado}>{formatoARS.format(Math.abs(resumen.saldo))}</strong></div>
                            </div>
                            <Separator />
                            <Accordion className="receipt-detail" collapsible type="single">
                              <AccordionItem value="detalle">
                                <AccordionTrigger>Detalle</AccordionTrigger>
                                <AccordionContent>
                                  <div className="receipt-detail-list">
                                      <section>
                                        <h3><ReceiptTextIcon data-icon="inline-start" />Gastos donde participó <strong>{formatoARS.format(resumen.totalLeTocaba)}</strong></h3>
                                        {resumen.gastosDondeParticipo.map(({ movimiento, montoParte }, index) => <p key={`participado-${index}`}>{nombreMovimiento(movimiento)} <span>le tocaba {formatoARS.format(montoParte)} de {formatoARS.format(movimiento.monto)}</span></p>)}
                                      </section>
                                      <section>
                                        <h3><WalletCardsIcon data-icon="inline-start" />Gastos que pagó <strong>{formatoARS.format(resumen.totalPuesto)}</strong></h3>
                                        {resumen.gastosQuePago.map((movimiento, index) => <p key={`pagado-${index}`}>{nombreMovimiento(movimiento)} <span>puso {formatoARS.format(movimiento.monto)}</span></p>)}
                                      </section>
                                      <section>
                                        <h3><ArrowUpRightIcon data-icon="inline-start" />Pagos realizados <strong>{formatoARS.format(resumen.totalTransferido)}</strong></h3>
                                        {resumen.transferenciasEnviadas.map((movimiento, index) => <p key={`enviada-${index}`}>Pagó a {movimiento.a} <span>{formatoARS.format(movimiento.monto)}</span></p>)}
                                      </section>
                                      <section>
                                        <h3><ArrowDownLeftIcon data-icon="inline-start" />Pagos recibidos <strong>{formatoARS.format(resumen.totalRecibido)}</strong></h3>
                                        {resumen.transferenciasRecibidas.map((movimiento, index) => <p key={`recibida-${index}`}>Recibió de {movimiento.de} <span>{formatoARS.format(movimiento.monto)}</span></p>)}
                                      </section>
                                  </div>
                                </AccordionContent>
                              </AccordionItem>
                            </Accordion>
                          </>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                )
              })}
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
                    <SlidingSettlement key={`${transferencia.de}-${transferencia.a}-${transferencia.monto}`}>
                      <div className="settlement-line">
                        <span className="avatar">{transferencia.de[0].toUpperCase()}</span>
                        <span>{transferencia.de}</span>
                        <span>→</span>
                        <span className="avatar avatar-positive">{transferencia.a[0].toUpperCase()}</span>
                        <span>{transferencia.a}</span>
                        <strong>{formatoARS.format(transferencia.monto)}</strong>
                      </div>
                    </SlidingSettlement>
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
