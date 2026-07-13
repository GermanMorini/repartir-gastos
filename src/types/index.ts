export type Persona = string
export type CategoriaGasto = "comida" | "bebida" | "transporte" | "combustible" | "salud" | "ocio" | "alojamiento" | "hogar" | "otros"

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

export type GastoMovimiento = Extract<Movimiento, { tipo: "gasto" }>
export type TransferenciaMovimiento = Extract<Movimiento, { tipo: "transferencia" }>

export type GastoFormState = {
  descripcion: string
  pagador: Persona
  monto: string
  participantes: Persona[]
  categoria: CategoriaGasto
}

export type TransferenciaFormState = {
  descripcion: string
  de: Persona
  a: Persona
  monto: string
}

export type MovementEditState = {
  index: number
  movimiento: Movimiento
  monto: string
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
