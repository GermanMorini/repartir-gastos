export type Persona = string
export type CategoriaGasto = "comida" | "bebida" | "transporte" | "salud" | "ocio" | "alojamiento" | "hogar" | "otros"

export type Movimiento =
  | {
      tipo: "gasto"
      descripcion?: string
      pagador: Persona
      monto: number
      participantes: Persona[]
      categoria: CategoriaGasto
    }
  | {
      tipo: "transferencia"
      descripcion?: string
      de: Persona
      a: Persona
      monto: number
    }

export type SaldoPersona = {
  persona: Persona
  saldo: number
  totalPagadoEnGastos: number
  totalDebidoEnGastos: number
  totalTransferido: number
  totalRecibido: number
  totalSalioBolsillo: number
}

export type TransferenciaPendiente = {
  de: Persona
  a: Persona
  monto: number
}

export type FilaCalculo = {
  paso: number
  movimiento: string
  monto: number
  personaDestacada: Persona
  saldos: Record<Persona, number>
}

export type ResumenCategoria = {
  categoria: CategoriaGasto
  label: string
  monto: number
  cantidadGastos: number
  porcentaje: number
}

export type AppState = {
  personas: Persona[]
  movimientos: Movimiento[]
}
