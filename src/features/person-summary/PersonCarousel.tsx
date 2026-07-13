import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import { useEffect, useState } from "react"
import type { ReactNode } from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import type { CarouselApi } from "@/components/ui/carousel"
import type { Persona } from "../../types"
import { personInitials } from "./model"

export function PersonAvatar({ persona, className = "" }: { persona: Persona; className?: string }) {
  return <Avatar className={className}><AvatarFallback>{personInitials(persona)}</AvatarFallback></Avatar>
}

export function PersonCarousel({ personas, selected, onSelect, renderItem, showArrows = true, showPagination = false }: { personas: Persona[]; selected: Persona; onSelect: (persona: Persona) => void; renderItem?: (persona: Persona) => ReactNode; showArrows?: boolean; showPagination?: boolean }) {
  const [api, setApi] = useState<CarouselApi>()
  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(false)
  const selectedIndex = Math.max(0, personas.indexOf(selected))

  useEffect(() => {
    if (!api) return
    const updateControls = () => { setCanScrollPrev(api.canScrollPrev()); setCanScrollNext(api.canScrollNext()) }
    const sync = () => { const persona = personas[api.selectedScrollSnap()]; if (persona) onSelect(persona); updateControls() }
    updateControls()
    api.on("select", sync)
    api.on("reInit", sync)
    return () => { api.off("select", sync); api.off("reInit", sync) }
  }, [api, onSelect, personas])

  useEffect(() => {
    const index = personas.indexOf(selected)
    if (!api || index < 0) return
    if (api.selectedScrollSnap() !== index) api.scrollTo(index)
    window.requestAnimationFrame(() => { setCanScrollPrev(api.canScrollPrev()); setCanScrollNext(api.canScrollNext()) })
  }, [api, personas, selected])

  return <Carousel className="person-carousel" setApi={setApi}>
    {showArrows ? <CarouselPrevious className="btn-outline person-carousel-arrow" /> : null}
    <CarouselContent className="person-carousel-track">{personas.map((persona) => <CarouselItem className="person-carousel-item" key={persona}>{renderItem ? renderItem(persona) : <button className={`person-pill ${persona === selected ? "is-active" : ""}`} onClick={() => { onSelect(persona); api?.scrollTo(personas.indexOf(persona)) }} type="button"><PersonAvatar persona={persona} /><strong>{persona}</strong><span>{personas.indexOf(persona) + 1} de {personas.length}</span></button>}</CarouselItem>)}</CarouselContent>
    {showArrows ? <CarouselNext className="btn-outline person-carousel-arrow" /> : null}
    {showPagination ? <div className="person-carousel-pagination"><button aria-label="Persona anterior" disabled={!canScrollPrev} onClick={() => api?.scrollPrev()} type="button"><ChevronLeftIcon /></button><div>{personas.map((persona, index) => <button aria-label={`Ver ${persona}`} className={index === selectedIndex ? "active" : ""} key={persona} onClick={() => { onSelect(persona); api?.scrollTo(index) }} type="button" />)}</div><button aria-label="Persona siguiente" disabled={!canScrollNext} onClick={() => api?.scrollNext()} type="button"><ChevronRightIcon /></button></div> : null}
  </Carousel>
}
