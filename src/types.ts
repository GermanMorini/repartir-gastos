export type Persona = string

export type Movimiento =
  | {
      tipo: "gasto"
      descripcion?: string
      pagador: Persona
      monto: number
      participantes: Persona[]
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
}

export type TransferenciaPendiente = {
  de: Persona
  a: Persona
  monto: number
}

export type AppState = {
  personas: Persona[]
  movimientos: Movimiento[]
}
