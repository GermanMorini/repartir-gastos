# Repartir gastos

Aplicación web estática para repartir cuentas entre varias personas. Sirve para viajes, comidas, salidas o cualquier gasto compartido donde alguien pagó por otras personas y después hay que liquidar saldos.

## Qué permite hacer

- Agregar personas.
- Cargar gastos con monto, pagador y participantes.
- Registrar transferencias ya realizadas.
- Editar o eliminar movimientos.
- Ver resumen por persona: quién debe pagar y quién debe recibir.
- Calcular transferencias sugeridas para saldar la cuenta.
- Copiar el resumen final para compartirlo.

## Cómo funciona

La app calcula cuánto pagó cada persona y cuánto le correspondía pagar según los gastos donde participó. Con esos saldos genera la menor lista práctica de transferencias pendientes entre quienes deben pagar y quienes deben recibir.

Los datos se guardan en el navegador con `localStorage`. No hay backend ni cuentas de usuario.

## Uso local

```bash
pnpm install
pnpm dev
```

Abrí la URL que muestra Vite en la terminal.

## Comandos

```bash
pnpm test
pnpm build
pnpm preview
```

## Deploy en GitHub Pages

Repositorio:

```text
git@github.com:GermanMorini/repartir-gastos.git
```

El deploy está preparado con GitHub Actions. Cada push a `main` compila la app y publica `dist` en GitHub Pages.

En GitHub, Pages debe estar configurado así:

```text
Settings > Pages > Source: GitHub Actions
```

URL publicada:

```text
https://germanmorini.github.io/repartir-gastos/
```
