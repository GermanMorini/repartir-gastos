import { useEffect, useRef, useState } from "react"
import type { Persona } from "../../types"

export function useOverlayState() {
  const [mobileActionsOpen, setMobileActionsOpen] = useState(false)
  const [mobileMovementSheetOpen, setMobileMovementSheetOpen] = useState(false)
  const [mobileActionsView, setMobileActionsView] = useState<"menu" | "grafico" | "calculos">("menu")
  const [mobileActionsDirection, setMobileActionsDirection] = useState<"forward" | "back">("forward")
  const [mobileActionsPanelAnimating, setMobileActionsPanelAnimating] = useState(false)
  const [settlementOpen, setSettlementOpen] = useState(false)
  const [resumenOpenPersona, setResumenOpenPersona] = useState<Persona | null>(null)
  const [resumenClosing, setResumenClosing] = useState(false)
  const [calculosOpen, setCalculosOpen] = useState(false)
  const [graficoOpen, setGraficoOpen] = useState(false)
  const summaryTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null)

  useEffect(() => () => { if (summaryTimerRef.current) window.clearTimeout(summaryTimerRef.current) }, [])

  const openPersonSummary = (persona: Persona | null) => {
    if (summaryTimerRef.current) window.clearTimeout(summaryTimerRef.current)
    setResumenClosing(false)
    setResumenOpenPersona(persona)
  }
  const closePersonSummary = () => {
    setResumenClosing(true)
    summaryTimerRef.current = window.setTimeout(() => {
      setResumenOpenPersona(null)
      setResumenClosing(false)
      summaryTimerRef.current = null
    }, 180)
  }
  const openMobileAction = (view: "grafico" | "calculos") => {
    setMobileActionsDirection("forward")
    setMobileActionsPanelAnimating(true)
    setMobileActionsView(view)
  }
  const backToMobileActions = () => {
    setMobileActionsDirection("back")
    setMobileActionsPanelAnimating(true)
    setMobileActionsView("menu")
  }

  return {
    mobileActionsOpen, mobileMovementSheetOpen, mobileActionsView, mobileActionsDirection,
    mobileActionsPanelAnimating, settlementOpen, resumenOpenPersona, resumenClosing, calculosOpen,
    graficoOpen, setMobileActionsOpen, setMobileMovementSheetOpen, setMobileActionsView,
    setMobileActionsDirection, setMobileActionsPanelAnimating, setSettlementOpen,
    setResumenOpenPersona, setCalculosOpen, setGraficoOpen, openPersonSummary,
    closePersonSummary, openMobileAction, backToMobileActions,
  }
}
