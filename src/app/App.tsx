import { ArrowUpRightIcon, ChevronDownIcon, CopyIcon, PlusIcon, ShareIcon } from "lucide-react"
import { driver } from "driver.js"
import type { DriveStep, Driver } from "driver.js"
import { useEffect, useMemo, useRef, useState } from "react"
import { toast, Toaster } from "sonner"
import "driver.js/dist/driver.css"
import { DesktopLayout } from "./DesktopLayout"
import { Header } from "./Header"
import { MobileLayout } from "./MobileLayout"
import { BottomNavigation } from "../components/navigation/BottomNavigation"
import { CategoriaIcon } from "../components/shared/CategoryBadge"
import { PersonasSection } from "../sections/personas/PersonasSection"
import { MovimientoItem } from "../sections/movimientos/MovimientoItem"
import { ResumenSection } from "../sections/resumen/ResumenSection"
import { CategoryChartShareCard } from "../sections/total/CategoryChart"
import { TotalSection } from "../sections/total/TotalSection"
import { calcularSaldos, calcularTransferenciasPendientes, getGastosPorCategoria, getMatrizCalculos, getResumenPersona } from "../lib/calculos"
import { CATEGORIAS_GASTO, CATEGORIA_DEFAULT, getCategoriaOrden } from "../lib/categorias"
import { descargarImagen, toPngDataUrl } from "../lib/export-image"
import { formatoARS, porcentaje } from "../lib/money"
import { nombreMovimiento, textoCategorias, textoMovimientos, textoResumenPersona } from "../lib/share-text"
import { isMobileViewport, useIsMobile } from "../lib/viewport"
import { cloneTutorialState, getTutorialElement, hideTutorialForever, nextPaint, tutorialHidden, tutorialStepsConfig } from "./tutorial"
import type { MobileSection } from "./tutorial"
import { Button, Checkbox, Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle, DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuGroup, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, Input, Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue, Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui"
import { clearState, loadState, saveState } from "../lib/storage"
import type { AppState, CategoriaGasto, Movimiento, Persona } from "../types"

const sinSeleccion = ""
type Gasto = Extract<Movimiento, { tipo: "gasto" }>
type Transferencia = Extract<Movimiento, { tipo: "transferencia" }>

export default function App() {
  const [personas, setPersonas] = useState<Persona[]>(() => loadState().personas)
  const [movimientos, setMovimientos] = useState<Movimiento[]>(() => loadState().movimientos)
  const [nombre, setNombre] = useState("")
  const [gasto, setGasto] = useState({ descripcion: "", pagador: sinSeleccion, monto: "", participantes: [] as Persona[], categoria: CATEGORIA_DEFAULT })
  const [transferencia, setTransferencia] = useState({ descripcion: "", de: sinSeleccion, a: sinSeleccion, monto: "" })
  const [edicion, setEdicion] = useState<{ index: number; movimiento: Movimiento; monto: string } | null>(null)
  const [detalleResumenAbierto, setDetalleResumenAbierto] = useState("")
  const [activeSection, setActiveSection] = useState<MobileSection>("personas")
  const [tutorialDialogOpen, setTutorialDialogOpen] = useState(() => !tutorialHidden())
  const [hideTutorial, setHideTutorial] = useState(false)
  const [settlementOpen, setSettlementOpen] = useState(false)
  const [resumenOpenPersona, setResumenOpenPersona] = useState<Persona | null>(null)
  const [calculosOpen, setCalculosOpen] = useState(false)
  const [graficoOpen, setGraficoOpen] = useState(false)
  const exportCategoriasRef = useRef<HTMLDivElement | null>(null)
  const calculosRef = useRef<HTMLDivElement | null>(null)
  const tutorialDriverRef = useRef<Driver | null>(null)
  const tutorialPreviousStateRef = useRef<AppState | null>(null)

  useEffect(() => saveState({ personas, movimientos }), [personas, movimientos])
  useEffect(() => () => tutorialDriverRef.current?.destroy(), [])

  const movimientosCard = useMemo(
    () => movimientos
      .map((movimiento, index) => ({ movimiento, index }))
      .sort((a, b) => {
        if (a.movimiento.tipo !== b.movimiento.tipo) return Number(a.movimiento.tipo === "transferencia") - Number(b.movimiento.tipo === "transferencia")
        if (a.movimiento.tipo === "transferencia" || b.movimiento.tipo === "transferencia") return a.index - b.index
        return getCategoriaOrden(a.movimiento.categoria) - getCategoriaOrden(b.movimiento.categoria) || a.movimiento.monto - b.movimiento.monto || a.index - b.index
      }),
    [movimientos],
  )
  const saldos = useMemo(() => calcularSaldos(personas, movimientos), [personas, movimientos])
  const matrizCalculos = useMemo(() => getMatrizCalculos(personas, movimientosCard.map((item) => item.movimiento)), [personas, movimientosCard])
  const gastosPorCategoria = useMemo(() => getGastosPorCategoria(movimientos), [movimientos])
  const pendientes = useMemo(() => calcularTransferenciasPendientes(saldos), [saldos])
  const totalGastado = saldos.reduce((total, saldo) => total + saldo.totalPagadoEnGastos, 0)
  const promedio = personas.length ? totalGastado / personas.length : 0
  const fechaCategorias = new Intl.DateTimeFormat("es-AR", { dateStyle: "short", timeStyle: "short" }).format(new Date())
  const firmaResumen = "💲 Resumen hecho con https://germanmorini.github.io/repartir-gastos/"
  const resumenCopiable = pendientes.length
    ? `Esto es lo que debe cada uno:\n${pendientes.map((t) => `- ${t.de} transfiere ${formatoARS.format(t.monto)} a ${t.a}`).join("\n")}\n\n${firmaResumen}`
    : `Esto es lo que debe cada uno:\nLas cuentas ya están equilibradas.\n\n${firmaResumen}`
  const isMobile = useIsMobile()
  const Layout = isMobile ? MobileLayout : DesktopLayout

  function irASeccion(seccion: MobileSection) {
    setActiveSection(seccion)
    if (matchMedia("(max-width: 719px)").matches) window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const vistaMobile = (seccion: MobileSection) => `mobile-view ${activeSection === seccion ? "is-active" : ""}`
  const mostrarSeccion = (seccion: MobileSection) => !isMobile || activeSection === seccion

  function cerrarTutorialDialog(open: boolean) {
    if (open) {
      setTutorialDialogOpen(true)
      return
    }
    if (hideTutorial) hideTutorialForever()
    setTutorialDialogOpen(false)
  }

  function omitirTutorial() {
    if (hideTutorial) hideTutorialForever()
    setTutorialDialogOpen(false)
  }

  async function prepararPasoTutorial(index: number) {
    const step = tutorialStepsConfig[index]
    if (!step) return
    if (isMobileViewport()) {
      setActiveSection(step.section)
      window.scrollTo({ top: 0, behavior: "auto" })
    }
    setResumenOpenPersona(step.opensResumen ?? null)
    setCalculosOpen(Boolean(step.opensCalculos))
    setGraficoOpen(Boolean(step.opensGrafico))
    setSettlementOpen(Boolean(step.opensSettlement))
    await nextPaint()
  }

  function startTutorial() {
    const steps: DriveStep[] = tutorialStepsConfig.map((step) => ({
      element: () => getTutorialElement(step),
      popover: {
        title: step.title,
        description: step.description,
        side: "bottom",
        align: "center",
      },
    }))
    let moving = false
    let guide: Driver

    const moveTo = async (index: number, start = false) => {
      if (moving) return
      moving = true
      try {
        await prepararPasoTutorial(index)
        if (start) guide.drive(index)
        else guide.moveTo(index)
      } finally {
        moving = false
      }
    }

    guide = driver({
      steps,
      showProgress: true,
      progressText: "{{current}} de {{total}}",
      nextBtnText: "Siguiente",
      prevBtnText: "Anterior",
      doneBtnText: "Finalizar",
      showButtons: ["previous", "next", "close"],
      popoverClass: "app-driver-popover",
      stagePadding: 8,
      stageRadius: 10,
      onNextClick: (_element, _step, { driver: driverObj }) => {
        const nextIndex = (driverObj.getActiveIndex() ?? 0) + 1
        if (nextIndex >= steps.length) {
          driverObj.destroy()
          return
        }
        void moveTo(nextIndex)
      },
      onPrevClick: (_element, _step, { driver: driverObj }) => {
        const prevIndex = (driverObj.getActiveIndex() ?? 0) - 1
        if (prevIndex < 0) return
        void moveTo(prevIndex)
      },
      onCloseClick: (_element, _step, { driver: driverObj }) => driverObj.destroy(),
      onDoneClick: (_element, _step, { driver: driverObj }) => driverObj.destroy(),
      onDestroyed: () => {
        const previousState = tutorialPreviousStateRef.current
        if (previousState) {
          setPersonas(previousState.personas)
          setMovimientos(previousState.movimientos)
          saveState(previousState)
          tutorialPreviousStateRef.current = null
        }
        setSettlementOpen(false)
        setResumenOpenPersona(null)
        setCalculosOpen(false)
        setGraficoOpen(false)
        tutorialDriverRef.current = null
      },
    })

    tutorialDriverRef.current = guide
    void moveTo(0, true)
  }

  async function iniciarTutorialConMockup() {
    tutorialPreviousStateRef.current = { personas: [...personas], movimientos: movimientos.map((movimiento) => (
      movimiento.tipo === "gasto" ? { ...movimiento, participantes: [...movimiento.participantes] } : { ...movimiento }
    )) }
    const state = cloneTutorialState()
    saveState(state)
    setPersonas(state.personas)
    setMovimientos(state.movimientos)
    setGasto({ descripcion: "", pagador: sinSeleccion, monto: "", participantes: [], categoria: CATEGORIA_DEFAULT })
    setTransferencia({ descripcion: "", de: sinSeleccion, a: sinSeleccion, monto: "" })
    setActiveSection("personas")
    setSettlementOpen(false)
    setResumenOpenPersona(null)
    setCalculosOpen(false)
    setGraficoOpen(false)
    setTutorialDialogOpen(false)
    await nextPaint()
    startTutorial()
  }

  async function aceptarTutorial() {
    if (hideTutorial) hideTutorialForever()
    await iniciarTutorialConMockup()
  }

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
      movimientos
        .filter((movimiento) => (movimiento.tipo === "gasto" ? movimiento.pagador !== persona : movimiento.de !== persona && movimiento.a !== persona))
        .map((movimiento) => (movimiento.tipo === "gasto" ? { ...movimiento, participantes: movimiento.participantes.filter((item) => item !== persona) } : movimiento))
        .filter((movimiento) => movimiento.tipo === "transferencia" || movimiento.participantes.length > 0),
    )
  }

  function agregarGasto() {
    const monto = Number(gasto.monto)
    if (!gasto.pagador) return toast.error("Elegí quién pagó.")
    if (!Number.isFinite(monto) || monto <= 0) return toast.error("El monto debe ser positivo.")
    if (gasto.participantes.length === 0) return toast.error("Elegí al menos un participante.")
    setMovimientos([...movimientos, { tipo: "gasto", descripcion: gasto.descripcion.trim(), pagador: gasto.pagador, monto, participantes: gasto.participantes, categoria: gasto.categoria }])
    setGasto({ descripcion: "", pagador: gasto.pagador, monto: "", participantes: personas, categoria: gasto.categoria })
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
    setGasto({ descripcion: "", pagador: sinSeleccion, monto: "", participantes: [], categoria: CATEGORIA_DEFAULT })
    setTransferencia({ descripcion: "", de: sinSeleccion, a: sinSeleccion, monto: "" })
  }

  async function compartirMovimientos() {
    const texto = textoMovimientos(personas, movimientos)
    try {
      if (isMobileViewport() && navigator.share) {
        await navigator.share({ title: "Movimientos", text: texto })
        toast.success("Movimientos compartidos.")
        return
      }
      await navigator.clipboard.writeText(texto)
      toast.success("Movimientos copiados.")
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return
      toast.error("No se pudieron compartir los movimientos.")
    }
  }

  async function exportarGraficoComoImagen() {
    if (!exportCategoriasRef.current) return
    try {
      const dataUrl = await toPngDataUrl(exportCategoriasRef.current)
      const blob = await fetch(dataUrl).then((respuesta) => respuesta.blob())
      const file = new File([blob], "gastos-por-categoria.png", { type: "image/png" })

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ title: "Gastos por categoría", text: "Resumen de gastos por categoría", files: [file] })
      } else {
        descargarImagen(dataUrl, "gastos-por-categoria.png")
      }
      toast.success("Imagen exportada.")
    } catch {
      toast.error("No se pudo exportar la imagen.")
    }
  }

  async function exportarCalculosComoImagen() {
    if (!calculosRef.current) return
    try {
      calculosRef.current.classList.add("is-exporting")
      const dataUrl = await toPngDataUrl(calculosRef.current)
      const nombreArchivo = "matriz-de-calculos.png"
      if (matchMedia("(max-width: 719px)").matches) {
        const blob = await fetch(dataUrl).then((respuesta) => respuesta.blob())
        const file = new File([blob], nombreArchivo, { type: "image/png" })
        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({ title: "Matriz de cálculos", files: [file] })
        } else {
          descargarImagen(dataUrl, nombreArchivo)
        }
      } else {
        descargarImagen(dataUrl, nombreArchivo)
      }
      toast.success("Imagen exportada.")
    } catch {
      toast.error("No se pudo exportar la imagen.")
    } finally {
      calculosRef.current?.classList.remove("is-exporting")
    }
  }

  async function compartirResumenReparto() {
    try {
      if (isMobileViewport() && navigator.share) {
        await navigator.share({ title: "Resumen de reparto", text: resumenCopiable })
        toast.success("Resumen compartido.")
        return
      }
      await navigator.clipboard.writeText(resumenCopiable)
      toast.success("Resumen copiado.")
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return
      toast.error("No se pudo compartir el resumen.")
    }
  }

  async function compartirResumenPersona(resumen: ReturnType<typeof getResumenPersona>) {
    const texto = textoResumenPersona(resumen)
    try {
      if (isMobileViewport() && navigator.share) {
        await navigator.share({ title: "Resumen de liquidación", text: texto })
        toast.success("Resumen compartido.")
        return
      }
      await navigator.clipboard.writeText(texto)
      toast.success("Resumen copiado.")
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return
      toast.error("No se pudo compartir el resumen.")
    }
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
      <Dialog open={tutorialDialogOpen} onOpenChange={cerrarTutorialDialog}>
        <DialogContent className="tutorial-dialog">
          <DialogTitle>¿Primera vez usando la app?</DialogTitle>
          <DialogDescription>Podés hacer un tutorial guiado para no perderte.</DialogDescription>
          <label className="tutorial-checkbox" htmlFor="hide-tutorial">
            <Checkbox checked={hideTutorial} id="hide-tutorial" onCheckedChange={setHideTutorial} />
            No mostrar más
          </label>
          <div className="dialog-actions">
            <Button className="btn-outline" onClick={omitirTutorial} type="button">Ahora no</Button>
            <Button onClick={() => void aceptarTutorial()} type="button">Aceptar</Button>
          </div>
        </DialogContent>
      </Dialog>
      <div className="export-offscreen">
        <div ref={exportCategoriasRef}>
          <CategoryChartShareCard data={gastosPorCategoria} fecha={fechaCategorias} total={totalGastado} />
        </div>
      </div>
      <Header onClear={limpiarTodo} />

      <Layout>
        <div className="app-panel">

          {mostrarSeccion("personas") ? (
            <PersonasSection
              className={vistaMobile("personas")}
              personas={personas}
              nombre={nombre}
              onNombreChange={setNombre}
              onAdd={agregarPersona}
              onDelete={borrarPersona}
              onStartTutorial={() => void iniciarTutorialConMockup()}
            />
          ) : null}

          {mostrarSeccion("movimientos") ? <section className={`app-section movement-form ${vistaMobile("movimientos")}`} id="movimientos" data-tour="movimientos">
            <div className="section-head movement-form-head">
              <div className="section-title section-title-movements">
                <span className="section-icon"><ArrowUpRightIcon /></span>
                <div>
                  <h2>Movimientos</h2>
                  <p>Registrá gastos y transferencias.</p>
                </div>
              </div>
              <div className="movement-head-actions">
                <span className="muted">{movimientos.length} movimientos</span>
                <Button className="movement-copy-button movement-copy-desktop" data-tour="copy-movimientos-desktop" onClick={() => navigator.clipboard.writeText(textoMovimientos(personas, movimientos)).then(() => toast.success("Movimientos copiados."))} type="button">
                  <CopyIcon data-icon="inline-start" />
                  Copiar movimientos
                </Button>
              </div>
            </div>
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
                        {gasto.participantes.length === 0 ? "Participantes" : gasto.participantes.length === personas.length ? "Todos los seleccionados" : `${gasto.participantes.length} seleccionados`}
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
                      <Button className="menu-action" onClick={() => setGasto({ ...gasto, participantes: gasto.participantes.length === personas.length ? [] : personas })} type="button">
                        {gasto.participantes.length === personas.length ? "Deseleccionar todos" : "Seleccionar todos"}
                      </Button>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </label>
                <div className="add-expense-row">
                  <Select value={gasto.categoria} onValueChange={(categoria) => setGasto({ ...gasto, categoria: categoria as CategoriaGasto })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Categoría" />
                    </SelectTrigger>
                    <SelectContent>
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
                  <Button className="add-movement" onClick={agregarGasto} type="button">
                    <PlusIcon data-icon="inline-start" />
                    Añadir gasto
                  </Button>
                </div>
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
                  Registrar transferencia
                </Button>
              </TabsContent>
            </Tabs>
          </section> : null}

          {mostrarSeccion("movimientos") ? <section className={`app-section movements-section ${vistaMobile("movimientos")}`}>
            <div className="section-head">
              <h2>Listado</h2>
            </div>
            <p className="movement-hint">
              <span className="hint-mobile">Tocá en un movimiento para editarlo.</span>
              <span className="hint-desktop">Clickeá en un movimiento para editarlo.</span>
            </p>
            {movimientos.length === 0 ? <p className="empty">Todavía no hay movimientos.</p> : null}
            {movimientos.length > 0 ? (
              <div className="movement-list">
                {movimientosCard.map(({ movimiento, index }) => (
                  <MovimientoItem
                    key={`${movimiento.tipo}-${index}`}
                    movimiento={movimiento}
                    index={index}
                    onEdit={abrirEdicion}
                    onDelete={(item) => setMovimientos(movimientos.filter((_, movimientoIndex) => movimientoIndex !== item))}
                    nombreMovimiento={nombreMovimiento}
                  />
                ))}
              </div>
            ) : null}
            {movimientos.length > 0 ? (
              <Button className="movement-copy-button movement-copy-mobile" data-tour="copy-movimientos-mobile" onClick={() => void compartirMovimientos()} type="button">
                <ShareIcon data-icon="inline-start" />
                Compartir
              </Button>
            ) : null}
            <Dialog open={edicion !== null} onOpenChange={(open) => !open && setEdicion(null)}>
              <DialogContent className="edit-dialog">
                <DialogTitle>Editar movimiento</DialogTitle>
                <DialogDescription>Cambia los datos de este movimiento</DialogDescription>
                <form className="edit-form" onSubmit={(event) => { event.preventDefault(); aceptarEdicion() }}>
                  <label className="edit-field">
                    <span>Nombre</span>
                    <Input placeholder="Nombre" value={edicion?.movimiento.descripcion ?? ""} onChange={(event) => setEdicion(edicion ? { ...edicion, movimiento: { ...edicion.movimiento, descripcion: event.target.value } } : null)} />
                  </label>
                  <label className="edit-field">
                    <span>Total</span>
                    <Input inputMode="decimal" min="0" placeholder="Total" type="number" value={edicion?.monto ?? ""} onChange={(event) => setEdicion(edicion ? { ...edicion, monto: event.target.value } : null)} />
                  </label>
                  {edicion?.movimiento.tipo === "gasto" ? (
                    <>
                      <div className="edit-field">
                        <span>Pagó</span>
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
                      </div>
                      <div className="edit-field">
                        <span>Categoría</span>
                        <Select value={edicion.movimiento.categoria} onValueChange={(categoria) => editarGasto({ categoria: categoria as CategoriaGasto })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Categoría" />
                          </SelectTrigger>
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
                                <DropdownMenuCheckboxItem
                                  checked={edicion.movimiento.tipo === "gasto" && edicion.movimiento.participantes.includes(persona)}
                                  key={persona}
                                  onCheckedChange={(checked) => editarParticipante(persona, checked)}
                                >
                                  {persona}
                                </DropdownMenuCheckboxItem>
                              ))}
                            </DropdownMenuGroup>
                            <DropdownMenuSeparator className="dropdown-separator" />
                            <Button className="menu-action" onClick={() => edicion.movimiento.tipo === "gasto" && editarGasto({ participantes: edicion.movimiento.participantes.length === personas.length ? [] : personas })} type="button">
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
                      </div>
                      <div className="edit-field">
                        <span>Destino</span>
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
                      </div>
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
          </section> : null}

        </div>

        <aside className="desktop-summary">
          {mostrarSeccion("resumen") ? (
            <ResumenSection
              calculosOpen={calculosOpen}
              calculosRef={calculosRef}
              className={vistaMobile("resumen")}
              detalleResumenAbierto={detalleResumenAbierto}
              matrizCalculos={matrizCalculos}
              movimientos={movimientos}
              onCalculosOpenChange={setCalculosOpen}
              onDetalleResumenAbiertoChange={setDetalleResumenAbierto}
              onExportCalculos={() => void exportarCalculosComoImagen()}
              onResumenOpenPersonaChange={setResumenOpenPersona}
              onShareResumenPersona={(resumen) => void compartirResumenPersona(resumen)}
              personas={personas}
              resumenOpenPersona={resumenOpenPersona}
              saldos={saldos}
            />
          ) : null}

          {mostrarSeccion("total") ? (
            <TotalSection
              className={vistaMobile("total")}
              gastosPorCategoria={gastosPorCategoria}
              graficoOpen={graficoOpen}
              onCopyCategorias={() => navigator.clipboard.writeText(textoCategorias(totalGastado, gastosPorCategoria, porcentaje)).then(() => toast.success("Resumen copiado."))}
              onExportGrafico={() => void exportarGraficoComoImagen()}
              onGraficoOpenChange={setGraficoOpen}
              onSettlementOpenChange={setSettlementOpen}
              onShareReparto={() => void compartirResumenReparto()}
              pendientes={pendientes}
              promedio={promedio}
              resumenCopiable={resumenCopiable}
              settlementOpen={settlementOpen}
              totalGastado={totalGastado}
            />
          ) : null}
        </aside>
      </Layout>
      <footer className={`site-footer ${activeSection === "total" ? "is-mobile-visible" : ""}`}>
        ¿Te gustó la aplicación? Seguime en <a href="https://github.com/GermanMorini/repartir-gastos" rel="noreferrer" target="_blank">github</a>
      </footer>
      <BottomNavigation activeSection={activeSection} onChange={irASeccion} />
    </main>
  )
}
