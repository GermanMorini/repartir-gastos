# Repartir gastos

App web estática para cargar personas, gastos y transferencias realizadas. Calcula quién debe transferirle a quién.

## Uso local

```bash
pnpm install
pnpm dev
```

## Build

```bash
pnpm build
```

## GitHub Pages

Repositorio:

```text
git@github.com:GermanMorini/repartir-gastos.git
```

El deploy queda automatizado con GitHub Actions. Cada push a `main` compila la app y publica `dist` en GitHub Pages.

En GitHub, activá Pages con:

```text
Settings > Pages > Source: GitHub Actions
```
