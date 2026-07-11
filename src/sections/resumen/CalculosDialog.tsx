import { CalculatorIcon, DownloadIcon } from "lucide-react"
import type { RefObject } from "react"
import type { ReactNode } from "react"
import { SlidingText } from "../../components/shared/SlidingText"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatoARS, formatoSaldoMatriz } from "../../lib/money"
import type { FilaCalculo, Persona } from "../../types"

type CalculosDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  personas: Persona[]
  filas: FilaCalculo[]
  movimientosCount: number
  contentRef: RefObject<HTMLDivElement | null>
  onExport: () => void
  trigger?: ReactNode
}

export function CalculosDialog({ open, onOpenChange, personas, filas, movimientosCount, contentRef, onExport, trigger }: CalculosDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger !== null ? (
        <DialogTrigger asChild>
          {trigger ?? (
            <Button className="btn-france" data-tour="calculos" type="button">
              <CalculatorIcon data-icon="inline-start" />
              Cálculos
            </Button>
          )}
        </DialogTrigger>
      ) : null}
      <DialogContent className="calculations-dialog" data-tour="calculos-dialog">
        <div className="calculations-content" ref={contentRef}>
          <div className="calculations-head">
            <div>
              <DialogTitle>Cálculos hechos</DialogTitle>
              <DialogDescription>Cuentas hechas paso a paso. Se subraya quién pagó o transfirió cada movimiento.</DialogDescription>
            </div>
            <Badge>{movimientosCount} movimientos</Badge>
          </div>
          <Separator />
          <ScrollArea className="calculations-scroll">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="calculation-movement-column">Movimiento</TableHead>
                  {personas.map((persona) => <TableHead className="number" key={persona}>{persona}</TableHead>)}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filas.map((fila) => (
                  <TableRow key={fila.paso}>
                    <TableCell className="calculation-movement-column">
                      <SlidingText>{fila.movimiento} <strong className="calculation-movement-amount">({formatoARS.format(fila.monto)})</strong></SlidingText>
                    </TableCell>
                    {personas.map((persona) => {
                      const saldo = fila.saldos[persona] ?? 0
                      const estadoSaldo = saldo > 0 ? "amount-positive" : saldo < 0 ? "amount-negative" : "amount-zero"
                      return <TableCell className={`number ${estadoSaldo}${persona === fila.personaDestacada ? " amount-highlight" : ""}`} key={persona}>{formatoSaldoMatriz(saldo)}</TableCell>
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>
        <div className="dialog-actions">
          <Button onClick={onExport} type="button">
            <DownloadIcon data-icon="inline-start" />
            Compartir
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
