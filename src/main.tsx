import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import App from "./app/App"
import "./index.css"
import "./app/mobile-actions.css"
import "./app/adaptive-layout.css"
import "./sections/movimientos/edit-movement-sheet.css"
import "./sections/movimientos/movimientos-mobile.css"
import "./sections/personas/personas-mobile.css"
import "./sections/resumen/resumen-mobile.css"

createRoot(document.getElementById("app")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
