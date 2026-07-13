import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, ChevronUpIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

export function PaginationControls({ page, totalPages, onPage, orientation = "vertical" }: { page: number; totalPages: number; onPage: (page: number) => void; orientation?: "vertical" | "horizontal" }) {
  const PreviousIcon = orientation === "horizontal" ? ChevronLeftIcon : ChevronUpIcon
  const NextIcon = orientation === "horizontal" ? ChevronRightIcon : ChevronDownIcon
  return (
    <div className="desktop-pagination">
      <Button className="btn-outline" disabled={page <= 1} onClick={() => onPage(page - 1)} type="button"><PreviousIcon /></Button>
      <span className="pagination-badge">{page} de {totalPages}</span>
      <Button className="btn-outline" disabled={page >= totalPages} onClick={() => onPage(page + 1)} type="button"><NextIcon /></Button>
    </div>
  )
}
