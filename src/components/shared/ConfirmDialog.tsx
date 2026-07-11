import type { ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

export function ConfirmDialog({
  children,
  title,
  description,
  confirmText = "Eliminar",
  onConfirm,
}: {
  children: ReactNode
  title: string
  description: ReactNode
  confirmText?: string
  onConfirm: () => void
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
        <div className="dialog-actions">
          <DialogClose asChild>
            <Button className="btn-outline" type="button">Cancelar</Button>
          </DialogClose>
          <DialogClose asChild>
            <Button className="btn-danger" onClick={onConfirm} type="button">{confirmText}</Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  )
}
