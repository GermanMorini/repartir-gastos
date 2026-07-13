import type { RefObject } from "react"
import { toast } from "sonner"
import { encodeShareState } from "../../features/share/encodeShare"
import { dataUrlToFile, descargarImagen, toPngDataUrl } from "../../lib/export-image"
import { porcentaje } from "../../lib/money"
import { textoCategorias, textoMovimientos, textoResumenPersona } from "../../lib/share-text"
import { copyText, shareFile, shareTextOrCopy, shareUrlOrCopy } from "../../infrastructure/browser/sharing"
import type { ResumenPersona } from "../../lib/calculos"
import type { Movimiento, Persona, ResumenCategoria, TransferenciaPendiente } from "../../types"

type ShareActionsOptions = {
  personas: Persona[]
  movimientos: Movimiento[]
  pendientes: TransferenciaPendiente[]
  gastosPorCategoria: ResumenCategoria[]
  totalGastado: number
  resumenCopiable: string
  isMobile: boolean
  categoryExportRef: RefObject<HTMLDivElement | null>
  calculationsExportRef: RefObject<HTMLDivElement | null>
}

function notify(result: "shared" | "copied" | "cancelled" | "failed", success: { shared?: string; copied?: string }, error: string) {
  if (result === "cancelled") return
  if (result === "shared" && success.shared) return toast.success(success.shared)
  if (result === "copied" && success.copied) return toast.success(success.copied)
  toast.error(error)
}

export function useShareActions(options: ShareActionsOptions) {
  const copyMovements = async () => notify(await copyText(textoMovimientos(options.personas, options.movimientos)), { copied: "Movimientos copiados." }, "No se pudieron copiar los movimientos.")
  const shareMovements = async () => notify(await shareTextOrCopy("Movimientos", textoMovimientos(options.personas, options.movimientos), options.isMobile), { shared: "Movimientos compartidos.", copied: "Movimientos copiados." }, "No se pudieron compartir los movimientos.")
  const copyCategories = async () => notify(await copyText(textoCategorias(options.totalGastado, options.gastosPorCategoria, porcentaje)), { copied: "Resumen copiado." }, "No se pudo copiar el resumen.")
  const shareSettlement = async () => notify(await shareTextOrCopy("Resumen de reparto", options.resumenCopiable, options.isMobile), { shared: "Resumen compartido.", copied: "Resumen copiado." }, "No se pudo compartir el resumen.")
  const sharePerson = async (resumen: ResumenPersona) => notify(await shareTextOrCopy("Resumen de liquidación", textoResumenPersona(resumen, options.pendientes), options.isMobile), { shared: "Resumen compartido.", copied: "Resumen copiado." }, "No se pudo compartir el resumen.")

  const shareSummaryLink = async () => {
    try {
      const payload = encodeShareState({ personas: options.personas, movimientos: options.movimientos })
      const url = `${window.location.origin}${window.location.pathname}#/share/${payload}`
      if (url.length > 7000) return toast.error("El reparto es demasiado grande para compartir por link. Comparte los gastos como texto")
      notify(await shareUrlOrCopy("Resumen de liquidación", url, options.isMobile), { shared: "Resumen compartido.", copied: "Link copiado." }, "No se pudo compartir el resumen.")
    } catch {
      toast.error("No se pudo compartir el resumen.")
    }
  }

  const exportCategoryImage = async () => {
    const element = options.categoryExportRef.current
    if (!element) return
    try {
      const dataUrl = await toPngDataUrl(element)
      const file = await dataUrlToFile(dataUrl, "gastos-por-categoria.png")
      const result = await shareFile(file, "Gastos por categoría")
      if (result === "failed") {
        descargarImagen(dataUrl, file.name)
        toast.success("Imagen exportada.")
      } else notify(result, { shared: "Imagen exportada." }, "No se pudo exportar la imagen.")
    } catch {
      toast.error("No se pudo exportar la imagen.")
    }
  }

  const exportCalculationsImage = async () => {
    const element = options.calculationsExportRef.current
    if (!element) return
    try {
      element.classList.add("is-exporting")
      const dataUrl = await toPngDataUrl(element)
      const file = await dataUrlToFile(dataUrl, "matriz-de-calculos.png")
      if (options.isMobile) {
        const result = await shareFile(file, "Matriz de cálculos")
        if (result !== "failed") return notify(result, { shared: "Imagen exportada." }, "No se pudo exportar la imagen.")
      }
      descargarImagen(dataUrl, file.name)
      toast.success("Imagen exportada.")
    } catch {
      toast.error("No se pudo exportar la imagen.")
    } finally {
      element.classList.remove("is-exporting")
    }
  }

  return { copyMovements, shareMovements, copyCategories, shareSettlement, sharePerson, shareSummaryLink, exportCategoryImage, exportCalculationsImage }
}
