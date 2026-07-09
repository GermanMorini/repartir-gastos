import Decimal from "decimal.js"
import { getCategoria, getCategoriaOrden } from "./categorias.ts"
import type { FilaCalculo, Movimiento, Persona, ResumenCategoria, SaldoPersona, TransferenciaPendiente } from "../types/index.ts"

/**
 * Algoritmo usado por la app.
 *
 * La app calcula un saldo pendiente por persona.
 * En palabras simples:
 * - si alguien puso más dinero del que le tocaba gastar, queda con saldo positivo;
 * - si alguien puso menos dinero del que le tocaba gastar, queda con saldo negativo;
 * - las transferencias registradas son pagos ya realizados y ajustan ese saldo.
 *
 * Fórmula central:
 * saldo = gastos que pagó + pagos que envió - pagos que recibió - parte que le tocaba
 *
 * Después, las transferencias pendientes se generan uniendo saldos negativos
 * con saldos positivos. Quien tiene saldo negativo paga. Quien tiene saldo
 * positivo cobra. El emparejamiento es greedy: toma el primer deudor y el
 * primer acreedor, mueve el menor monto posible y avanza cuando alguno queda
 * saldado.
 *
 * Decimal.js se usa en todo el cálculo para evitar errores de coma flotante.
 * Solo se redondea a moneda al devolver datos para UI/tests.
 */
type SaldoInterno = Omit<SaldoPersona, "saldo" | "totalPagadoEnGastos" | "totalDebidoEnGastos" | "totalTransferido" | "totalRecibido" | "totalSalioBolsillo"> & {
  saldo: Decimal
  totalPagadoEnGastos: Decimal
  totalDebidoEnGastos: Decimal
  totalTransferido: Decimal
  totalRecibido: Decimal
  totalSalioBolsillo: Decimal
}

const decimal = (monto: Decimal.Value) => new Decimal(monto)
const redondearMoneda = (monto: Decimal.Value) => decimal(monto).toDecimalPlaces(2).toNumber()

/** Devuelve la parte de un gasto que corresponde a una persona. */
function parteGasto(movimiento: Extract<Movimiento, { tipo: "gasto" }>, persona: Persona) {
  if (!movimiento.participantes.includes(persona) || movimiento.participantes.length === 0) return decimal(0)
  return decimal(movimiento.monto).div(movimiento.participantes.length)
}

/**
 * Aplica un movimiento al saldo acumulado.
 *
 * Gasto:
 * - el pagador suma el monto completo porque puso dinero;
 * - cada participante resta su parte porque eso era lo que le tocaba gastar.
 *
 * Transferencia registrada:
 * - "de" suma porque ya pagó dinero;
 * - "a" resta porque ya recibió dinero.
 */
function aplicarMovimiento(movimiento: Movimiento, existe: (persona: Persona) => boolean, aplicar: (persona: Persona, monto: Decimal) => void) {
  if (movimiento.tipo === "gasto") {
    if (!existe(movimiento.pagador) || movimiento.participantes.length === 0) return
    aplicar(movimiento.pagador, decimal(movimiento.monto))
    for (const persona of movimiento.participantes) {
      if (existe(persona)) aplicar(persona, decimal(movimiento.monto).div(movimiento.participantes.length).neg())
    }
    return
  }

  if (!existe(movimiento.de) || !existe(movimiento.a)) return
  aplicar(movimiento.de, decimal(movimiento.monto))
  aplicar(movimiento.a, decimal(movimiento.monto).neg())
}

function textoMovimientoCalculo(movimiento: Movimiento) {
  return movimiento.descripcion?.trim() || (movimiento.tipo === "gasto" ? "Gasto" : "Pago realizado")
}

/**
 * Calcula el saldo pendiente de cada persona.
 *
 * Este es el cálculo principal que usa el resumen, el reparto final y las
 * validaciones. También guarda subtotales para explicar el resultado:
 * - totalPagadoEnGastos: gastos que pagó como pagador;
 * - totalDebidoEnGastos: suma de sus partes en gastos donde participó;
 * - totalTransferido: pagos realizados que envió;
 * - totalRecibido: pagos realizados que recibió;
 * - totalSalioBolsillo: gastos pagados + pagos enviados.
 */
export function calcularSaldos(personas: Persona[], movimientos: Movimiento[]): SaldoPersona[] {
  // Arranca cada persona en cero para poder acumular sus totales.
  const saldos = new Map<Persona, SaldoInterno>(
    personas.map((persona) => [
      persona,
      {
        persona,
        saldo: decimal(0),
        totalPagadoEnGastos: decimal(0),
        totalDebidoEnGastos: decimal(0),
        totalTransferido: decimal(0),
        totalRecibido: decimal(0),
        totalSalioBolsillo: decimal(0),
      },
    ]),
  )

  for (const movimiento of movimientos) {
    if (movimiento.tipo === "gasto") {
      const pagador = saldos.get(movimiento.pagador)
      if (!pagador || movimiento.participantes.length === 0) continue

      // El pagador puso el total del gasto desde su bolsillo.
      const monto = movimiento.monto
      pagador.totalPagadoEnGastos = pagador.totalPagadoEnGastos.plus(monto)

      // Cada participante debe solo su parte de este gasto.
      for (const persona of movimiento.participantes) {
        const saldo = saldos.get(persona)
        if (!saldo) continue
        const debe = parteGasto(movimiento, persona)
        saldo.totalDebidoEnGastos = saldo.totalDebidoEnGastos.plus(debe)
      }
    } else {
      const origen = saldos.get(movimiento.de)
      const destino = saldos.get(movimiento.a)
      if (!origen || !destino) continue

      // Una transferencia registrada es plata que ya se pagó.
      const monto = movimiento.monto
      origen.totalTransferido = origen.totalTransferido.plus(monto)
      destino.totalRecibido = destino.totalRecibido.plus(monto)
    }

    // Mantiene el saldo acumulado para usar la misma regla en otras vistas.
    aplicarMovimiento(
      movimiento,
      (persona) => saldos.has(persona),
      (persona, monto) => {
        const saldo = saldos.get(persona)
        if (saldo) saldo.saldo = saldo.saldo.plus(monto)
      },
    )
  }

  // Devuelve números listos para mostrar: moneda redondeada a dos decimales.
  return [...saldos.values()].map((saldo) => ({
    ...saldo,
    saldo: redondearMoneda(saldo.totalPagadoEnGastos.plus(saldo.totalTransferido).minus(saldo.totalRecibido).minus(saldo.totalDebidoEnGastos)),
    totalPagadoEnGastos: redondearMoneda(saldo.totalPagadoEnGastos),
    totalDebidoEnGastos: redondearMoneda(saldo.totalDebidoEnGastos),
    totalTransferido: redondearMoneda(saldo.totalTransferido),
    totalRecibido: redondearMoneda(saldo.totalRecibido),
    totalSalioBolsillo: redondearMoneda(saldo.totalPagadoEnGastos.plus(saldo.totalTransferido)),
  }))
}

/**
 * Genera pagos pendientes desde deudores hacia acreedores.
 *
 * Entrada:
 * - saldo < 0: persona debe pagar;
 * - saldo > 0: persona debe recibir.
 *
 * El algoritmo no busca una combinación "más linda"; usa el emparejamiento
 * mínimo suficiente para saldar todos los balances.
 */
export function calcularTransferenciasPendientes(saldos: SaldoPersona[]): TransferenciaPendiente[] {
  const acreedores = saldos
    .filter((saldo) => decimal(saldo.saldo).gt(0))
    .map((saldo) => ({ persona: saldo.persona, monto: decimal(saldo.saldo) }))
  const deudores = saldos
    .filter((saldo) => decimal(saldo.saldo).lt(0))
    .map((saldo) => ({ persona: saldo.persona, monto: decimal(saldo.saldo).abs() }))
  const transferencias: TransferenciaPendiente[] = []

  let i = 0
  let j = 0
  while (i < deudores.length && j < acreedores.length) {
    const monto = Decimal.min(deudores[i].monto, acreedores[j].monto)
    if (monto.gt(0)) transferencias.push({ de: deudores[i].persona, a: acreedores[j].persona, monto: redondearMoneda(monto) })
    deudores[i].monto = deudores[i].monto.minus(monto)
    acreedores[j].monto = acreedores[j].monto.minus(monto)
    if (deudores[i].monto.isZero()) i += 1
    if (acreedores[j].monto.isZero()) j += 1
  }

  return transferencias
}

/**
 * Construye la matriz paso a paso que se muestra en "Cálculos".
 *
 * Cada fila muestra el saldo acumulado después de aplicar un movimiento.
 * Sirve para auditar cómo se llega al saldo final de cada persona.
 */
export function getMatrizCalculos(personas: Persona[], movimientos: Movimiento[]): FilaCalculo[] {
  const saldos = new Map<Persona, Decimal>(personas.map((persona) => [persona, decimal(0)]))
  const fila = (paso: number, movimiento: string, monto: number, personaDestacada: Persona): FilaCalculo => ({
    paso,
    movimiento,
    monto,
    personaDestacada,
    saldos: Object.fromEntries(personas.map((persona) => [persona, redondearMoneda(saldos.get(persona) ?? 0)])),
  })
  const filas: FilaCalculo[] = []

  movimientos.forEach((movimiento, index) => {
    aplicarMovimiento(
      movimiento,
      (persona) => saldos.has(persona),
      (persona, monto) => saldos.set(persona, (saldos.get(persona) ?? decimal(0)).plus(monto)),
    )
    filas.push(fila(index + 1, textoMovimientoCalculo(movimiento), movimiento.monto, movimiento.tipo === "gasto" ? movimiento.pagador : movimiento.de))
  })

  return filas
}

/** Agrupa solo gastos por categoría; las transferencias no son consumo. */
export function getGastosPorCategoria(movimientos: Movimiento[]): ResumenCategoria[] {
  const grupos = new Map<string, { monto: Decimal; cantidadGastos: number }>()

  for (const movimiento of movimientos) {
    if (movimiento.tipo !== "gasto") continue
    const actual = grupos.get(movimiento.categoria) ?? { monto: decimal(0), cantidadGastos: 0 }
    grupos.set(movimiento.categoria, { monto: actual.monto.plus(movimiento.monto), cantidadGastos: actual.cantidadGastos + 1 })
  }

  const total = [...grupos.values()].reduce((acc, item) => acc.plus(item.monto), decimal(0))

  return [...grupos.entries()]
    .map(([categoria, item]) => {
      const meta = getCategoria(categoria as ResumenCategoria["categoria"])
      return {
        categoria: meta.key,
        label: meta.label,
        monto: redondearMoneda(item.monto),
        cantidadGastos: item.cantidadGastos,
        porcentaje: total.isZero() ? 0 : redondearMoneda(item.monto.mul(100).div(total)),
      }
    })
    .sort((a, b) => getCategoriaOrden(a.categoria) - getCategoriaOrden(b.categoria))
}

/**
 * Devuelve el resumen de una persona.
 *
 * Reutiliza calcularSaldos para no tener una segunda lógica de saldos.
 * Además arma listas de detalle para el recibo: gastos donde participó,
 * gastos que pagó, pagos enviados y pagos recibidos.
 */
export function getResumenPersona(persona: Persona, movimientos: Movimiento[]) {
  const personas = Array.from(new Set([persona, ...movimientos.flatMap((movimiento) => (movimiento.tipo === "gasto" ? [movimiento.pagador, ...movimiento.participantes] : [movimiento.de, movimiento.a]))]))
  const saldo = calcularSaldos(personas, movimientos).find((item) => item.persona === persona)
  const totalPuesto = saldo?.totalPagadoEnGastos ?? 0
  const totalLeTocaba = saldo?.totalDebidoEnGastos ?? 0
  const totalTransferido = saldo?.totalTransferido ?? 0
  const totalRecibido = saldo?.totalRecibido ?? 0
  const totalSalioBolsillo = saldo?.totalSalioBolsillo ?? redondearMoneda(decimal(totalPuesto).plus(totalTransferido))
  const saldoPendiente = redondearMoneda(decimal(totalSalioBolsillo).minus(totalRecibido).minus(totalLeTocaba))
  const gastosDondeParticipo = movimientos
    .filter((movimiento): movimiento is Extract<Movimiento, { tipo: "gasto" }> => movimiento.tipo === "gasto" && movimiento.participantes.includes(persona))
    .map((movimiento) => ({ movimiento, montoParte: redondearMoneda(parteGasto(movimiento, persona)) }))
  const gastosQuePago = movimientos.filter((movimiento): movimiento is Extract<Movimiento, { tipo: "gasto" }> => movimiento.tipo === "gasto" && movimiento.pagador === persona)
  const transferenciasEnviadas = movimientos.filter((movimiento): movimiento is Extract<Movimiento, { tipo: "transferencia" }> => movimiento.tipo === "transferencia" && movimiento.de === persona)
  const transferenciasRecibidas = movimientos.filter((movimiento): movimiento is Extract<Movimiento, { tipo: "transferencia" }> => movimiento.tipo === "transferencia" && movimiento.a === persona)

  return {
    persona,
    totalPuesto,
    totalLeTocaba,
    totalTransferido,
    totalRecibido,
    totalSalioBolsillo,
    saldo: saldoPendiente,
    saldoPendiente,
    resultadoFinal: totalLeTocaba,
    gastosDondeParticipo,
    gastosQuePago,
    transferenciasEnviadas,
    transferenciasRecibidas,
    tieneMovimientos: gastosDondeParticipo.length + gastosQuePago.length + transferenciasEnviadas.length + transferenciasRecibidas.length > 0,
  }
}
