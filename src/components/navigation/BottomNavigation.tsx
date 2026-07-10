import { ArrowLeftRightIcon, PieChartIcon, UsersIcon } from "lucide-react"
import type { MobileSection } from "../../app/tutorial"

export function BottomNavigation({ activeSection, onChange }: { activeSection: MobileSection; onChange: (section: MobileSection) => void }) {
  return (
    <nav className="mobile-nav" aria-label="Navegación principal">
      <button className={activeSection === "personas" ? "active" : ""} onClick={() => onChange("personas")} type="button"><UsersIcon />Personas</button>
      <button className={activeSection === "movimientos" ? "active" : ""} onClick={() => onChange("movimientos")} type="button"><ArrowLeftRightIcon />Movimientos</button>
      <button className={activeSection === "resumen" ? "active" : ""} onClick={() => onChange("resumen")} type="button"><PieChartIcon />Resumen</button>
    </nav>
  )
}
