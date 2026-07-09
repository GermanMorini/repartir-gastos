import * as AccordionPrimitive from "@radix-ui/react-accordion"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu"
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area"
import * as SelectPrimitive from "@radix-ui/react-select"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { CheckIcon, ChevronDownIcon, XIcon } from "lucide-react"
import { createContext, useContext, useState } from "react"
import type { ComponentProps, ReactNode } from "react"
import { cn } from "../lib/utils"

let scrollUntil = 0

if (typeof window !== "undefined") {
  window.addEventListener("scroll", () => {
    scrollUntil = Date.now() + 180
  }, { passive: true })
}

export function Button({ className, ...props }: ComponentProps<"button">) {
  return <button className={cn("btn", className)} {...props} />
}

export function Card({ className, ...props }: ComponentProps<"section">) {
  return <section className={cn("card", className)} {...props} />
}

export function Table({ className, ...props }: ComponentProps<"table">) {
  return <table className={cn("table", className)} {...props} />
}

export function TableHeader(props: ComponentProps<"thead">) {
  return <thead {...props} />
}

export function TableBody(props: ComponentProps<"tbody">) {
  return <tbody {...props} />
}

export function TableRow(props: ComponentProps<"tr">) {
  return <tr {...props} />
}

export function TableHead({ className, ...props }: ComponentProps<"th">) {
  return <th className={cn("table-head", className)} {...props} />
}

export function TableCell({ className, ...props }: ComponentProps<"td">) {
  return <td className={cn("table-cell", className)} {...props} />
}

export function Input(props: ComponentProps<"input">) {
  return <input className="input" {...props} />
}

export function Textarea(props: ComponentProps<"textarea">) {
  return <textarea className="input min-h-20 resize-none" {...props} />
}

const SelectOpenContext = createContext<{ open: boolean; setOpen: (open: boolean) => void } | null>(null)

export function Select({ open, defaultOpen, onOpenChange, ...props }: ComponentProps<typeof SelectPrimitive.Root>) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen ?? false)
  const currentOpen = open ?? internalOpen
  const setOpen = (nextOpen: boolean) => {
    if (open === undefined) setInternalOpen(nextOpen)
    onOpenChange?.(nextOpen)
  }

  return (
    <SelectOpenContext.Provider value={{ open: currentOpen, setOpen }}>
      <SelectPrimitive.Root {...props} open={currentOpen} onOpenChange={setOpen} />
    </SelectOpenContext.Provider>
  )
}

export const SelectValue = SelectPrimitive.Value
export const SelectGroup = SelectPrimitive.Group

export function SelectTrigger({ children, className, onPointerDown, ...props }: ComponentProps<typeof SelectPrimitive.Trigger>) {
  const select = useContext(SelectOpenContext)

  return (
    <SelectPrimitive.Trigger
      className={cn("select-trigger", className)}
      onPointerDown={(event) => {
        if (select?.open) {
          event.preventDefault()
          select.setOpen(false)
        }
        onPointerDown?.(event)
      }}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon>
        <ChevronDownIcon data-icon="inline-end" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
}

export function SelectContent({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content className={cn("select-content", className)} position="popper" sideOffset={4}>
        <SelectPrimitive.Viewport>
          {children}
        </SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
}

export function SelectItem({ children, value }: { children: ReactNode; value: string }) {
  return (
    <SelectPrimitive.Item className="select-item" value={value}>
      <SelectPrimitive.ItemText><span className="select-item-content">{children}</span></SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator className="select-item-indicator">
        <CheckIcon data-icon="inline-start" />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  )
}

export function Badge({ className, ...props }: ComponentProps<"span">) {
  return <span className={cn("badge", className)} {...props} />
}

export function Separator() {
  return <div className="separator" />
}

export const Accordion = AccordionPrimitive.Root
export const AccordionItem = AccordionPrimitive.Item

export function AccordionTrigger({ children, className, ...props }: ComponentProps<typeof AccordionPrimitive.Trigger>) {
  return (
    <AccordionPrimitive.Header>
      <AccordionPrimitive.Trigger className={cn("accordion-trigger", className)} {...props}>
        {children}
        <ChevronDownIcon data-icon="inline-end" />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  )
}

export function AccordionContent({ children, className, ...props }: ComponentProps<typeof AccordionPrimitive.Content>) {
  return (
    <AccordionPrimitive.Content className={cn("accordion-content", className)} {...props}>
      <div>{children}</div>
    </AccordionPrimitive.Content>
  )
}

export function ScrollArea({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <ScrollAreaPrimitive.Root className={cn("scroll-area", className)}>
      <ScrollAreaPrimitive.Viewport className="scroll-area-viewport">{children}</ScrollAreaPrimitive.Viewport>
      <ScrollAreaPrimitive.Scrollbar className="scroll-area-scrollbar" orientation="vertical">
        <ScrollAreaPrimitive.Thumb className="scroll-area-thumb" />
      </ScrollAreaPrimitive.Scrollbar>
      <ScrollAreaPrimitive.Scrollbar className="scroll-area-scrollbar" orientation="horizontal">
        <ScrollAreaPrimitive.Thumb className="scroll-area-thumb" />
      </ScrollAreaPrimitive.Scrollbar>
    </ScrollAreaPrimitive.Root>
  )
}

export const Tabs = TabsPrimitive.Root
export const TabsList = TabsPrimitive.List
export const TabsTrigger = TabsPrimitive.Trigger
export const TabsContent = TabsPrimitive.Content

export const DropdownMenu = DropdownMenuPrimitive.Root

export function DropdownMenuTrigger({ onPointerDown, ...props }: ComponentProps<typeof DropdownMenuPrimitive.Trigger>) {
  return (
    <DropdownMenuPrimitive.Trigger
      onPointerDown={(event) => {
        if (Date.now() < scrollUntil) {
          event.preventDefault()
          return
        }
        onPointerDown?.(event)
      }}
      {...props}
    />
  )
}
export const DropdownMenuGroup = DropdownMenuPrimitive.Group
export const DropdownMenuLabel = DropdownMenuPrimitive.Label
export const DropdownMenuSeparator = DropdownMenuPrimitive.Separator

export function DropdownMenuContent(props: ComponentProps<typeof DropdownMenuPrimitive.Content>) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content {...props} />
    </DropdownMenuPrimitive.Portal>
  )
}

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
