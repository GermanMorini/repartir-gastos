import type { ReactNode } from "react"

export function DesktopLayout({ children }: { children: ReactNode }) {
  return <div className="app-grid">{children}</div>
}
