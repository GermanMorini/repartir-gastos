import { ReceiptTextIcon, UserIcon, UsersIcon, WalletCardsIcon } from "lucide-react"
import type { MobileSection } from "../../app/tutorial"

export function BottomNavigation({ activeSection, onChange }: { activeSection: MobileSection; onChange: (section: MobileSection) => void }) {
  return (
    <nav className="mobile-nav" aria-label="Navegación principal">
      <button className={activeSection === "personas" ? "active" : ""} onClick={() => onChange("personas")} type="button"><UsersIcon />Personas</button>
      <button className={activeSection === "movimientos" ? "active" : ""} onClick={() => onChange("movimientos")} type="button"><ReceiptTextIcon />Movimientos</button>
      <button className={activeSection === "resumen" ? "active" : ""} onClick={() => onChange("resumen")} type="button"><UserIcon />Resumen</button>
      <button className={activeSection === "total" ? "active" : ""} onClick={() => onChange("total")} type="button"><WalletCardsIcon />Total</button>
    </nav>
  )
}
