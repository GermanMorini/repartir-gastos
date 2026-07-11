import { UsersIcon } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { SectionHeader } from "../../components/layout/SectionHeader"
import { PaginationControls } from "../../components/shared/PaginationControls"
import { Badge } from "@/components/ui/badge"
import { useIsMobile } from "../../lib/viewport"
import type { Persona } from "../../types"
import { PersonaForm } from "./PersonaForm"
import { PersonaItem } from "./PersonaItem"

export function PersonasSection({
  className,
  personas,
  nombre,
  onNombreChange,
  onAdd,
  onDelete,
  onStartTutorial,
  demoActiveTarget,
  suppressListAnimation,
}: {
  className: string
  personas: Persona[]
  nombre: string
  onNombreChange: (nombre: string) => void
  onAdd: () => void
  onDelete: (persona: Persona) => void
  onStartTutorial: () => void
  demoActiveTarget?: string | null
  suppressListAnimation?: boolean
}) {
  const isMobile = useIsMobile()
  const [page, setPage] = useState(1)
  const [pageDirection, setPageDirection] = useState<"next" | "prev">("next")
  const [pageAnimating, setPageAnimating] = useState(false)
  const pageAnimationTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null)
  const pageSize = isMobile ? 4 : personas.length || 1
  const totalPages = Math.max(1, Math.ceil(personas.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const visiblePersonas = personas.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const goToPage = (nextPage: number) => {
    setPageDirection(nextPage > currentPage ? "next" : "prev")
    setPageAnimating(true)
    if (pageAnimationTimerRef.current) window.clearTimeout(pageAnimationTimerRef.current)
    pageAnimationTimerRef.current = window.setTimeout(() => setPageAnimating(false), 190)
    setPage(nextPage)
  }

  useEffect(() => () => {
    if (pageAnimationTimerRef.current) window.clearTimeout(pageAnimationTimerRef.current)
  }, [])

  return (
    <section className={`app-section people-section ${className}`} id="personas" data-tour="personas">
      <SectionHeader
        icon={<UsersIcon />}
        title="Personas"
        description="Añadí las personas que participan en los gastos."
        variant="people"
        action={<div className="people-actions"><span>{personas.length} personas</span></div>}
      />
      <div className={`person-chips ${pageAnimating && !suppressListAnimation ? `page-slide-${pageDirection}` : ""}`} key={currentPage}>
        {personas.length === 0 ? <Badge className="empty-state-badge">Sin personas</Badge> : null}
        {visiblePersonas.map((persona) => <PersonaItem key={persona} persona={persona} onDelete={onDelete} />)}
      </div>
      {isMobile ? <PaginationControls page={currentPage} totalPages={totalPages} onPage={goToPage} /> : null}
      <PersonaForm demoActiveTarget={demoActiveTarget} nombre={nombre} onChange={onNombreChange} onAdd={onAdd} />
      <p className="people-tutorial-hint">
        ¿No sabés que hacer? haz <button onClick={onStartTutorial} type="button">este</button> tutorial para comenzar
      </p>
      <p className="site-footer-inline">
        ¿Te gustó la aplicación? Seguime en <a href="https://github.com/GermanMorini/repartir-gastos" rel="noreferrer" target="_blank">github</a>
      </p>
    </section>
  )
}
