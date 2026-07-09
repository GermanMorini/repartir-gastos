import { forwardRef } from "react"
import type { ComponentProps } from "react"
import { SlidingText } from "../../components/shared/SlidingText"
import { cn } from "../../lib/utils"
import { formatoARS } from "../../lib/money"
import type { Persona } from "../../types"

export const PersonaResumenItem = forwardRef<HTMLButtonElement, ComponentProps<"button"> & {
  persona: Persona
  saldo: number
}>(function PersonaResumenItem({ className, persona, saldo, ...props }, ref) {
  return (
    <button className={cn("summary-person", className)} ref={ref} type="button" {...props}>
      <div className={saldo > 0 ? "avatar avatar-positive" : "avatar"}>{persona[0].toUpperCase()}</div>
      <SlidingText className="summary-name">{persona}</SlidingText>
      <div className="summary-balance">
        <span className={saldo > 0 ? "positive" : saldo < 0 ? "negative" : ""}>{formatoARS.format(saldo)}</span>
        <small>Pendiente</small>
      </div>
    </button>
  )
})
