import type { AppState } from "../types"

export type MobileSection = "personas" | "movimientos" | "resumen"
export type TutorialDemo = "personas" | "movimientos" | "resumen"

export type TutorialStepConfig = {
  section: MobileSection
  selector: string
  fallback?: string
  demo?: TutorialDemo
  title: string
  description: string
}

export const TUTORIAL_HIDDEN_KEY = "repartir-gastos:tutorial:hidden"

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

export const tutorialStepsConfig: TutorialStepConfig[] = [
  {
    section: "personas",
    selector: "[data-tour='bottom-nav']",
    title: "Repartí gastos en 3 simples pasos",
    description: "Cargá personas, agregá gastos y transferencias, y revisá el resumen para ver qué pagos hay que hacer.",
  },
  {
    section: "personas",
    selector: "[data-tour='personas']",
    demo: "personas",
    title: "Añadí personas",
    description: "Cargá las personas entre quienes se tienen que repartir los gastos.",
  },
  {
    section: "movimientos",
    selector: "[data-tour='movimientos']",
    demo: "movimientos",
    title: "Añadí gastos y transferencias",
    description: "Cargá el gasto, el monto, quién lo pagó y qué personas participaron. Si alguien ya le transfirió dinero a otra persona para cubrir parte de los gastos, registralo también para que el cálculo final lo tenga en cuenta.",
  },
  {
    section: "resumen",
    selector: "[data-tour='resumen']",
    demo: "resumen",
    title: "Todo listo!",
    description: "Presioná \"Repartir!\" para saber qué transferencias hay que hacer. También podés tocar una persona para ver su detalle.",
  },
  {
    section: "resumen",
    selector: "[data-tour='repartir-dialog']",
    fallback: "[data-tour='resumen']",
    title: "Estas son las transferencias que hay que hacer",
    description: "Presiona \"Compartir\" para pasarselo a los demás.",
  },
  {
    section: "resumen",
    selector: "[data-tour='actions-menu']",
    fallback: "[data-tour='resumen']",
    title: "Menú de acciones",
    description: "Desde acá podés graficar gastos por categoría, revisar cálculos paso a paso o limpiar todos los datos.",
  },
]

export function nextPaint() {
  return new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))
}

export function tutorialHidden() {
  try {
    return localStorage.getItem(TUTORIAL_HIDDEN_KEY) === "1"
  } catch {
    return false
  }
}

export function hideTutorialForever() {
  try {
    localStorage.setItem(TUTORIAL_HIDDEN_KEY, "1")
  } catch {
    // Sin almacenamiento, solo se omite esta sesión.
  }
}

export function cloneTutorialState(): AppState {
  return {
    personas: [...tutorialMockState.personas],
    movimientos: tutorialMockState.movimientos.map((movimiento) => (
      movimiento.tipo === "gasto" ? { ...movimiento, participantes: [...movimiento.participantes] } : { ...movimiento }
    )),
  }
}

export function getTutorialElement(step: TutorialStepConfig) {
  return document.querySelector(step.selector) ?? (step.fallback ? document.querySelector(step.fallback) : null) ?? document.body
}
