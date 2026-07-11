import { ArrowLeftIcon, ArrowLeftRightIcon, CalculatorIcon, ChevronDownIcon, CopyIcon, DownloadIcon, PieChartIcon, PlusIcon, ReceiptTextIcon, ShareIcon, ShredderIcon } from "lucide-react"
import { driver } from "driver.js"
import type { DriveStep, Driver } from "driver.js"
import { useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"
import "driver.js/dist/driver.css"
import "./desktop-fixes.css"
import "./tutorial-demo.css"
import { DesktopWorkspace } from "./DesktopWorkspace"
import { Header } from "./Header"
import { MobileLayout } from "./MobileLayout"
import { BottomNavigation } from "../components/navigation/BottomNavigation"
import { ConfirmDialog } from "../components/shared/ConfirmDialog"
import { CategoriaIcon } from "../components/shared/CategoryBadge"
import { PaginationControls } from "../components/shared/PaginationControls"
import { PersonSummaryMobilePage } from "../features/person-summary/PersonSummary"
import { SharePage } from "../features/share/SharePage"
import { encodeShareState } from "../features/share/encodeShare"
import { EditMovimientoDialog } from "../sections/movimientos/EditMovimientoDialog"
import { PersonasSection } from "../sections/personas/PersonasSection"
import { MovimientoItem } from "../sections/movimientos/MovimientoItem"
import { ResumenSection } from "../sections/resumen/ResumenSection"
import { CategoryChartShareCard, CategoryDetailList, CategoryPie } from "../sections/total/CategoryChart"
import { calcularSaldos, calcularTransferenciasPendientes, getGastosPorCategoria, getMatrizCalculos, getResumenPersona } from "../lib/calculos"
import { CATEGORIAS_GASTO, CATEGORIA_DEFAULT, getCategoriaOrden } from "../lib/categorias"
import { descargarImagen, toPngDataUrl } from "../lib/export-image"
import { formatoARS, formatoSaldoMatriz, porcentaje } from "../lib/money"
import { nombreMovimiento, textoCategorias, textoMovimientos, textoResumenPersona } from "../lib/share-text"
import { isMobileViewport, useIsMobile } from "../lib/viewport"
import { cloneTutorialState, getTutorialElement, getTutorialStepsConfig, hideTutorialForever, nextPaint, tutorialHidden } from "./tutorial"
import type { MobileSection } from "./tutorial"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuGroup, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Toaster } from "@/components/ui/sonner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { clearState, loadState, saveState } from "../lib/storage"
import type { AppState, CategoriaGasto, Movimiento, Persona } from "../types"

const sinSeleccion = ""
const mobileSectionOrder: MobileSection[] = ["personas", "movimientos", "resumen"]
type Gasto = Extract<Movimiento, { tipo: "gasto" }>
type Transferencia = Extract<Movimiento, { tipo: "transferencia" }>

export default function App() {
  const [hash, setHash] = useState(() => window.location.hash)

  useEffect(() => {
    const update = () => setHash(window.location.hash)
    window.addEventListener("hashchange", update)
    return () => window.removeEventListener("hashchange", update)
  }, [])

  if (hash.startsWith("#/share/")) return <SharePage payload={hash.slice("#/share/".length)} />
  return <EditableApp />
}

function EditableApp() {
  const [personas, setPersonas] = useState<Persona[]>(() => loadState().personas)
  const [movimientos, setMovimientos] = useState<Movimiento[]>(() => loadState().movimientos)
  const [nombre, setNombre] = useState("")
  const [gasto, setGasto] = useState({ descripcion: "", pagador: sinSeleccion, monto: "", participantes: [] as Persona[], categoria: CATEGORIA_DEFAULT })
  const [transferencia, setTransferencia] = useState({ descripcion: "", de: sinSeleccion, a: sinSeleccion, monto: "" })
  const [edicion, setEdicion] = useState<{ index: number; movimiento: Movimiento; monto: string } | null>(null)
  const [activeSection, setActiveSection] = useState<MobileSection>("personas")
  const [desktopSection, setDesktopSection] = useState<MobileSection>("personas")
  const [movementTab, setMovementTab] = useState<"gasto" | "transferencia">("gasto")
  const [mobileMovementPage, setMobileMovementPage] = useState(1)
  const [mobileMovementPageDirection, setMobileMovementPageDirection] = useState<"next" | "prev">("next")
  const [mobileMovementPageAnimating, setMobileMovementPageAnimating] = useState(false)
  const [sectionDirection, setSectionDirection] = useState<"forward" | "back">("forward")
  const [sectionAnimating, setSectionAnimating] = useState(false)
  const [mobileActionsOpen, setMobileActionsOpen] = useState(false)
  const [mobileMovementSheetOpen, setMobileMovementSheetOpen] = useState(false)
  const [mobileActionsView, setMobileActionsView] = useState<"menu" | "grafico" | "calculos">("menu")
  const [mobileActionsDirection, setMobileActionsDirection] = useState<"forward" | "back">("forward")
  const [mobileActionsPanelAnimating, setMobileActionsPanelAnimating] = useState(false)
  const [tutorialDialogOpen, setTutorialDialogOpen] = useState(() => !tutorialHidden())
  const [hideTutorial, setHideTutorial] = useState(false)
  const [settlementOpen, setSettlementOpen] = useState(false)
  const [resumenOpenPersona, setResumenOpenPersona] = useState<Persona | null>(null)
  const [resumenClosing, setResumenClosing] = useState(false)
  const [calculosOpen, setCalculosOpen] = useState(false)
  const [graficoOpen, setGraficoOpen] = useState(false)
  const [demoActiveTarget, setDemoActiveTarget] = useState<string | null>(null)
  const exportCategoriasRef = useRef<HTMLDivElement | null>(null)
  const calculosRef = useRef<HTMLDivElement | null>(null)
  const tutorialDriverRef = useRef<Driver | null>(null)
  const tutorialPreviousStateRef = useRef<AppState | null>(null)
  const tutorialCompletedDemosRef = useRef<Set<string>>(new Set())
  const resumenCloseTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null)
  const sectionAnimationTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null)
  const mobileMovementPageTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null)

  useEffect(() => saveState({ personas, movimientos }), [personas, movimientos])
  useEffect(() => () => {
    tutorialDriverRef.current?.destroy()
    if (resumenCloseTimerRef.current) window.clearTimeout(resumenCloseTimerRef.current)
    if (sectionAnimationTimerRef.current) window.clearTimeout(sectionAnimationTimerRef.current)
    if (mobileMovementPageTimerRef.current) window.clearTimeout(mobileMovementPageTimerRef.current)
  }, [])

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
  const mobileMovementTotalPages = Math.max(1, Math.ceil(movimientosCard.length / 3))
  const currentMobileMovementPage = Math.min(mobileMovementPage, mobileMovementTotalPages)
  const mobileMovimientos = movimientosCard.slice((currentMobileMovementPage - 1) * 3, currentMobileMovementPage * 3)
  const matrizCalculos = useMemo(() => getMatrizCalculos(personas, movimientosCard.map((item) => item.movimiento)), [personas, movimientosCard])
  const gastosPorCategoria = useMemo(() => getGastosPorCategoria(movimientos), [movimientos])
  const pendientes = useMemo(() => calcularTransferenciasPendientes(saldos), [saldos])
  const totalGastado = saldos.reduce((total, saldo) => total + saldo.totalPagadoEnGastos, 0)
  const promedio = personas.length ? totalGastado / personas.length : 0

  function abrirResumenPersona(persona: Persona | null) {
    if (resumenCloseTimerRef.current) window.clearTimeout(resumenCloseTimerRef.current)
    setResumenClosing(false)
    setResumenOpenPersona(persona)
  }

  function cerrarResumenPersona() {
    setResumenClosing(true)
    resumenCloseTimerRef.current = window.setTimeout(() => {
      setResumenOpenPersona(null)
      setResumenClosing(false)
      resumenCloseTimerRef.current = null
    }, 180)
  }
  const fechaCategorias = new Intl.DateTimeFormat("es-AR", { dateStyle: "short", timeStyle: "short" }).format(new Date())
  const firmaResumen = "💲 Resumen hecho con https://germanmorini.github.io/repartir-gastos/"
  const resumenCopiable = pendientes.length
    ? `Esto es lo que debe cada uno:\n${pendientes.map((t) => `- ${t.de} transfiere ${formatoARS.format(t.monto)} a ${t.a}`).join("\n")}\n\n${firmaResumen}`
    : `Esto es lo que debe cada uno:\nLas cuentas ya están equilibradas.\n\n${firmaResumen}`
  const isMobile = useIsMobile()
  const Layout = MobileLayout

  function irASeccion(seccion: MobileSection) {
    const currentIndex = mobileSectionOrder.indexOf(activeSection)
    const nextIndex = mobileSectionOrder.indexOf(seccion)
    if (nextIndex !== currentIndex) {
      setSectionDirection(nextIndex > currentIndex ? "forward" : "back")
      setSectionAnimating(true)
      if (sectionAnimationTimerRef.current) window.clearTimeout(sectionAnimationTimerRef.current)
      sectionAnimationTimerRef.current = window.setTimeout(() => setSectionAnimating(false), 230)
    }
    setActiveSection(seccion)
    if (matchMedia("(max-width: 719px)").matches) window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const vistaMobile = (seccion: MobileSection) => `mobile-view section-${sectionDirection} ${activeSection === seccion ? "is-active" : ""}`
  const mostrarSeccion = (seccion: MobileSection) => !isMobile || activeSection === seccion
  const cambiarPaginaMovimientos = (nextPage: number) => {
    setMobileMovementPageDirection(nextPage > currentMobileMovementPage ? "next" : "prev")
    setMobileMovementPageAnimating(true)
    if (mobileMovementPageTimerRef.current) window.clearTimeout(mobileMovementPageTimerRef.current)
    mobileMovementPageTimerRef.current = window.setTimeout(() => setMobileMovementPageAnimating(false), 190)
    setMobileMovementPage(nextPage)
  }
  const abrirAccionMobile = (view: "grafico" | "calculos") => {
    setMobileActionsDirection("forward")
    setMobileActionsPanelAnimating(true)
    setMobileActionsView(view)
  }
  const volverAccionesMobile = () => {
    setMobileActionsDirection("back")
    setMobileActionsPanelAnimating(true)
    setMobileActionsView("menu")
  }

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

  const sleep = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms))

  async function typeInto(update: (value: string) => void, text: string, delay = 45) {
    update("")
    for (let index = 1; index <= text.length; index += 1) {
      update(text.slice(0, index))
      await sleep(delay)
    }
  }

  async function flashDemoTarget(id: string) {
    setDemoActiveTarget(id)
    await sleep(420)
    setDemoActiveTarget(null)
    await sleep(180)
  }

  async function runPersonasDemo() {
    if (tutorialCompletedDemosRef.current.has("personas")) return
    tutorialCompletedDemosRef.current.add("personas")
    const state = cloneTutorialState()
    setPersonas([])
    setMovimientos([])
    setNombre("")
    await nextPaint()

    for (const persona of state.personas) {
      await typeInto(setNombre, persona)
      await flashDemoTarget("add-person-button")
      setPersonas((actuales) => (actuales.includes(persona) ? actuales : [...actuales, persona]))
      setNombre("")
      await sleep(300)
    }
  }

  async function runMovimientosDemo() {
    if (tutorialCompletedDemosRef.current.has("movimientos")) return
    tutorialCompletedDemosRef.current.add("movimientos")
    const state = cloneTutorialState()
    setPersonas(state.personas)
    setMovimientos([])
    setMobileMovementPage(1)
    await nextPaint()

    for (const movimiento of state.movimientos) {
      if (movimiento.tipo === "gasto") {
        setMovementTab("gasto")
        setGasto({ descripcion: "", pagador: sinSeleccion, monto: "", participantes: [], categoria: CATEGORIA_DEFAULT })
        await nextPaint()
        await typeInto((value) => setGasto((actual) => ({ ...actual, descripcion: value })), movimiento.descripcion ?? "", 60)
        setGasto((actual) => ({ ...actual, monto: String(movimiento.monto) }))
        await sleep(450)
        setGasto((actual) => ({ ...actual, pagador: movimiento.pagador }))
        await sleep(450)
        setGasto((actual) => ({ ...actual, participantes: [...movimiento.participantes], categoria: movimiento.categoria }))
        await sleep(520)
        await flashDemoTarget("add-expense-button")
        setMovimientos((actuales) => [...actuales, { ...movimiento, participantes: [...movimiento.participantes] }])
        setGasto({ descripcion: "", pagador: movimiento.pagador, monto: "", participantes: state.personas, categoria: movimiento.categoria })
        await sleep(420)
        continue
      }

      setMovementTab("transferencia")
      setTransferencia({ descripcion: "", de: sinSeleccion, a: sinSeleccion, monto: "" })
      await nextPaint()
      await typeInto((value) => setTransferencia((actual) => ({ ...actual, descripcion: value })), movimiento.descripcion ?? "", 60)
      setTransferencia((actual) => ({ ...actual, monto: String(movimiento.monto) }))
      await sleep(450)
      setTransferencia((actual) => ({ ...actual, de: movimiento.de }))
      await sleep(450)
      setTransferencia((actual) => ({ ...actual, a: movimiento.a }))
      await sleep(520)
      await flashDemoTarget("add-transfer-button")
      setMovimientos((actuales) => [...actuales, { ...movimiento }])
      setTransferencia({ descripcion: "", de: movimiento.de, a: movimiento.a, monto: "" })
      await sleep(420)
    }
  }

  async function runResumenDemo() {
    if (tutorialCompletedDemosRef.current.has("resumen")) return
    tutorialCompletedDemosRef.current.add("resumen")
    const state = cloneTutorialState()
    setPersonas(state.personas)
    setMovimientos(state.movimientos)
    await nextPaint()
    setSettlementOpen(true)
    await sleep(900)
  }

  async function runTutorialDemo(index: number) {
    const demo = getTutorialStepsConfig()[index]?.demo
    if (demo === "personas") await runPersonasDemo()
    if (demo === "movimientos") await runMovimientosDemo()
    if (demo === "resumen") await runResumenDemo()
  }

  async function prepararPasoTutorial(index: number) {
    const step = getTutorialStepsConfig()[index]
    if (!step) return
    if (isMobileViewport()) {
      setActiveSection(step.section)
      window.scrollTo({ top: 0, behavior: "auto" })
    } else {
      setDesktopSection(step.section)
    }
    setResumenOpenPersona(null)
    setCalculosOpen(false)
    setGraficoOpen(false)
    setSettlementOpen(step.selector === "[data-tour='repartir-dialog']")
    await nextPaint()
  }

  function startTutorial() {
    const tutorialSteps = getTutorialStepsConfig()
    const steps: DriveStep[] = tutorialSteps.map((step) => ({
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
      disableActiveInteraction: true,
      overlayClickBehavior: () => undefined,
      onNextClick: (_element, _step, { driver: driverObj }) => {
        const currentIndex = driverObj.getActiveIndex() ?? 0
        const nextIndex = currentIndex + 1
        if (nextIndex >= steps.length) {
          driverObj.destroy()
          return
        }
        void (async () => {
          if (moving) return
          moving = true
          try {
            await runTutorialDemo(currentIndex)
            await prepararPasoTutorial(nextIndex)
            driverObj.moveTo(nextIndex)
          } finally {
            moving = false
          }
        })()
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
        setDemoActiveTarget(null)
        tutorialCompletedDemosRef.current = new Set()
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
    const emptyState: AppState = { personas: [], movimientos: [] }
    saveState(emptyState)
    setPersonas([])
    setMovimientos([])
    setGasto({ descripcion: "", pagador: sinSeleccion, monto: "", participantes: [], categoria: CATEGORIA_DEFAULT })
    setTransferencia({ descripcion: "", de: sinSeleccion, a: sinSeleccion, monto: "" })
    setMovementTab("gasto")
    tutorialCompletedDemosRef.current = new Set()
    setActiveSection("personas")
    setDesktopSection("personas")
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

  async function compartirLinkResumen() {
    try {
      const payload = encodeShareState({ personas, movimientos })
      const url = `${window.location.origin}${window.location.pathname}#/share/${payload}`
      if (url.length > 7000) {
        toast.error("El reparto es demasiado grande para compartir por link. Comparte los gastos como texto")
        return
      }
      if (isMobileViewport() && navigator.share) {
        try {
          await navigator.share({ title: "Resumen de liquidación", url })
          toast.success("Resumen compartido.")
          return
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError") return
        }
      }
      await navigator.clipboard.writeText(url)
      toast.success("Link copiado.")
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

  const copiarMovimientos = () => navigator.clipboard.writeText(textoMovimientos(personas, movimientos)).then(() => toast.success("Movimientos copiados."))
  const gastoFormDesktop = (
    <div className="desktop-mini-form desktop-expense-form">
      <Input placeholder="Descripción (ej: cena, hotel, nafta...)" value={gasto.descripcion} onChange={(event) => setGasto({ ...gasto, descripcion: event.target.value })} />
      <div className="desktop-form-split">
        <Input inputMode="decimal" min="0" placeholder="$  0,00" type="number" value={gasto.monto} onChange={(event) => setGasto({ ...gasto, monto: event.target.value })} />
        <Select value={gasto.categoria} onValueChange={(categoria) => setGasto({ ...gasto, categoria: categoria as CategoriaGasto })}>
          <SelectTrigger><SelectValue placeholder="Seleccionar categoría" /></SelectTrigger>
          <SelectContent><SelectGroup>{CATEGORIAS_GASTO.map((categoria) => <SelectItem key={categoria.key} value={categoria.key}><CategoriaIcon categoria={categoria.key} />{categoria.label}</SelectItem>)}</SelectGroup></SelectContent>
        </Select>
      </div>
      <Select value={gasto.pagador} onValueChange={(pagador) => setGasto({ ...gasto, pagador })}>
        <SelectTrigger><SelectValue placeholder="Seleccionar quién pagó" /></SelectTrigger>
        <SelectContent><SelectGroup>{personas.map((persona) => <SelectItem key={persona} value={persona}>{persona}</SelectItem>)}</SelectGroup></SelectContent>
      </Select>
      <div className="desktop-participants-row">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="select-like" type="button">
              {gasto.participantes.length === 0 ? "Seleccionar participantes" : gasto.participantes.length === personas.length ? "Todos" : `${gasto.participantes.length} seleccionados`}
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
                  onCheckedChange={(checked) => setGasto({ ...gasto, participantes: checked ? [...gasto.participantes, persona] : gasto.participantes.filter((item) => item !== persona) })}
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
      </div>
      <p className="desktop-split-note"><ReceiptTextIcon data-icon="inline-start" />Se dividirá el gasto en partes iguales entre los participantes seleccionados.</p>
      <Button className="add-movement" onClick={agregarGasto} type="button"><PlusIcon data-icon="inline-start" />Añadir gasto</Button>
    </div>
  )
  const transferenciaFormDesktop = (
    <div className="desktop-mini-form desktop-transfer-form">
      <Input placeholder="Descripción" value={transferencia.descripcion} onChange={(event) => setTransferencia({ ...transferencia, descripcion: event.target.value })} />
      <div className="desktop-transfer-amount">
        <Input inputMode="decimal" min="0" placeholder="$  0,00" type="number" value={transferencia.monto} onChange={(event) => setTransferencia({ ...transferencia, monto: event.target.value })} />
      </div>
      <Select value={transferencia.de} onValueChange={(de) => setTransferencia({ ...transferencia, de })}>
        <SelectTrigger><SelectValue placeholder="Seleccionar origen" /></SelectTrigger>
        <SelectContent><SelectGroup>{personas.map((persona) => <SelectItem key={persona} value={persona}>{persona}</SelectItem>)}</SelectGroup></SelectContent>
      </Select>
      <Select value={transferencia.a} onValueChange={(a) => setTransferencia({ ...transferencia, a })}>
        <SelectTrigger><SelectValue placeholder="Seleccionar destino" /></SelectTrigger>
        <SelectContent><SelectGroup>{personas.map((persona) => <SelectItem key={persona} value={persona}>{persona}</SelectItem>)}</SelectGroup></SelectContent>
      </Select>
      <Button className="add-movement" onClick={agregarTransferencia} type="button"><PlusIcon data-icon="inline-start" />Registrar transferencia</Button>
    </div>
  )

  return (
    <main className="app-bg">
      <Toaster richColors position={isMobile ? "top-center" : "bottom-left"} />
      <Dialog open={tutorialDialogOpen} onOpenChange={cerrarTutorialDialog}>
        <DialogContent className="tutorial-dialog">
          <DialogTitle>¿Primera vez usando la app?</DialogTitle>
          <DialogDescription>Podés hacer un tutorial guiado para no perderte.</DialogDescription>
          <label className="tutorial-checkbox" htmlFor="hide-tutorial">
            <Checkbox checked={hideTutorial} id="hide-tutorial" onCheckedChange={(checked) => setHideTutorial(checked === true)} />
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
      {isMobile ? (
        <>
          <Header onActionsClick={() => { setMobileActionsPanelAnimating(false); setMobileActionsView("menu"); setMobileActionsDirection("forward"); setMobileActionsOpen(true) }} />
          <Sheet open={mobileActionsOpen} onOpenChange={(open) => { setMobileActionsOpen(open); if (!open) setMobileActionsView("menu") }}>
            <SheetContent className="mobile-actions-drawer" side="right">
              {mobileActionsView === "menu" ? (
                <div className={`mobile-actions-panel ${mobileActionsPanelAnimating ? `panel-${mobileActionsDirection}` : ""}`} key="menu">
                  <div className="mobile-actions-head">
                    <button className="mobile-actions-back" onClick={() => setMobileActionsOpen(false)} type="button"><ArrowLeftIcon />Cerrar</button>
                    <h2>Acciones</h2>
                    <p>Herramientas del reparto.</p>
                  </div>
                  <div className="mobile-actions-list">
                    <button onClick={() => abrirAccionMobile("grafico")} type="button">
                      <PieChartIcon />
                      <span><strong>Graficar</strong><small>compara gastos por categoría</small></span>
                    </button>
                    <button onClick={() => abrirAccionMobile("calculos")} type="button">
                      <CalculatorIcon />
                      <span><strong>Calcular</strong><small>revisa los cálculos paso a paso</small></span>
                    </button>
                    <ConfirmDialog title="Limpiar datos" description="Esto elimina todos los datos ingresados hasta el momento." confirmText="Limpiar datos" onConfirm={() => { limpiarTodo(); setMobileActionsOpen(false) }}>
                      <button type="button">
                        <ShredderIcon />
                        <span><strong>Limpiar datos</strong><small>borra personas y movimientos</small></span>
                      </button>
                    </ConfirmDialog>
                  </div>
                </div>
              ) : null}
              {mobileActionsView === "grafico" ? (
                <div className={`mobile-actions-panel ${mobileActionsPanelAnimating ? `panel-${mobileActionsDirection}` : ""}`} key="grafico">
                  <div className="mobile-actions-head">
                    <button className="mobile-actions-back" onClick={volverAccionesMobile} type="button"><ArrowLeftIcon />Volver</button>
                    <h2>Gráfico</h2>
                    <p>Compará gastos por categoría.</p>
                  </div>
                  <div className="category-chart-card">
                    <div className="category-chart-layout">
                      <CategoryPie data={gastosPorCategoria} />
                      <CategoryDetailList data={gastosPorCategoria} />
                    </div>
                    <Separator />
                    <div className="category-total"><span>Total gastado</span><strong>{formatoARS.format(totalGastado)}</strong></div>
                  </div>
                  <div className="dialog-actions">
                    <Button className="btn-outline" onClick={() => navigator.clipboard.writeText(textoCategorias(totalGastado, gastosPorCategoria, porcentaje)).then(() => toast.success("Resumen copiado."))} type="button">
                      <CopyIcon data-icon="inline-start" />
                      Copiar resumen
                    </Button>
                    <Button onClick={() => void exportarGraficoComoImagen()} type="button">
                      <ShareIcon data-icon="inline-start" />
                      Compartir
                    </Button>
                  </div>
                </div>
              ) : null}
              {mobileActionsView === "calculos" ? (
                <div className={`mobile-actions-panel ${mobileActionsPanelAnimating ? `panel-${mobileActionsDirection}` : ""}`} key="calculos">
                  <div className="mobile-actions-head">
                    <button className="mobile-actions-back" onClick={volverAccionesMobile} type="button"><ArrowLeftIcon />Volver</button>
                  </div>
                  <div className="calculations-content" ref={calculosRef}>
                    <div className="calculations-head">
                      <DialogTitle className="dialog-title">Cálculos</DialogTitle>
                      <DialogDescription className="dialog-description">Cuentas hechas paso a paso. Se subraya quién pagó o transfirió cada movimiento.</DialogDescription>
                      <Badge>{personas.length} personas</Badge>
                    </div>
                    <Separator />
                    <ScrollArea className="calculations-scroll">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="calculation-movement-column">Movimiento</TableHead>
                            {personas.map((persona) => <TableHead className="number" key={persona}>{persona}</TableHead>)}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {matrizCalculos.map((fila) => (
                            <TableRow key={fila.paso}>
                              <TableCell className="calculation-movement-column">{fila.movimiento} <strong className="calculation-movement-amount">({formatoARS.format(fila.monto)})</strong></TableCell>
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
                  </div>
                  <div className="dialog-actions">
                    <Button onClick={() => void exportarCalculosComoImagen()} type="button">
                      <DownloadIcon data-icon="inline-start" />
                      Compartir
                    </Button>
                  </div>
                </div>
              ) : null}
            </SheetContent>
          </Sheet>
        </>
      ) : null}

      {isMobile ? (
      <Layout>
        <div className="app-panel">

          {mostrarSeccion("personas") ? (
            <PersonasSection
              className={vistaMobile("personas")}
              demoActiveTarget={demoActiveTarget}
              personas={personas}
              nombre={nombre}
              onNombreChange={setNombre}
              onAdd={agregarPersona}
              onDelete={borrarPersona}
              onStartTutorial={() => void iniciarTutorialConMockup()}
              suppressListAnimation={sectionAnimating}
            />
          ) : null}

          {mostrarSeccion("movimientos") ? <section className={`app-section movement-form movement-form-launcher ${vistaMobile("movimientos")}`} id="movimientos" data-tour="movimientos">
            <div className="section-head movement-form-head">
              <div className="section-title section-title-movements">
                <span className="section-icon"><ArrowLeftRightIcon /></span>
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
            <Button className="mobile-add-movement-trigger" onClick={() => setMobileMovementSheetOpen(true)} type="button">
              <PlusIcon data-icon="inline-start" />
              Añadir
            </Button>
            <Sheet open={mobileMovementSheetOpen} onOpenChange={setMobileMovementSheetOpen}>
              <SheetContent className="mobile-movement-sheet movement-form" side="bottom">
                <div className="mobile-sheet-head">
                  <h2>Añadir movimiento</h2>
                  <p>Podés cargar varios movimientos sin cerrar esta ventana.</p>
                </div>
                <Tabs value={movementTab} onValueChange={(value) => setMovementTab(value as "gasto" | "transferencia")}>
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
                    <div className="mobile-two-fields">
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
                              {gasto.participantes.length === 0 ? "Participantes" : gasto.participantes.length === personas.length ? "Todos" : `${gasto.participantes.length} seleccionados`}
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
                    </div>
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
                      <Button className={`add-movement ${demoActiveTarget === "add-expense-button" ? "tutorial-demo-press" : ""}`} data-tour="add-expense-button" onClick={agregarGasto} type="button">
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
                <div className="mobile-two-fields">
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
                </div>
                <Button className={`add-movement ${demoActiveTarget === "add-transfer-button" ? "tutorial-demo-press" : ""}`} data-tour="add-transfer-button" onClick={agregarTransferencia} type="button">
                  <PlusIcon data-icon="inline-start" />
                  Registrar transferencia
                </Button>
              </TabsContent>
                </Tabs>
              </SheetContent>
            </Sheet>
          </section> : null}

          {mostrarSeccion("movimientos") ? <section className={`app-section movements-section ${vistaMobile("movimientos")}`}>
            <div className="section-head">
              <h2>Listado</h2>
            </div>
            <p className="movement-hint">
              <span className="hint-mobile">Tocá en un movimiento para editarlo.</span>
              <span className="hint-desktop">Clickeá en un movimiento para editarlo.</span>
            </p>
            <div className={`movement-list ${mobileMovementPageAnimating && !sectionAnimating ? `page-slide-${mobileMovementPageDirection}` : ""}`} key={currentMobileMovementPage}>
              {movimientos.length === 0 ? <Badge className="empty-state-badge">Sin movimientos</Badge> : null}
              {movimientos.length > 0 ? mobileMovimientos.map(({ movimiento, index }) => (
                <MovimientoItem
                  key={`${movimiento.tipo}-${index}`}
                  movimiento={movimiento}
                  index={index}
                  onEdit={abrirEdicion}
                  onDelete={(item) => setMovimientos(movimientos.filter((_, movimientoIndex) => movimientoIndex !== item))}
                  nombreMovimiento={nombreMovimiento}
                />
              )) : null}
            </div>
            <div className="movement-list-actions">
              <PaginationControls page={currentMobileMovementPage} totalPages={mobileMovementTotalPages} onPage={cambiarPaginaMovimientos} />
              <Button className="movement-copy-button movement-copy-mobile" data-tour="copy-movimientos-mobile" disabled={movimientos.length === 0} onClick={() => void compartirMovimientos()} type="button">
                <ShareIcon data-icon="inline-start" />
                Compartir
              </Button>
            </div>
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
                              {edicion.movimiento.participantes.length === 0 ? "Participantes" : edicion.movimiento.participantes.length === personas.length ? "Todos" : `${edicion.movimiento.participantes.length} seleccionados`}
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
              matrizCalculos={matrizCalculos}
              movimientos={movimientos}
              onCalculosOpenChange={setCalculosOpen}
              onExportCalculos={() => void exportarCalculosComoImagen()}
              gastosPorCategoria={gastosPorCategoria}
              graficoOpen={graficoOpen}
              onCopyCategorias={() => navigator.clipboard.writeText(textoCategorias(totalGastado, gastosPorCategoria, porcentaje)).then(() => toast.success("Resumen copiado."))}
              onExportGrafico={() => void exportarGraficoComoImagen()}
              onGraficoOpenChange={setGraficoOpen}
              onResumenOpenPersonaChange={abrirResumenPersona}
              onShareLink={() => void compartirLinkResumen()}
              onSettlementOpenChange={setSettlementOpen}
              onShareReparto={() => void compartirResumenReparto()}
              personas={personas}
              pendientes={pendientes}
              resumenCopiable={resumenCopiable}
              saldos={saldos}
              settlementOpen={settlementOpen}
              suppressListAnimation={sectionAnimating}
              totalGastado={totalGastado}
            />
          ) : null}
        </aside>
      </Layout>
      ) : (
        <>
          <DesktopWorkspace
            desktopSection={desktopSection}
            gastoForm={gastoFormDesktop}
            gastosPorCategoria={gastosPorCategoria}
            movimientos={movimientos}
            movimientosCard={movimientosCard}
            movementTab={movementTab}
            nombre={nombre}
            nombreMovimiento={nombreMovimiento}
            onAddPersona={agregarPersona}
            onClear={limpiarTodo}
            onCopyMovimientos={copiarMovimientos}
            onDeletePersona={borrarPersona}
            onDesktopSectionChange={setDesktopSection}
            onEditMovimiento={abrirEdicion}
            onMovementTabChange={setMovementTab}
            onNombreChange={setNombre}
            onSettlementOpenChange={setSettlementOpen}
            onShareLink={() => void compartirLinkResumen()}
            onShareReparto={() => void compartirResumenReparto()}
            pendientes={pendientes}
            personas={personas}
            promedio={promedio}
            resumenCopiable={resumenCopiable}
            saldos={saldos}
            settlementOpen={settlementOpen}
            totalGastado={totalGastado}
            transferenciaForm={transferenciaFormDesktop}
          />
          <EditMovimientoDialog
            edicion={edicion}
            onChange={setEdicion}
            onClose={() => setEdicion(null)}
            onEditarGasto={editarGasto}
            onEditarParticipante={editarParticipante}
            onEditarTransferencia={editarTransferencia}
            onSubmit={aceptarEdicion}
            personas={personas}
          />
        </>
      )}
      {isMobile && resumenOpenPersona ? (
        <PersonSummaryMobilePage
          initialPersona={resumenOpenPersona}
          closing={resumenClosing}
          movimientos={movimientos}
          onBack={cerrarResumenPersona}
          onShare={(persona) => void compartirResumenPersona(getResumenPersona(persona, movimientos))}
          personas={personas}
          title="Hoja de liquidación"
        />
      ) : null}
      {isMobile ? <BottomNavigation activeSection={activeSection} onChange={irASeccion} /> : null}
    </main>
  )
}
