import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import App from "./app/App"
import "./index.css"
import "./app/mobile-actions.css"
import "./app/adaptive-layout.css"

createRoot(document.getElementById("app")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
