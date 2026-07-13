export function descargarImagen(dataUrl: string, nombreArchivo: string) {
  const link = document.createElement("a")
  link.href = dataUrl
  link.download = nombreArchivo
  link.click()
}

export async function toPngDataUrl(element: HTMLElement) {
  const { toPng } = await import("html-to-image")
  await document.fonts?.ready
  await new Promise((resolve) => requestAnimationFrame(resolve))
  return toPng(element, { cacheBust: true, pixelRatio: 2, backgroundColor: "#ffffff" })
}

export async function dataUrlToFile(dataUrl: string, name: string) {
  const blob = await fetch(dataUrl).then((response) => response.blob())
  return new File([blob], name, { type: "image/png" })
}
