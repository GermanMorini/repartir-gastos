# Repartir gastos

Aplicación web estática para repartir cuentas entre varias personas. Sirve para viajes, comidas, salidas o cualquier gasto compartido donde alguien pagó por otras personas y después hay que liquidar saldos.

## Qué permite hacer

- Agregar personas.
- Cargar gastos con monto, pagador y participantes.
- Registrar pagos realizados o devoluciones.
- Editar o eliminar movimientos.
- Ver resumen por persona: quién debe pagar y quién debe recibir.
- Calcular transferencias sugeridas para saldar la cuenta.
- Copiar el resumen final para compartirlo.

## Cómo funciona

La app calcula cuánto pagó cada persona y cuánto le correspondió pagar según los gastos donde participó. Los pagos realizados reducen deuda pendiente: si Ana pagó a Luis, Ana debe menos y Luis ya recibió parte de lo que le correspondía cobrar. Con esos saldos genera la menor lista práctica de transferencias pendientes.

Los datos se guardan en el navegador con `localStorage`. No hay backend ni cuentas de usuario.
