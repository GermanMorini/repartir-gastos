export type BrowserActionResult = "shared" | "copied" | "cancelled" | "failed"

export function isShareCancellation(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError"
}

export async function copyText(text: string): Promise<BrowserActionResult> {
  try {
    await navigator.clipboard.writeText(text)
    return "copied"
  } catch {
    return "failed"
  }
}

export async function shareTextOrCopy(title: string, text: string, preferShare: boolean): Promise<BrowserActionResult> {
  if (preferShare && navigator.share) {
    try {
      await navigator.share({ title, text })
      return "shared"
    } catch (error) {
      if (isShareCancellation(error)) return "cancelled"
    }
  }
  return copyText(text)
}

export async function shareUrlOrCopy(title: string, url: string, preferShare: boolean): Promise<BrowserActionResult> {
  if (preferShare && navigator.share) {
    try {
      await navigator.share({ title, url })
      return "shared"
    } catch (error) {
      if (isShareCancellation(error)) return "cancelled"
    }
  }
  return copyText(url)
}

export async function shareFile(file: File, title: string): Promise<BrowserActionResult> {
  if (!navigator.canShare?.({ files: [file] })) return "failed"
  try {
    await navigator.share({ title, files: [file] })
    return "shared"
  } catch (error) {
    return isShareCancellation(error) ? "cancelled" : "failed"
  }
}
