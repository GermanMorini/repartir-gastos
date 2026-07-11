import type { ComponentProps } from "react"
import { Card } from "@/components/ui/card"

export function ResponsiveSectionCard(props: ComponentProps<typeof Card>) {
  return <Card {...props} />
}
