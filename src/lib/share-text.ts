import { formatoARS } from "./money"
import type { Movimiento, Persona, ResumenCategoria } from "../types"
import type { getResumenPersona } from "./calculos"

type Gasto = Extract<Movimiento, { tipo: "gasto" }>
type Transferencia = Extract<Movimiento, { tipo: "transferencia" }>
type ResumenPersona = ReturnType<typeof getResumenPersona>

export function nombreMovimiento(movimiento: Movimiento) {
  return movimiento.descripcion?.trim() || (movimiento.tipo === "gasto" ? "Gasto" : "Transferencia")
}

function resultadoCopiable(resumen: ResumenPersona) {
  const centavos = Math.round(resumen.saldo * 100)
  if (centavos < 0) return `debe pagar ${formatoARS.format(Math.abs(resumen.saldo))}`
  if (centavos > 0) return `le deben pagar ${formatoARS.format(resumen.saldo)}`
  return "está al día"
}

export function textoResumenPersona(resumen: ResumenPersona) {
  const detalle = [
    ...resumen.gastosDondeParticipo.map(({ movimiento, montoParte }) => `- ${nombreMovimiento(movimiento)}: ${formatoARS.format(montoParte)} de ${formatoARS.format(movimiento.monto)}`),
    ...resumen.gastosQuePago.map(({ movimiento, montoAportado }) => `- ${nombreMovimiento(movimiento)}: puso ${formatoARS.format(montoAportado)}`),
    ...resumen.transferenciasEnviadas.map((movimiento) => `- Pagó a ${movimiento.a}: ${formatoARS.format(movimiento.monto)}`),
    ...resumen.transferenciasRecibidas.map((movimiento) => `- Recibió de ${movimiento.de}: ${formatoARS.format(movimiento.monto)}`),
  ]

  return [
    `Hoja de liquidación de ${resumen.persona}:`,
    `- Le tocaba gastar: ${formatoARS.format(resumen.totalLeTocaba)}`,
    `- Ya pagó: ${formatoARS.format(resumen.totalSalioBolsillo)}`,
    `- Recibió: ${formatoARS.format(resumen.totalRecibido)}`,
    `- Saldo: ${resultadoCopiable(resumen)}`,
    ...(detalle.length ? ["", "Detalle:", ...detalle] : []),
  ].join("\n")
}

export function textoCategorias(totalGastado: number, gastosPorCategoria: ResumenCategoria[], porcentaje: (porcentaje: number) => string) {
  return [
    "Gastos por categoría:",
    `Total: ${formatoARS.format(totalGastado)}`,
    "",
    ...gastosPorCategoria.map((item) => `- ${item.label}: ${formatoARS.format(item.monto)} (${porcentaje(item.porcentaje)}, ${item.cantidadGastos} ${item.cantidadGastos === 1 ? "gasto" : "gastos"})`),
  ].join("\n")
}

export function textoMovimientos(personas: Persona[], movimientos: Movimiento[]) {
  const gastos = movimientos.filter((movimiento): movimiento is Gasto => movimiento.tipo === "gasto")
  const transferencias = movimientos.filter((movimiento): movimiento is Transferencia => movimiento.tipo === "transferencia")
  const nombreCopiado = (persona: Persona) => persona.toUpperCase()
  const abreviaturas = new Map(personas.map((persona) => [persona, 1]))
  let cambio = true
  while (cambio) {
    cambio = false
    const grupos = new Map<string, Persona[]>()
    personas.forEach((persona) => {
      const clave = nombreCopiado(persona).slice(0, abreviaturas.get(persona))
      grupos.set(clave, [...(grupos.get(clave) ?? []), persona])
    })
    grupos.forEach((grupo) => {
      if (grupo.length < 2) return
      grupo.forEach((persona) => {
        const largo = abreviaturas.get(persona) ?? 1
        if (largo < nombreCopiado(persona).length) {
          abreviaturas.set(persona, largo + 1)
          cambio = true
        }
      })
    })
  }
  const inicialCopiada = (persona: Persona) => nombreCopiado(persona).slice(0, abreviaturas.get(persona))
  const bloques = personas
    .map((persona) => {
      const propios = gastos.filter((movimiento) => movimiento.pagador === persona || ((movimiento.aportes?.[persona] ?? 0) > 0))
      if (propios.length === 0) return ""
      return [
        `${nombreCopiado(persona)}:`,
        ...propios.map((movimiento) => {
          const aportes = movimiento.modoPago === "pago_multiple" && movimiento.aportes
            ? `; aportes: ${Object.entries(movimiento.aportes).filter(([, monto]) => monto > 0).map(([persona, monto]) => `${inicialCopiada(persona)} ${formatoARS.format(monto)}`).join(", ")}`
            : ""
          return `- \`${nombreMovimiento(movimiento)}\`: *${formatoARS.format(movimiento.monto)}* (entre ${movimiento.participantes.map(inicialCopiada).join(", ")}${aportes})`
        }),
      ].join("\n")
    })
    .filter(Boolean)

  return [
    "Tengo anotados estos gastos:",
    "",
    ...bloques.flatMap((bloque) => [bloque, ""]),
    ...(transferencias.length ? ["TRANSFERENCIAS:", ...transferencias.map((movimiento) => `- *${formatoARS.format(movimiento.monto)}* (de ${nombreCopiado(movimiento.de)} a ${nombreCopiado(movimiento.a)})`)] : []),
  ].join("\n").trim()
}
