import { formatoARS } from "../../lib/money"

export function MoneyAmount({ value, className = "" }: { value: number; className?: string }) {
  return <strong className={className}>{formatoARS.format(value)}</strong>
}
