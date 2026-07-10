import { ChevronDownIcon, ChevronUpIcon } from "lucide-react"
import { Button } from "../ui"

export function PaginationControls({ page, totalPages, onPage }: { page: number; totalPages: number; onPage: (page: number) => void }) {
  return (
    <div className="desktop-pagination">
      <Button className="btn-outline" disabled={page <= 1} onClick={() => onPage(page - 1)} type="button"><ChevronUpIcon /></Button>
      <span className="pagination-badge">{page} de {totalPages}</span>
      <Button className="btn-outline" disabled={page >= totalPages} onClick={() => onPage(page + 1)} type="button"><ChevronDownIcon /></Button>
    </div>
  )
}
