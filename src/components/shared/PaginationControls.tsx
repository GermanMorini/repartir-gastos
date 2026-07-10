import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import { Button } from "../ui"

export function PaginationControls({ page, totalPages, onPage }: { page: number; totalPages: number; onPage: (page: number) => void }) {
  return (
    <div className="desktop-pagination">
      <Button className="btn-outline" disabled={page <= 1} onClick={() => onPage(page - 1)} type="button"><ChevronLeftIcon /></Button>
      <span>{page} de {totalPages}</span>
      <Button className="btn-outline" disabled={page >= totalPages} onClick={() => onPage(page + 1)} type="button"><ChevronRightIcon /></Button>
    </div>
  )
}
