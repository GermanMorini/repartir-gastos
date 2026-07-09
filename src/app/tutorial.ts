import type { AppState, Persona } from "../types"
import { isMobileViewport } from "../lib/viewport"

export type MobileSection = "personas" | "movimientos" | "resumen" | "total"

export type TutorialStepConfig = {
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
  { section: "personas", selector: "[data-tour='personas']", title: "Añadí personas", description: "Añadí las personas entre quienes se tienen que repartir los gastos" },
  { section: "movimientos", selector: "[data-tour='movimientos']", title: "Añadí todos los gastos y transferencias", description: "Escribí el nombre del gasto, el monto, quién pagó y entre quiénes se reparte. Podés añadir una categoría si querés" },
  { section: "movimientos", selector: () => (isMobileViewport() ? "[data-tour='copy-movimientos-mobile']" : "[data-tour='copy-movimientos-desktop']"), fallback: "[data-tour='movimientos']", title: "¿Falta algo?", description: "Compartí esto con tus contactos para ver qué es lo que falta." },
  { section: "resumen", selector: "[data-tour='resumen']", title: "Revisá los cálculos", description: "Tocá una persona para ver lo que tiene que gastar y lo que pagó." },
  { section: "resumen", selector: "[data-tour='resumen-norberto-dialog']", fallback: "[data-tour='resumen']", opensResumen: "Norberto", title: "Resumen de Norberto", description: "Acá ves cuánto le tocaba gastar, cuánto pagó y su resultado final. Podés compartirlo con él para que sepa cuánto debe." },
  { section: "resumen", selector: "[data-tour='calculos']", fallback: "[data-tour='resumen']", title: "¿No podés creer lo que debés?", description: "Revisá los cálculos paso a paso para estar seguro" },
  { section: "resumen", selector: "[data-tour='calculos-dialog']", fallback: "[data-tour='resumen']", opensCalculos: true, title: "Matriz de cálculos", description: "Acá ves cómo cada movimiento cambia el saldo de cada persona." },
  { section: "total", selector: "[data-tour='total']", title: "Todo listo!", description: "Tocá 'Repartir!' para saber quién le transfiere a quién" },
  { section: "total", selector: "[data-tour='grafico']", fallback: "[data-tour='total']", title: "¿No sabés en qué se gastó tanto?", description: "Podés comparar categorías para saber en qué se fue la plata" },
  { section: "total", selector: "[data-tour='grafico-dialog']", fallback: "[data-tour='total']", opensGrafico: true, title: "Gráfico por categoría", description: "El gráfico muestra en qué categorías se concentró el gasto." },
  { section: "total", selector: "[data-tour='repartir-dialog']", fallback: "[data-tour='total']", opensSettlement: true, title: "Pasale esto a tus contactos", description: "Compartile esto a los demás para que sepan cuánto deben" },
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
  const selector = typeof step.selector === "function" ? step.selector() : step.selector
  return document.querySelector(selector) ?? (step.fallback ? document.querySelector(step.fallback) : null) ?? document.body
}
