export type BalancePresentation = { label: "A favor" | "Debe" | "Al día"; className: "positive" | "negative" | "neutral" }

export function getBalancePresentation(saldo: number): BalancePresentation {
  const cents = decimal(saldo).mul(100).toDecimalPlaces(0)
  if (cents.gt(0)) return { label: "A favor", className: "positive" }
  if (cents.lt(0)) return { label: "Debe", className: "negative" }
  return { label: "Al día", className: "neutral" }
}
import { decimal } from "./ledger"
