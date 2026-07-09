export const formatoARS = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" })

export function formatoSaldoMatriz(monto: number) {
  const centavos = Math.round(monto * 100)
  const valor = formatoARS.format(Math.abs(monto)).replace(/\s/g, "")
  if (centavos === 0) return valor
  return `${centavos > 0 ? "+" : "-"}${valor}`
}

export function porcentaje(porcentaje: number) {
  return `${Number.isInteger(porcentaje) ? porcentaje : porcentaje.toFixed(1)}%`
}
