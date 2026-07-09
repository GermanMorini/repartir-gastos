import type { ReactNode } from "react"

export function MobileLayout({ children }: { children: ReactNode }) {
  return <div className="app-grid">{children}</div>
}
