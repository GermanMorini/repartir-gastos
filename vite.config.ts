import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import path from "node:path"
import { defineConfig } from "vite"

export default defineConfig({
  base: "/repartir-gastos/",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  plugins: [react(), tailwindcss()],
})
