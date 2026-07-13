import { ArrowLeftIcon, ChevronLeftIcon, ChevronRightIcon, ShareIcon, UsersIcon } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { SlidingText } from "../../components/shared/SlidingText"
import { getBalancePresentation } from "../../domain/calculations/presentation"
import { getResumenPersona, getResumenesPersonas } from "../../lib/calculos"
import { formatoARS } from "../../lib/money"
import type { Movimiento, Persona } from "../../types"
import { PersonCarousel } from "./PersonCarousel"
import { PersonSummaryCard } from "./PersonSummaryCard"
import { PersonSummaryDetail } from "./PersonSummaryDetail"
import { pendingForPerson } from "./model"
import type { DetailView } from "./model"
import "./person-summary.css"

type PersonSummaryProps = {
  personas: Persona[]
  movimientos: Movimiento[]
  initialPersona?: Persona | null
  initialDetail?: DetailView | null
  readOnly?: boolean
  title?: string
  onBack?: () => void
  onShare?: (persona: Persona) => void
  closing?: boolean
}

function useSelectedPerson(personas: Persona[], initialPersona?: Persona | null) {
  const [selected, setSelected] = useState(initialPersona ?? personas[0] ?? "")
  useEffect(() => setSelected(initialPersona ?? personas[0] ?? ""), [initialPersona, personas])
  return [selected, setSelected] as const
}

function useSummaryView(personas: Persona[], movimientos: Movimiento[], initialPersona?: Persona | null) {
  const [selected, setSelected] = useSelectedPerson(personas, initialPersona)
  const summaries = useMemo(() => getResumenesPersonas(personas, movimientos), [movimientos, personas])
  const summary = summaries.get(selected) ?? getResumenPersona(selected, movimientos)
  const pending = useMemo(() => pendingForPerson(selected, personas, movimientos), [movimientos, personas, selected])
  return { selected, setSelected, summaries, summary, pending }
}

export function PersonSummaryMobilePage({ personas, movimientos, initialPersona, readOnly = false, title = "Hoja de liquidación", onBack, onShare, closing = false }: PersonSummaryProps) {
  const { selected, setSelected, summaries, summary, pending } = useSummaryView(personas, movimientos, initialPersona)
  const [detail, setDetail] = useState<DetailView | "cards">("cards")
  const [closingDetail, setClosingDetail] = useState(false)
  useEffect(() => { setDetail("cards"); setClosingDetail(false) }, [selected])
  const closeDetail = () => {
    setClosingDetail(true)
    window.setTimeout(() => { setDetail("cards"); setClosingDetail(false) }, 180)
  }
  if (!selected) return null
  return <main className={`ps-mobile-page${readOnly ? "" : " is-slide-page"}${closing ? " is-closing" : ""}`} data-tour={selected === "Norberto" ? "resumen-norberto-dialog" : undefined}>
    <header className="ps-mobile-head"><span /><h1>{readOnly ? "Resumen interactivo" : title}</h1>{onShare ? <Button className="btn-outline" onClick={() => onShare(selected)} type="button"><ShareIcon /></Button> : <span />}</header>
    <ScrollArea className="ps-mobile-scroll">
      <PersonCarousel personas={personas} selected={selected} showArrows={false} showPagination onSelect={setSelected} renderItem={(persona) => <PersonSummaryCard resumen={summaries.get(persona) ?? getResumenPersona(persona, movimientos)} showTransferButton onOpen={(view) => { setSelected(persona); setClosingDetail(false); setDetail(view) }} />} />
      {onBack && detail === "cards" ? <Button className="btn-outline ps-bottom-back ps-page-back" onClick={onBack} type="button"><ArrowLeftIcon />Volver</Button> : null}
    </ScrollArea>
    {detail !== "cards" ? <PersonSummaryDetail closing={closingDetail} pendientes={pending} resumen={summary} view={detail} onBack={closeDetail} /> : null}
  </main>
}

export function PersonSummaryDesktopView({ personas, movimientos, initialPersona, initialDetail = null, onBack, readOnly = false }: PersonSummaryProps) {
  const { selected, setSelected, summaries, summary, pending } = useSummaryView(personas, movimientos, initialPersona)
  const [detail, setDetail] = useState<DetailView | "cards">("cards")
  const [closingDetail, setClosingDetail] = useState(false)
  const status = getBalancePresentation(summary.saldo)
  useEffect(() => {
    if (!readOnly) { setClosingDetail(false); setDetail(initialDetail ?? "cards") }
  }, [initialDetail, readOnly, selected])
  const closeDetail = () => {
    setClosingDetail(true)
    window.setTimeout(() => { setDetail("cards"); setClosingDetail(false) }, 180)
  }
  if (!selected) return null
  return <div className={`ps-desktop-view${readOnly ? " is-readonly" : ""}`}>
    <header className="ps-desktop-head">{onBack ? <Button className="btn-outline" onClick={onBack} type="button"><ChevronLeftIcon />Volver al listado</Button> : null}{readOnly ? <span className="ps-share-logo"><UsersIcon /></span> : null}<div><h2>Resumen por persona</h2><p>Revisá cuánto debe pagar o recibir cada persona.</p></div></header>
    {readOnly ? <PersonCarousel personas={personas} selected={selected} showArrows={false} showPagination onSelect={(persona) => { setSelected(persona); setDetail("cards") }} renderItem={(persona) => <PersonSummaryCard resumen={summaries.get(persona) ?? getResumenPersona(persona, movimientos)} showTransferButton onOpen={(view) => { setSelected(persona); setDetail(view) }} />} /> : null}
    {!readOnly ? <div className="ps-desktop-detail"><aside><SlidingText className="ps-side-name">{summary.persona}</SlidingText><Badge className={status.className}>{status.label}</Badge><Separator /><button className="ps-side-stat" onClick={() => setDetail("parte")} type="button">Le tocaba gastar<strong>{formatoARS.format(summary.totalLeTocaba)}</strong><ChevronRightIcon /></button><button className="ps-side-stat" onClick={() => setDetail("gasto")} type="button">Gastó<strong>{formatoARS.format(summary.totalSalioBolsillo)}</strong><ChevronRightIcon /></button><button className="ps-side-stat" onClick={() => setDetail("recibido")} type="button">Ya recibió<strong>{formatoARS.format(summary.totalRecibido)}</strong><ChevronRightIcon /></button><button className="ps-side-stat" onClick={() => setDetail("transferencias")} type="button">Saldo<strong className={status.className}>{formatoARS.format(summary.saldo)}</strong><ChevronRightIcon /></button></aside><section><p className="empty">Elegí una línea del resumen para ver el detalle.</p></section></div> : null}
    {detail !== "cards" ? <div className="ps-desktop-drawer" onClick={closeDetail}><div onClick={(event) => event.stopPropagation()}><PersonSummaryDetail closing={closingDetail} pendientes={pending} resumen={summary} view={detail} onBack={closeDetail} /></div></div> : null}
  </div>
}

export function PersonSummaryDesktopDrawer({ personas, movimientos, persona, detail, onClose }: { personas: Persona[]; movimientos: Movimiento[]; persona: Persona; detail: DetailView; onClose: () => void }) {
  const [closing, setClosing] = useState(false)
  const summary = useMemo(() => getResumenPersona(persona, movimientos), [movimientos, persona])
  const pending = useMemo(() => pendingForPerson(persona, personas, movimientos), [movimientos, persona, personas])
  const close = () => {
    if (closing) return
    setClosing(true)
    window.setTimeout(onClose, 180)
  }
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") close() }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  })
  return <div className="ps-desktop-drawer" onClick={close}><div onClick={(event) => event.stopPropagation()}><PersonSummaryDetail closing={closing} pendientes={pending} resumen={summary} view={detail} onBack={close} /></div></div>
}
