import { CopyIcon, PieChartIcon, ShareIcon } from "lucide-react"
import { Button, Card, Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger, Separator } from "../../components/ui"
import { formatoARS } from "../../lib/money"
import type { ResumenCategoria } from "../../types"
import { CategoryDetailList, CategoryPie } from "./CategoryChart"

export function CategoriasDialog({
  open,
  onOpenChange,
  data,
  total,
  onCopy,
  onExport,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  data: ResumenCategoria[]
  total: number
  onCopy: () => void
  onExport: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="btn-chart" data-tour="grafico" type="button">
          <PieChartIcon data-icon="inline-start" />
          Gráfico
        </Button>
      </DialogTrigger>
      <DialogContent className="category-dialog" data-tour="grafico-dialog">
        <DialogTitle>Gastos por categoría</DialogTitle>
        <DialogDescription>Compará cuánto se gastó en cada categoría.</DialogDescription>
        <Card className="category-chart-card">
          <div className="category-chart-layout">
            <CategoryPie data={data} />
            <CategoryDetailList data={data} />
          </div>
          <Separator />
          <div className="category-total"><span>Total gastado</span><strong>{formatoARS.format(total)}</strong></div>
        </Card>
        <div className="dialog-actions">
          <Button className="btn-outline" onClick={onCopy} type="button">
            <CopyIcon data-icon="inline-start" />
            Copiar resumen
          </Button>
          <Button onClick={onExport} type="button">
            <ShareIcon data-icon="inline-start" />
            Compartir
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
