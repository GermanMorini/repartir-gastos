import type { ComponentProps } from "react"
import { Card } from "../ui"

export function ResponsiveSectionCard(props: ComponentProps<typeof Card>) {
  return <Card {...props} />
}
