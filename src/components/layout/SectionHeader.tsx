import type { ReactNode } from "react"

export function SectionHeader({
  icon,
  title,
  description,
  variant,
  action,
}: {
  icon: ReactNode
  title: string
  description: ReactNode
  variant: "people" | "movements" | "summary" | "total"
  action?: ReactNode
}) {
  return (
    <div className="section-head">
      <div className={`section-title section-title-${variant}`}>
        <span className="section-icon">{icon}</span>
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      </div>
      {action}
    </div>
  )
}
