import { CheckIcon, CopyIcon, ShareIcon } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import type { CSSProperties, ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { formatoARS } from "../../lib/money"
import type { TransferenciaPendiente } from "../../types"

function SlidingSettlement({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const [distance, setDistance] = useState(0)

  useEffect(() => {
    const element = ref.current
    if (!element) return
    const measure = () => setDistance(Math.max(0, element.scrollWidth - element.clientWidth))
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [children])

  return (
    <div className={distance ? "settlement-marquee is-moving" : "settlement-marquee"} ref={ref} style={{ "--slide-distance": `${distance}px` } as CSSProperties}>
      {children}
    </div>
  )
}

export function RepartirDialog({
  open,
  onOpenChange,
  pendientes,
  onShare,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  pendientes: TransferenciaPendiente[]
  onShare: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="btn-primary settle-button" type="button">Repartir!</Button>
      </DialogTrigger>
      <DialogContent className="settlement-dialog" data-tour="repartir-dialog">
        <div className="success-icon"><CheckIcon /></div>
        <DialogTitle>¡Reparto completo!</DialogTitle>
        <DialogDescription>
          {pendientes.length === 0 ? "Todos los saldos están igualados." : "Estas son las transferencias necesarias:"}
        </DialogDescription>
        <div className="settlement-summary">
          {pendientes.length === 0 ? <p>Las cuentas ya están equilibradas.</p> : null}
          {pendientes.map((transferencia) => (
            <SlidingSettlement key={`${transferencia.de}-${transferencia.a}-${transferencia.monto}`}>
              <div className="settlement-line">
                <span className="avatar">{transferencia.de[0].toUpperCase()}</span>
                <span>{transferencia.de}</span>
                <span>→</span>
                <span className="avatar avatar-positive">{transferencia.a[0].toUpperCase()}</span>
                <span>{transferencia.a}</span>
                <strong>{formatoARS.format(transferencia.monto)}</strong>
              </div>
            </SlidingSettlement>
          ))}
        </div>
        <DialogClose asChild>
          <Button className="settlement-ok" type="button">Entendido</Button>
        </DialogClose>
        <Button className="settlement-copy" onClick={onShare} type="button">
          <CopyIcon className="settlement-copy-desktop" data-icon="inline-start" />
          <ShareIcon className="settlement-copy-mobile" data-icon="inline-start" />
          <span className="settlement-copy-desktop">Copiar resumen</span>
          <span className="settlement-copy-mobile">Compartir</span>
        </Button>
      </DialogContent>
    </Dialog>
  )
}
