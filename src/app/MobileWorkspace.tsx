import type { ReactNode } from "react"

export function MobileWorkspace({ children }: { children: ReactNode }) {
  return <div className="app-grid">{children}</div>
}
