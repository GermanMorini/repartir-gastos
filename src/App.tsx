import { ArrowDownLeftIcon, ArrowUpRightIcon, BrushCleaningIcon, CalculatorIcon, CheckIcon, ChevronDownIcon, CopyIcon, DownloadIcon, PieChartIcon, PlusIcon, ReceiptTextIcon, ShareIcon, Trash2Icon, UserIcon, UserPlusIcon, UsersIcon, WalletCardsIcon, XIcon } from "lucide-react"
import { driver } from "driver.js"
import type { DriveStep, Driver } from "driver.js"
import { toPng } from "html-to-image"
import { useEffect, useMemo, useRef, useState } from "react"
import type { CSSProperties, ReactNode } from "react"
import { toast, Toaster } from "sonner"
import "driver.js/dist/driver.css"
import { calcularSaldos, calcularTransferenciasPendientes, formatoARS, getGastosPorCategoria, getMatrizCalculos, getResumenPersona } from "./calculos"
import { CATEGORIAS_GASTO, CATEGORIA_DEFAULT, getCategoria, getCategoriaOrden } from "./categories"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger, Badge, Button, Card, Checkbox, Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle, DialogTrigger, DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuGroup, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, Input, ScrollArea, Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue, Separator, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui"
import { clearState, loadState, saveState } from "./storage"
import type { AppState, CategoriaGasto, Movimiento, Persona, ResumenCategoria } from "./types"

const sinSeleccion = ""
type Gasto = Extract<Movimiento, { tipo: "gasto" }>
type Transferencia = Extract<Movimiento, { tipo: "transferencia" }>
type MobileSection = "personas" | "movimientos" | "resumen" | "total"
type TutorialStepConfig = {
  section: MobileSection
  selector: string | (() => string)
  fallback?: string
  opensResumen?: Persona
  opensCalculos?: boolean
  opensGrafico?: boolean
  opensSettlement?: boolean
  title: string
  description: string
}

const TUTORIAL_HIDDEN_KEY = "repartir-gastos:tutorial:hidden"
const tutorialMockState = {
  personas: ["Norberto", "Clara", "Estifen"],
  movimientos: [
    { tipo: "gasto", descripcion: "cena", pagador: "Norberto", monto: 98000, participantes: ["Norberto", "Clara", "Estifen"], categoria: "comida" },
    { tipo: "gasto", descripcion: "uber", pagador: "Clara", monto: 6200, participantes: ["Norberto", "Clara", "Estifen"], categoria: "transporte" },
    { tipo: "gasto", descripcion: "cena 2 + compras", pagador: "Clara", monto: 40800, participantes: ["Norberto", "Clara"], categoria: "comida" },
    { tipo: "gasto", descripcion: "goldstar", pagador: "Estifen", monto: 66000, participantes: ["Norberto", "Clara", "Estifen"], categoria: "ocio" },
    { tipo: "transferencia", descripcion: "transferencia", de: "Estifen", a: "Norberto", monto: 40000 },
  ],
} satisfies AppState

const tutorialStepsConfig: TutorialStepConfig[] = [
  {
    section: "personas",
    selector: "[data-tour='personas']",
    title: "Añadí personas",
    description: "Añadí las personas entre quienes se tienen que repartir los gastos",
  },
  {
    section: "movimientos",
    selector: "[data-tour='movimientos']",
    title: "Añadí todos los gastos y transferencias",
    description: "Escribí el nombre del gasto, el monto, quién pagó y entre quiénes se reparte. Podés añadir una categoría si querés",
  },
  {
    section: "movimientos",
    selector: () => (isMobileViewport() ? "[data-tour='copy-movimientos-mobile']" : "[data-tour='copy-movimientos-desktop']"),
    fallback: "[data-tour='movimientos']",
    title: "¿Falta algo?",
    description: "Compartí esto con tus contactos para ver qué es lo que falta.",
  },
  {
    section: "resumen",
    selector: "[data-tour='resumen']",
    title: "Revisá los cálculos",
    description: "Tocá una persona para ver lo que tiene que gastar y lo que pagó.",
  },
  {
    section: "resumen",
    selector: "[data-tour='resumen-norberto-dialog']",
    fallback: "[data-tour='resumen']",
    opensResumen: "Norberto",
    title: "Resumen de Norberto",
    description: "Acá ves cuánto le tocaba gastar, cuánto pagó y su resultado final. Podés compartirlo con él para que sepa cuánto debe.",
  },
  {
    section: "resumen",
    selector: "[data-tour='calculos']",
    fallback: "[data-tour='resumen']",
    title: "¿No podés creer lo que debés?",
    description: "Revisá los cálculos paso a paso para estar seguro",
  },
  {
    section: "resumen",
    selector: "[data-tour='calculos-dialog']",
    fallback: "[data-tour='resumen']",
    opensCalculos: true,
    title: "Tabla de cálculos",
    description: "Acá ves cómo cada movimiento cambia el saldo de cada persona.",
  },
  {
    section: "total",
    selector: "[data-tour='total']",
    title: "Todo listo!",
    description: "Tocá 'Repartir!' para saber quién le transfiere a quién",
  },
  {
    section: "total",
    selector: "[data-tour='grafico']",
    fallback: "[data-tour='total']",
    title: "¿No sabés en qué se gastó tanto?",
    description: "Podés comparar categorías para saber en qué se fue la plata",
  },
  {
    section: "total",
    selector: "[data-tour='grafico-dialog']",
    fallback: "[data-tour='total']",
    opensGrafico: true,
    title: "Gráfico por categoría",
    description: "El gráfico muestra en qué categorías se concentró el gasto.",
  },
  {
    section: "total",
    selector: "[data-tour='repartir-dialog']",
    fallback: "[data-tour='total']",
    opensSettlement: true,
    title: "Pasale esto a tus contactos",
    description: "Compartile esto a los demás para que sepan cuánto deben",
  },
]

function isMobileViewport() {
  return typeof window !== "undefined" && matchMedia("(max-width: 719px)").matches
}

function nextPaint() {
  return new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))
}

function tutorialHidden() {
  try {
    return localStorage.getItem(TUTORIAL_HIDDEN_KEY) === "1"
  } catch {
    return false
  }
}

function hideTutorialForever() {
  try {
    localStorage.setItem(TUTORIAL_HIDDEN_KEY, "1")
  } catch {
    // Sin almacenamiento, solo se omite esta sesión.
  }
}

function cloneTutorialState(): AppState {
  return {
    personas: [...tutorialMockState.personas],
    movimientos: tutorialMockState.movimientos.map((movimiento) => (
      movimiento.tipo === "gasto" ? { ...movimiento, participantes: [...movimiento.participantes] } : { ...movimiento }
    )),
  }
}

function getTutorialElement(step: TutorialStepConfig) {
  const selector = typeof step.selector === "function" ? step.selector() : step.selector
  return document.querySelector(selector) ?? (step.fallback ? document.querySelector(step.fallback) : null) ?? document.body
}

function SlidingText({ children, className = "" }: { children: ReactNode; className?: string }) {
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
  }, [children])

  return (
    <span className={`${className} ${distance ? "marquee is-moving" : "marquee"}`} ref={ref} style={{ "--slide-distance": `${distance}px` } as CSSProperties}>
      <span>{children}</span>
    </span>
  )
}

function SlidingNames({ names }: { names: string }) {
  return <SlidingText>{names}</SlidingText>
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

function CategoriaIcon({ categoria }: { categoria: CategoriaGasto }) {
  const meta = getCategoria(categoria)
  const Icon = meta.icon
  return <Icon data-icon="inline-start" style={{ color: meta.color }} />
}

function porcentaje(porcentaje: number) {
  return `${Number.isInteger(porcentaje) ? porcentaje : porcentaje.toFixed(1)}%`
}

function CategoryPie({ data }: { data: ResumenCategoria[] }) {
  const radio = 72
  const circunferencia = 2 * Math.PI * radio
  let acumulado = 0

  if (data.length === 0) return <div className="category-pie-empty">Sin gastos</div>

  return (
    <svg className="category-pie" viewBox="0 0 180 180" role="img" aria-label="Gastos por categoría">
      <circle cx="90" cy="90" fill="none" r={radio} stroke="#edf1f4" strokeWidth="28" />
      {data.map((item) => {
        const largo = circunferencia * item.porcentaje / 100
        const segmento = (
          <circle
            cx="90"
            cy="90"
            fill="none"
            key={item.categoria}
            r={radio}
            stroke={getCategoria(item.categoria).color}
            strokeDasharray={`${largo} ${circunferencia}`}
            strokeDashoffset={-acumulado}
            strokeWidth="28"
            transform="rotate(-90 90 90)"
          />
        )
        acumulado += largo
        return segmento
      })}
      <text dominantBaseline="middle" textAnchor="middle" x="90" y="84">Total</text>
      <text dominantBaseline="middle" textAnchor="middle" x="90" y="104">{formatoARS.format(data.reduce((total, item) => total + item.monto, 0))}</text>
    </svg>
  )
}

function CategoryChartShareCard({ data, total }: { data: ResumenCategoria[]; total: number; fecha: string }) {
  return (
    <Card className="category-share-card">
      <header>
        <h2>Gastos por categoría</h2>
        <p>Compará cuánto se gastó en cada categoría.</p>
      </header>
      <div className="category-chart-layout">
        <CategoryPie data={data} />
        <div className="category-detail-list">
          {data.length === 0 ? <p className="empty">Todavía no hay gastos para graficar.</p> : null}
          {data.map((item) => (
            <div className="category-detail-row" key={item.categoria}>
              <Badge className="category-badge"><CategoriaIcon categoria={item.categoria} />{item.label}</Badge>
              <strong>{formatoARS.format(item.monto)}</strong>
              <span>{item.cantidadGastos} {item.cantidadGastos === 1 ? "gasto" : "gastos"}</span>
              <small>{porcentaje(item.porcentaje)}</small>
            </div>
          ))}
        </div>
      </div>
      <footer><span>Total gastado</span><strong>{formatoARS.format(total)}</strong></footer>
    </Card>
  )
}

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

  function irASeccion(seccion: MobileSection) {
    setActiveSection(seccion)
    if (matchMedia("(max-width: 719px)").matches) window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const vistaMobile = (seccion: MobileSection) => `mobile-view ${activeSection === seccion ? "is-active" : ""}`

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
      ...resumen.gastosDondeParticipo.map(({ movimiento, montoParte }) => `- ${nombreMovimiento(movimiento)}: ${formatoARS.format(montoParte)} de ${formatoARS.format(movimiento.monto)}`),
      ...resumen.gastosQuePago.map((movimiento) => `- ${nombreMovimiento(movimiento)}: puso ${formatoARS.format(movimiento.monto)}`),
      ...resumen.transferenciasEnviadas.map((movimiento) => `- Pagó a ${movimiento.a}: ${formatoARS.format(movimiento.monto)}`),
      ...resumen.transferenciasRecibidas.map((movimiento) => `- Recibió de ${movimiento.de}: ${formatoARS.format(movimiento.monto)}`),
    ]

    return [
      `Este es tu resumen de gastos:`,
      `- Te tocaba gastar: ${formatoARS.format(resumen.totalLeTocaba)}`,
      `- Ya pagaste: ${formatoARS.format(resumen.totalSalioBolsillo)}`,
      `- Recibiste: ${formatoARS.format(resumen.totalRecibido)}`,
      `- Total: ${resultadoCopiable(resumen)}`,
      ...(detalle.length ? ["", "Detalle:", ...detalle] : []),
    ].join("\n")
  }

  function textoCategorias() {
    return [
      "Gastos por categoría:",
      `Total: ${formatoARS.format(totalGastado)}`,
      "",
      ...gastosPorCategoria.map((item) => `- ${item.label}: ${formatoARS.format(item.monto)} (${porcentaje(item.porcentaje)}, ${item.cantidadGastos} ${item.cantidadGastos === 1 ? "gasto" : "gastos"})`),
    ].join("\n")
  }

  function textoMovimientos() {
    const gastos = movimientos.filter((movimiento): movimiento is Gasto => movimiento.tipo === "gasto")
    const transferencias = movimientos.filter((movimiento): movimiento is Transferencia => movimiento.tipo === "transferencia")
    const nombreCopiado = (persona: Persona) => persona.toUpperCase()
    const abreviaturas = new Map(personas.map((persona) => [persona, 1]))
    let cambio = true
    while (cambio) {
      cambio = false
      const grupos = new Map<string, Persona[]>()
      personas.forEach((persona) => {
        const clave = nombreCopiado(persona).slice(0, abreviaturas.get(persona))
        grupos.set(clave, [...(grupos.get(clave) ?? []), persona])
      })
      grupos.forEach((grupo) => {
        if (grupo.length < 2) return
        grupo.forEach((persona) => {
          const largo = abreviaturas.get(persona) ?? 1
          if (largo < nombreCopiado(persona).length) {
            abreviaturas.set(persona, largo + 1)
            cambio = true
          }
        })
      })
    }
    const inicialCopiada = (persona: Persona) => nombreCopiado(persona).slice(0, abreviaturas.get(persona))
    const bloques = personas
      .map((persona) => {
        const propios = gastos.filter((movimiento) => movimiento.pagador === persona)
        if (propios.length === 0) return ""
        return [
          `${nombreCopiado(persona)}:`,
          ...propios.map((movimiento) => `- \`${nombreMovimiento(movimiento)}\`: *${formatoARS.format(movimiento.monto)}* (entre ${movimiento.participantes.map(inicialCopiada).join(", ")})`),
        ].join("\n")
      })
      .filter(Boolean)

    return [
      "Tengo anotados estos gastos:",
      "",
      ...bloques.flatMap((bloque) => [bloque, ""]),
      ...(transferencias.length ? ["TRANSFERENCIAS:", ...transferencias.map((movimiento) => `- *${formatoARS.format(movimiento.monto)}* (de ${nombreCopiado(movimiento.de)} a ${nombreCopiado(movimiento.a)})`)] : []),
    ].join("\n").trim()
  }

  async function compartirMovimientos() {
    const texto = textoMovimientos()
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

  function descargarImagen(dataUrl: string, nombreArchivo = "gastos-por-categoria.png") {
    const link = document.createElement("a")
    link.href = dataUrl
    link.download = nombreArchivo
    link.click()
  }

  async function exportarGraficoComoImagen() {
    if (!exportCategoriasRef.current) return
    try {
      await document.fonts?.ready
      await new Promise((resolve) => requestAnimationFrame(resolve))
      const dataUrl = await toPng(exportCategoriasRef.current, { cacheBust: true, pixelRatio: 2, backgroundColor: "#ffffff" })
      const blob = await fetch(dataUrl).then((respuesta) => respuesta.blob())
      const file = new File([blob], "gastos-por-categoria.png", { type: "image/png" })

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ title: "Gastos por categoría", text: "Resumen de gastos por categoría", files: [file] })
      } else {
        descargarImagen(dataUrl)
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
      await document.fonts?.ready
      await new Promise((resolve) => requestAnimationFrame(resolve))
      const dataUrl = await toPng(calculosRef.current, { cacheBust: true, pixelRatio: 2, backgroundColor: "#ffffff" })
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
      <header className="app-header">
        <div className="brand-mark"><UsersIcon /></div>
        <h1>Repartir gastos</h1>
        <Dialog>
          <DialogTrigger asChild>
            <button aria-label="Limpiar datos" className="clear-button" type="button">
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

      <div className="app-grid">
        <div className="app-panel">

          <section className={`app-section people-section ${vistaMobile("personas")}`} id="personas" data-tour="personas">
            <div className="section-head">
              <div className="section-title section-title-people">
                <span className="section-icon"><UsersIcon /></span>
                <div>
                  <h2>Personas</h2>
                  <p>Añadí las personas que participan en los gastos.</p>
                </div>
              </div>
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
                      <DialogDescription>Eliminar {persona} borra lo que pagó y recalcula los gastos donde participaba.</DialogDescription>
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
            <p className="people-tutorial-hint">
              ¿No sabés que hacer? haz <button onClick={() => void iniciarTutorialConMockup()} type="button">este</button> tutorial para comenzar
            </p>
          </section>

          <section className={`app-section movement-form ${vistaMobile("movimientos")}`} id="movimientos" data-tour="movimientos">
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
                <Button className="movement-copy-button movement-copy-desktop" data-tour="copy-movimientos-desktop" onClick={() => navigator.clipboard.writeText(textoMovimientos()).then(() => toast.success("Movimientos copiados."))} type="button">
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
          </section>

          <section className={`app-section movements-section ${vistaMobile("movimientos")}`}>
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
                  <div className="movement-row" key={`${movimiento.tipo}-${index}`} style={movimiento.tipo === "gasto" ? { "--movement-color": getCategoria(movimiento.categoria).color } as CSSProperties : undefined}>
                    <button className="movement-edit" onClick={() => abrirEdicion(index, movimiento)} type="button">
                      <span className="movement-copy">
                        <span className="movement-title">
                          <SlidingText className="movement-name">{nombreMovimiento(movimiento)}</SlidingText>
                          {movimiento.tipo === "gasto" ? <SlidingText className="movement-paid-by">Pagó {movimiento.pagador}</SlidingText> : null}
                          {movimiento.tipo === "gasto" ? <Badge className="category-badge"><CategoriaIcon categoria={movimiento.categoria} />{getCategoria(movimiento.categoria).label}</Badge> : null}
                        </span>
                        {movimiento.tipo === "gasto" ? (
                          <span className="movement-participants">
                            <SlidingNames names={movimiento.participantes.join(", ")} />
                          </span>
                        ) : (
                          <>
                            <SlidingText className="movement-transfer-label">{movimiento.de} pagó {formatoARS.format(movimiento.monto)} a {movimiento.a}</SlidingText>
                            <span className="movement-transfer-participants">
                              <SlidingNames names={`${movimiento.de}, ${movimiento.a}`} />
                            </span>
                          </>
                        )}
                      </span>
                    </button>
                    <strong className={`movement-amount ${movimiento.tipo === "transferencia" ? "movement-amount-transfer" : ""}`}>{formatoARS.format(movimiento.monto)}</strong>
                    <Dialog>
                      <DialogTrigger asChild>
                        <button aria-label="Eliminar movimiento" className="movement-delete" type="button">
                          <Trash2Icon />
                        </button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogTitle>Eliminar movimiento</DialogTitle>
                        <DialogDescription>Esto elimina <strong>{nombreMovimiento(movimiento)}</strong> del reparto.</DialogDescription>
                        <div className="dialog-actions">
                          <DialogClose asChild>
                            <Button className="btn-outline" type="button">Cancelar</Button>
                          </DialogClose>
                          <DialogClose asChild>
                            <Button className="btn-danger" onClick={() => setMovimientos(movimientos.filter((_, item) => item !== index))} type="button">Eliminar</Button>
                          </DialogClose>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
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
          </section>

        </div>

        <aside className="desktop-summary">
          <Card className={`summary-card ${vistaMobile("resumen")}`} id="resumen" data-tour="resumen">
            <div className="summary-head">
              <div className="section-title section-title-summary">
                <span className="section-icon"><UsersIcon /></span>
                <div>
                  <h2>Resumen por persona</h2>
                  <p className="summary-hint">
                    <span className="hint-mobile">Toca en una persona para ver su hoja de liquidación.</span>
                    <span className="hint-desktop">Clickeá en una persona para ver su hoja de liquidación.</span>
                  </p>
                </div>
              </div>
              <div className="summary-actions">
                <Dialog open={calculosOpen} onOpenChange={setCalculosOpen}>
                  <DialogTrigger asChild>
                    <Button className="btn-france" data-tour="calculos" type="button">
                      <CalculatorIcon data-icon="inline-start" />
                      Cálculos
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="calculations-dialog" data-tour="calculos-dialog">
                    <div className="calculations-content" ref={calculosRef}>
                      <div className="calculations-head">
                        <div>
                          <DialogTitle>Cálculos hechos</DialogTitle>
                          <DialogDescription>Cuentas hechas paso a paso. Se subraya quién pagó o transfirió cada movimiento.</DialogDescription>
                        </div>
                        <Badge>{movimientos.length} movimientos</Badge>
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
                                <TableCell className="calculation-movement-column"><SlidingText>{fila.movimiento} <strong className="calculation-movement-amount">({formatoARS.format(fila.monto)})</strong></SlidingText></TableCell>
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
                      <Button onClick={exportarCalculosComoImagen} type="button">
                        <DownloadIcon data-icon="inline-start" />
                        Compartir
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            <div className="summary-list">
              {saldos.length === 0 ? <p className="empty">Agregá personas para ver saldos.</p> : null}
              {saldos.map((saldo) => {
                const resumen = getResumenPersona(saldo.persona, movimientos)
                const estado = Math.round(resumen.saldo * 100) < 0 ? "negative" : Math.round(resumen.saldo * 100) > 0 ? "positive" : "neutral"
                const pendiente = Math.round(resumen.saldo * 100) > 0 ? "Debe recibir" : Math.round(resumen.saldo * 100) < 0 ? "Debe pagar" : "Está al día"

                return (
                  <Dialog key={saldo.persona} open={resumenOpenPersona === saldo.persona} onOpenChange={(open) => setResumenOpenPersona(open ? saldo.persona : null)}>
                    <DialogTrigger asChild>
                      <button className="summary-person" type="button">
                        <div className={resumen.saldo > 0 ? "avatar avatar-positive" : "avatar"}>{saldo.persona[0].toUpperCase()}</div>
                        <SlidingText className="summary-name">{saldo.persona}</SlidingText>
                        <div className="summary-balance">
                          <span className={resumen.saldo > 0 ? "positive" : resumen.saldo < 0 ? "negative" : ""}>{formatoARS.format(resumen.saldo)}</span>
                          <small>Pendiente</small>
                        </div>
                      </button>
                    </DialogTrigger>
                    <DialogContent className="receipt-dialog" data-tour={saldo.persona === "Norberto" ? "resumen-norberto-dialog" : undefined}>
                      <ScrollArea className="receipt-scroll">
                        <div className="receipt">
                          <header className="receipt-head">
                            <span className="receipt-avatar">{iniciales(saldo.persona)}</span>
                            <div>
                              <DialogTitle>Resumen de {saldo.persona}</DialogTitle>
                            </div>
                            <div className="receipt-actions">
                              <Button className="btn-outline receipt-copy" onClick={() => void compartirResumenPersona(resumen)} type="button">
                                <CopyIcon className="receipt-copy-desktop" data-icon="inline-start" />
                                <ShareIcon className="receipt-copy-mobile" data-icon="inline-start" />
                                <span className="receipt-copy-desktop">Copiar resumen</span>
                                <span className="receipt-copy-mobile">Compartir</span>
                              </Button>
                            </div>
                          </header>
                          <Separator />
                          {!resumen.tieneMovimientos ? (
                            <p className="empty">{saldo.persona} todavía no tiene movimientos.</p>
                          ) : (
                            <>
                              <Card className={`receipt-result receipt-result-${estado}`}>
                                <SlidingText className="receipt-result-text">{resultadoPersona(saldo.persona, resumen.saldo)}</SlidingText>
                              </Card>
                              <div className="receipt-table">
                                <div><UsersIcon data-icon="inline-start" /><span>Le tocaba gastar</span><small></small><strong>{formatoARS.format(resumen.totalLeTocaba)}</strong></div>
                                <div><WalletCardsIcon data-icon="inline-start" /><span>Ya salió de su bolsillo</span><small></small><strong>{formatoARS.format(resumen.totalSalioBolsillo)}</strong></div>
                                <div><ArrowDownLeftIcon data-icon="inline-start" /><span>Ya recibió</span><small></small><strong>{formatoARS.format(resumen.totalRecibido)}</strong></div>
                                <div className="receipt-balance"><span>Resultado final</span><small>{pendiente}</small><strong className={estado}>{formatoARS.format(Math.abs(resumen.saldo))}</strong></div>
                              </div>
                              <Separator />
                              <Accordion className="receipt-detail" collapsible type="single" value={detalleResumenAbierto} onValueChange={setDetalleResumenAbierto}>
                                <AccordionItem value="detalle">
                                  <AccordionTrigger><span className="accordion-label"><ReceiptTextIcon data-icon="inline-start" />Detalle</span></AccordionTrigger>
                                  <AccordionContent>
                                    <div className="receipt-detail-list">
                                        <section>
                                          <h3><ReceiptTextIcon data-icon="inline-start" />Gastos donde participó <strong>{formatoARS.format(resumen.totalLeTocaba)}</strong></h3>
                                          {resumen.gastosDondeParticipo.map(({ movimiento, montoParte }, index) => <p key={`participado-${index}`}><SlidingText>{nombreMovimiento(movimiento)}</SlidingText> <SlidingText className="receipt-detail-amount"><strong>{formatoARS.format(montoParte)}</strong> de {formatoARS.format(movimiento.monto)}</SlidingText></p>)}
                                        </section>
                                        <section>
                                          <h3><WalletCardsIcon data-icon="inline-start" />Gastos que pagó <strong>{formatoARS.format(resumen.totalPuesto)}</strong></h3>
                                          {resumen.gastosQuePago.map((movimiento, index) => <p key={`pagado-${index}`}><SlidingText>{nombreMovimiento(movimiento)}</SlidingText> <SlidingText className="receipt-detail-amount">{formatoARS.format(movimiento.monto)}</SlidingText></p>)}
                                        </section>
                                        <section>
                                          <h3><ArrowUpRightIcon data-icon="inline-start" />Pagos realizados <strong>{formatoARS.format(resumen.totalTransferido)}</strong></h3>
                                          {resumen.transferenciasEnviadas.map((movimiento, index) => <p key={`enviada-${index}`}><SlidingText>Pagó a {movimiento.a}</SlidingText> <SlidingText className="receipt-detail-amount">{formatoARS.format(movimiento.monto)}</SlidingText></p>)}
                                        </section>
                                        <section>
                                          <h3><ArrowDownLeftIcon data-icon="inline-start" />Pagos recibidos <strong>{formatoARS.format(resumen.totalRecibido)}</strong></h3>
                                          {resumen.transferenciasRecibidas.map((movimiento, index) => <p key={`recibida-${index}`}><SlidingText>Recibió de {movimiento.de}</SlidingText> <SlidingText className="receipt-detail-amount">{formatoARS.format(movimiento.monto)}</SlidingText></p>)}
                                        </section>
                                    </div>
                                  </AccordionContent>
                                </AccordionItem>
                              </Accordion>
                            </>
                          )}
                        </div>
                      </ScrollArea>
                    </DialogContent>
                  </Dialog>
                )
              })}
            </div>
          </Card>

          <Card className={`totals-card ${vistaMobile("total")}`} id="totales" data-tour="total">
            <div className="totals-head">
              <div className="section-title section-title-total">
                <span className="section-icon"><WalletCardsIcon /></span>
                <div>
                  <h2>Total</h2>
                  <p>Resumen general del viaje.</p>
                </div>
              </div>
              <Dialog open={graficoOpen} onOpenChange={setGraficoOpen}>
                <DialogTrigger asChild>
                  <Button className="btn-chart" data-tour="grafico" type="button">
                    <PieChartIcon data-icon="inline-start" />
                    Gráfico
                  </Button>
                </DialogTrigger>
                <DialogContent className="category-dialog" data-tour="grafico-dialog">
                  <DialogTitle>Gastos por categoría</DialogTitle>
                  <DialogDescription>Compará cuánto se gastó en cada categoría.</DialogDescription>
                  <Card className="category-chart-card">
                    <div className="category-chart-layout">
                      <CategoryPie data={gastosPorCategoria} />
                      <div className="category-detail-list">
                        {gastosPorCategoria.length === 0 ? <p className="empty">Todavía no hay gastos para graficar.</p> : null}
                        {gastosPorCategoria.map((item) => (
                          <div className="category-detail-row" key={item.categoria}>
                            <Badge className="category-badge"><CategoriaIcon categoria={item.categoria} />{item.label}</Badge>
                            <strong>{formatoARS.format(item.monto)}</strong>
                            <span>{item.cantidadGastos} {item.cantidadGastos === 1 ? "gasto" : "gastos"}</span>
                            <small>{porcentaje(item.porcentaje)}</small>
                          </div>
                        ))}
                      </div>
                    </div>
                    <Separator />
                    <div className="category-total"><span>Total gastado</span><strong>{formatoARS.format(totalGastado)}</strong></div>
                  </Card>
                  <div className="dialog-actions">
                    <Button className="btn-outline" onClick={() => navigator.clipboard.writeText(textoCategorias()).then(() => toast.success("Resumen copiado."))} type="button">
                      <CopyIcon data-icon="inline-start" />
                      Copiar resumen
                    </Button>
                    <Button onClick={exportarGraficoComoImagen} type="button">
                      <ShareIcon data-icon="inline-start" />
                      Compartir
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
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
            <Dialog open={settlementOpen} onOpenChange={setSettlementOpen}>
              <DialogTrigger asChild>
                <Button className="btn-primary settle-button" type="button">Repartir!</Button>
              </DialogTrigger>
              <DialogContent className="settlement-dialog" data-tour="repartir-dialog">
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
                <Button className="settlement-copy" onClick={() => void compartirResumenReparto()} type="button">
                  <CopyIcon className="settlement-copy-desktop" data-icon="inline-start" />
                  <ShareIcon className="settlement-copy-mobile" data-icon="inline-start" />
                  <span className="settlement-copy-desktop">Copiar resumen</span>
                  <span className="settlement-copy-mobile">Compartir</span>
                </Button>
              </DialogContent>
            </Dialog>
          </Card>
        </aside>
      </div>
      <footer className={`site-footer ${activeSection === "total" ? "is-mobile-visible" : ""}`}>
        ¿Te gustó la aplicación? Seguime en <a href="https://github.com/GermanMorini/repartir-gastos" rel="noreferrer" target="_blank">github</a>
      </footer>
      <nav className="mobile-nav" aria-label="Navegación principal">
        <button className={activeSection === "personas" ? "active" : ""} onClick={() => irASeccion("personas")} type="button"><UsersIcon />Personas</button>
        <button className={activeSection === "movimientos" ? "active" : ""} onClick={() => irASeccion("movimientos")} type="button"><ReceiptTextIcon />Movimientos</button>
        <button className={activeSection === "resumen" ? "active" : ""} onClick={() => irASeccion("resumen")} type="button"><UserIcon />Resumen</button>
        <button className={activeSection === "total" ? "active" : ""} onClick={() => irASeccion("total")} type="button"><WalletCardsIcon />Total</button>
      </nav>
    </main>
  )
}
