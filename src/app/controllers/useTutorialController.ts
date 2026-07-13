import type { Driver, DriveStep } from "driver.js"
import { useEffect, useRef, useState } from "react"
import { CATEGORIA_DEFAULT } from "../../lib/categorias"
import { saveState } from "../../lib/storage"
import { isMobileViewport } from "../../lib/viewport"
import { cloneTutorialState, getTutorialElement, getTutorialStepsConfig, hideTutorialForever, nextPaint, tutorialHidden } from "../tutorial"
import type { MobileSection } from "../tutorial"
import type { AppState, GastoFormState, Movimiento, Persona, TransferenciaFormState } from "../../types"

type Setter<T> = (value: T | ((current: T) => T)) => void
type TutorialControllerOptions = {
  personas: Persona[]
  movimientos: Movimiento[]
  setPersonas: Setter<Persona[]>
  setMovimientos: Setter<Movimiento[]>
  setNombre: Setter<string>
  setGasto: Setter<GastoFormState>
  setTransferencia: Setter<TransferenciaFormState>
  setMovementTab: Setter<"gasto" | "transferencia">
  setMobileMovementPage: Setter<number>
  setActiveSection: Setter<MobileSection>
  setDesktopSection: Setter<MobileSection>
  setSettlementOpen: Setter<boolean>
  setResumenOpenPersona: Setter<Persona | null>
  setCalculosOpen: Setter<boolean>
  setGraficoOpen: Setter<boolean>
}

const sleep = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms))

export function useTutorialController(options: TutorialControllerOptions) {
  const [dialogOpen, setDialogOpen] = useState(() => !tutorialHidden())
  const [hideTutorial, setHideTutorial] = useState(false)
  const [demoActiveTarget, setDemoActiveTarget] = useState<string | null>(null)
  const driverRef = useRef<Driver | null>(null)
  const previousStateRef = useRef<AppState | null>(null)
  const completedDemosRef = useRef<Set<string>>(new Set())

  useEffect(() => () => driverRef.current?.destroy(), [])

  const closeDialog = (open: boolean) => {
    if (open) return setDialogOpen(true)
    if (hideTutorial) hideTutorialForever()
    setDialogOpen(false)
  }
  const skipTutorial = () => {
    if (hideTutorial) hideTutorialForever()
    setDialogOpen(false)
  }
  const typeInto = async (update: (value: string) => void, text: string, delay = 45) => {
    update("")
    for (let index = 1; index <= text.length; index += 1) {
      update(text.slice(0, index))
      await sleep(delay)
    }
  }
  const flashTarget = async (id: string) => {
    setDemoActiveTarget(id)
    await sleep(420)
    setDemoActiveTarget(null)
    await sleep(180)
  }
  const runPeopleDemo = async () => {
    if (completedDemosRef.current.has("personas")) return
    completedDemosRef.current.add("personas")
    const state = cloneTutorialState()
    options.setPersonas([])
    options.setMovimientos([])
    options.setNombre("")
    await nextPaint()
    for (const persona of state.personas) {
      await typeInto(options.setNombre, persona)
      await flashTarget("add-person-button")
      options.setPersonas((current) => current.includes(persona) ? current : [...current, persona])
      options.setNombre("")
      await sleep(300)
    }
  }
  const runMovementsDemo = async () => {
    if (completedDemosRef.current.has("movimientos")) return
    completedDemosRef.current.add("movimientos")
    const state = cloneTutorialState()
    options.setPersonas(state.personas)
    options.setMovimientos([])
    options.setMobileMovementPage(1)
    await nextPaint()
    for (const movimiento of state.movimientos) {
      if (movimiento.tipo === "gasto") {
        options.setMovementTab("gasto")
        options.setGasto({ descripcion: "", pagador: "", monto: "", participantes: [], categoria: CATEGORIA_DEFAULT })
        await nextPaint()
        await typeInto((value) => options.setGasto((current) => ({ ...current, descripcion: value })), movimiento.descripcion ?? "", 60)
        options.setGasto((current) => ({ ...current, monto: String(movimiento.monto) }))
        await sleep(450)
        options.setGasto((current) => ({ ...current, pagador: movimiento.pagador }))
        await sleep(450)
        options.setGasto((current) => ({ ...current, participantes: [...movimiento.participantes], categoria: movimiento.categoria }))
        await sleep(520)
        await flashTarget("add-expense-button")
        options.setMovimientos((current) => [...current, { ...movimiento, participantes: [...movimiento.participantes] }])
        options.setGasto({ descripcion: "", pagador: movimiento.pagador, monto: "", participantes: state.personas, categoria: movimiento.categoria })
        await sleep(420)
      } else {
        options.setMovementTab("transferencia")
        options.setTransferencia({ descripcion: "", de: "", a: "", monto: "" })
        await nextPaint()
        await typeInto((value) => options.setTransferencia((current) => ({ ...current, descripcion: value })), movimiento.descripcion ?? "", 60)
        options.setTransferencia((current) => ({ ...current, monto: String(movimiento.monto) }))
        await sleep(450)
        options.setTransferencia((current) => ({ ...current, de: movimiento.de }))
        await sleep(450)
        options.setTransferencia((current) => ({ ...current, a: movimiento.a }))
        await sleep(520)
        await flashTarget("add-transfer-button")
        options.setMovimientos((current) => [...current, { ...movimiento }])
        options.setTransferencia({ descripcion: "", de: movimiento.de, a: movimiento.a, monto: "" })
        await sleep(420)
      }
    }
  }
  const runSummaryDemo = async () => {
    if (completedDemosRef.current.has("resumen")) return
    completedDemosRef.current.add("resumen")
    const state = cloneTutorialState()
    options.setPersonas(state.personas)
    options.setMovimientos(state.movimientos)
    await nextPaint()
    options.setSettlementOpen(true)
    await sleep(900)
  }
  const runDemo = async (index: number) => {
    const demo = getTutorialStepsConfig()[index]?.demo
    if (demo === "personas") await runPeopleDemo()
    if (demo === "movimientos") await runMovementsDemo()
    if (demo === "resumen") await runSummaryDemo()
  }
  const prepareStep = async (index: number) => {
    const step = getTutorialStepsConfig()[index]
    if (!step) return
    if (isMobileViewport()) {
      options.setActiveSection(step.section)
      window.scrollTo({ top: 0, behavior: "auto" })
    } else options.setDesktopSection(step.section)
    options.setResumenOpenPersona(null)
    options.setCalculosOpen(false)
    options.setGraficoOpen(false)
    options.setSettlementOpen(step.selector === "[data-tour='repartir-dialog']")
    await nextPaint()
  }
  const startDriver = async () => {
    const { driver } = await import("driver.js")
    const tutorialSteps = getTutorialStepsConfig()
    const steps: DriveStep[] = tutorialSteps.map((step) => ({
      element: () => getTutorialElement(step),
      popover: { title: step.title, description: step.description, side: "bottom", align: "center" },
    }))
    let moving = false
    let guide: Driver
    const moveTo = async (index: number, start = false) => {
      if (moving) return
      moving = true
      try {
        await prepareStep(index)
        if (start) guide.drive(index)
        else guide.moveTo(index)
      } finally { moving = false }
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
      onNextClick: (_element, _step, { driver: activeDriver }) => {
        const currentIndex = activeDriver.getActiveIndex() ?? 0
        const nextIndex = currentIndex + 1
        if (nextIndex >= steps.length) return activeDriver.destroy()
        void (async () => {
          if (moving) return
          moving = true
          try {
            await runDemo(currentIndex)
            await prepareStep(nextIndex)
            activeDriver.moveTo(nextIndex)
          } finally { moving = false }
        })()
      },
      onPrevClick: (_element, _step, { driver: activeDriver }) => {
        const previousIndex = (activeDriver.getActiveIndex() ?? 0) - 1
        if (previousIndex >= 0) void moveTo(previousIndex)
      },
      onCloseClick: (_element, _step, { driver: activeDriver }) => activeDriver.destroy(),
      onDoneClick: (_element, _step, { driver: activeDriver }) => activeDriver.destroy(),
      onDestroyed: () => {
        const previousState = previousStateRef.current
        if (previousState) {
          options.setPersonas(previousState.personas)
          options.setMovimientos(previousState.movimientos)
          saveState(previousState)
          previousStateRef.current = null
        }
        options.setSettlementOpen(false)
        options.setResumenOpenPersona(null)
        options.setCalculosOpen(false)
        options.setGraficoOpen(false)
        setDemoActiveTarget(null)
        completedDemosRef.current = new Set()
        driverRef.current = null
      },
    })
    driverRef.current = guide
    await moveTo(0, true)
  }
  const startTutorial = async () => {
    previousStateRef.current = {
      personas: [...options.personas],
      movimientos: options.movimientos.map((movimiento) => movimiento.tipo === "gasto" ? { ...movimiento, participantes: [...movimiento.participantes] } : { ...movimiento }),
    }
    const emptyState: AppState = { personas: [], movimientos: [] }
    saveState(emptyState)
    options.setPersonas([])
    options.setMovimientos([])
    options.setGasto({ descripcion: "", pagador: "", monto: "", participantes: [], categoria: CATEGORIA_DEFAULT })
    options.setTransferencia({ descripcion: "", de: "", a: "", monto: "" })
    options.setMovementTab("gasto")
    completedDemosRef.current = new Set()
    options.setActiveSection("personas")
    options.setDesktopSection("personas")
    options.setSettlementOpen(false)
    options.setResumenOpenPersona(null)
    options.setCalculosOpen(false)
    options.setGraficoOpen(false)
    setDialogOpen(false)
    await nextPaint()
    await startDriver()
  }
  const acceptTutorial = async () => {
    if (hideTutorial) hideTutorialForever()
    await startTutorial()
  }

  return { dialogOpen, hideTutorial, demoActiveTarget, setHideTutorial, closeDialog, skipTutorial, startTutorial, acceptTutorial }
}
