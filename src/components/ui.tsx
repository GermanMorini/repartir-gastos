import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { CheckIcon, XIcon } from "lucide-react"
import type { ComponentProps, ReactNode } from "react"
import { cn } from "../lib/utils"

export function Button({ className, ...props }: ComponentProps<"button">) {
  return <button className={cn("btn", className)} {...props} />
}

export function Card({ className, ...props }: ComponentProps<"section">) {
  return <section className={cn("card", className)} {...props} />
}

export function Input(props: ComponentProps<"input">) {
  return <input className="input" {...props} />
}

export function Textarea(props: ComponentProps<"textarea">) {
  return <textarea className="input min-h-20 resize-none" {...props} />
}

export function Select(props: ComponentProps<"select">) {
  return <select className="input" {...props} />
}

export function Badge({ className, ...props }: ComponentProps<"span">) {
  return <span className={cn("badge", className)} {...props} />
}

export function Separator() {
  return <div className="separator" />
}

export const Tabs = TabsPrimitive.Root
export const TabsList = TabsPrimitive.List
export const TabsTrigger = TabsPrimitive.Trigger
export const TabsContent = TabsPrimitive.Content

export const DropdownMenu = DropdownMenuPrimitive.Root
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger
export const DropdownMenuContent = DropdownMenuPrimitive.Content
export const DropdownMenuGroup = DropdownMenuPrimitive.Group
export const DropdownMenuLabel = DropdownMenuPrimitive.Label
export const DropdownMenuSeparator = DropdownMenuPrimitive.Separator

export function DropdownMenuCheckboxItem({
  children,
  checked,
  onCheckedChange,
}: {
  children: ReactNode
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <DropdownMenuPrimitive.CheckboxItem
      checked={checked}
      className="dropdown-checkbox-item"
      onCheckedChange={(value) => onCheckedChange(value === true)}
      onSelect={(event) => event.preventDefault()}
    >
      <DropdownMenuPrimitive.ItemIndicator className="dropdown-item-indicator">
        <CheckIcon data-icon="inline-start" />
      </DropdownMenuPrimitive.ItemIndicator>
      {children}
    </DropdownMenuPrimitive.CheckboxItem>
  )
}

export function Checkbox({
  checked,
  onCheckedChange,
  id,
}: {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  id?: string
}) {
  return (
    <CheckboxPrimitive.Root className="checkbox" checked={checked} onCheckedChange={(value) => onCheckedChange(value === true)} id={id}>
      <CheckboxPrimitive.Indicator>
        <CheckIcon data-icon="inline-start" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export const Dialog = DialogPrimitive.Root
export const DialogTrigger = DialogPrimitive.Trigger
export const DialogClose = DialogPrimitive.Close
export const DialogTitle = DialogPrimitive.Title
export const DialogDescription = DialogPrimitive.Description

export function DialogContent({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="dialog-overlay" />
      <DialogPrimitive.Content className={cn("dialog-content", className)}>
        {children}
        <DialogPrimitive.Close className="dialog-close" aria-label="Cerrar">
          <XIcon data-icon="inline-start" />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}
