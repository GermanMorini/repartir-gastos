import { toPng } from "html-to-image"

export function descargarImagen(dataUrl: string, nombreArchivo: string) {
  const link = document.createElement("a")
  link.href = dataUrl
  link.download = nombreArchivo
  link.click()
}

export async function toPngDataUrl(element: HTMLElement) {
  await document.fonts?.ready
  await new Promise((resolve) => requestAnimationFrame(resolve))
  return toPng(element, { cacheBust: true, pixelRatio: 2, backgroundColor: "#ffffff" })
}
