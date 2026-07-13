import { ArrowLeftRightIcon, PieChartIcon, Shredder, UsersIcon } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { ConfirmDialog } from "../../components/shared/ConfirmDialog"
import type { DesktopSection } from "../desktop-types"

export function DesktopSidebar({ section, peopleCount, movementCount, onSectionChange, onClear }: { section: DesktopSection; peopleCount: number; movementCount: number; onSectionChange: (section: DesktopSection) => void; onClear: () => void }) {
  const items = [
    { section: "personas" as const, label: "Personas", meta: `${peopleCount} personas`, icon: UsersIcon },
    { section: "movimientos" as const, label: "Movimientos", meta: `${movementCount} movimientos`, icon: ArrowLeftRightIcon },
    { section: "resumen" as const, label: "Resumen", meta: "Ver saldos", icon: PieChartIcon },
  ]
  return (
    <aside className="desktop-sidebar" data-tour="desktop-sidebar">
      <div className="desktop-brand"><span><UsersIcon /></span><div><strong>Repartir gastos</strong><small>Organizá tus gastos fácilmente</small></div></div>
      <nav>
        {items.map((item) => {
          const Icon = item.icon
          return <button className={`desktop-sidebar-item nav-${item.section} ${section === item.section ? `active active-${item.section}` : ""}`} key={item.section} onClick={() => onSectionChange(item.section)} type="button"><Icon /><span>{item.label}<small>{item.meta}</small></span></button>
        })}
      </nav>
      <Separator />
      <ConfirmDialog title="Limpiar datos" description="Esto elimina todos los datos ingresados hasta el momento." confirmText="Limpiar datos" onConfirm={onClear}>
        <button className="desktop-settings" type="button"><Shredder />Limpiar datos</button>
      </ConfirmDialog>
    </aside>
  )
}
