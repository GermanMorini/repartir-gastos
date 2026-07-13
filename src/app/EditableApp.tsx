import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import "driver.js/dist/driver.css"
import "./desktop-fixes.css"
import "./tutorial-demo.css"
import "./mobile-actions.css"
import "./adaptive-layout.css"
import { DesktopWorkspace } from "./DesktopWorkspace"
import { Header } from "./Header"
import { MobileWorkspace } from "./MobileWorkspace"
import { BottomNavigation } from "../components/navigation/BottomNavigation"
import { PersonSummaryMobilePage } from "../features/person-summary/PersonSummary"
import { EditMovimientoDialog } from "../sections/movimientos/EditMovimientoDialog"
import { GastoForm } from "../sections/movimientos/GastoForm"
import { TransferenciaForm } from "../sections/movimientos/TransferenciaForm"
import { PersonasSection } from "../sections/personas/PersonasSection"
import { ResumenSection } from "../sections/resumen/ResumenSection"
import { CategoryChartShareCard } from "../sections/total/CategoryChart"
import { getResumenPersona } from "../lib/calculos"
import { nombreMovimiento, textoReparto } from "../lib/share-text"
import { useAdaptivePageSize, useIsMobile } from "../lib/viewport"
import type { MobileSection } from "./tutorial"
import { useAppState } from "./controllers/useAppState"
import { useShareActions } from "./controllers/useShareActions"
import { useTutorialController } from "./controllers/useTutorialController"
import { useMovementForms } from "./controllers/useMovementForms"
import { useOverlayState } from "./controllers/useOverlayState"
import { useSectionNavigation } from "./controllers/useSectionNavigation"
import { MobileActionsDrawer } from "./mobile/MobileActionsDrawer"
import { MobileMovements } from "./mobile/MobileMovements"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { Toaster } from "@/components/ui/sonner"
import type { Persona } from "../types"

export default function EditableApp() {
  const {
    personas, movimientos, movimientosCard, saldos, pendientes, matrizCalculos, gastosPorCategoria,
    totalGastado, promedio, setPersonas, setMovimientos, addPerson, deletePerson, addExpense,
    addTransfer, updateMovement, deleteMovement, clearAll,
  } = useAppState()
  const [nombre, setNombre] = useState("")
  const movementForms = useMovementForms({ personas, addExpense, addTransfer, updateMovement })
  const {
    gasto, transferencia, edicion, movementTab, setGasto, setTransferencia, setEdicion,
    setMovementTab, submitExpense: agregarGasto, submitTransfer: agregarTransferencia,
    openEdit: abrirEdicion, submitEdit: aceptarEdicion, editExpense: editarGasto,
    editTransfer: editarTransferencia,
  } = movementForms
  const navigation = useSectionNavigation()
  const { activeSection, desktopSection, animating: sectionAnimating, setActiveSection, setDesktopSection, goToSection: irASeccion, mobileViewClass: vistaMobile } = navigation
  const [mobileMovementPage, setMobileMovementPage] = useState(1)
  const [mobileMovementPageDirection, setMobileMovementPageDirection] = useState<"next" | "prev">("next")
  const [mobileMovementPageAnimating, setMobileMovementPageAnimating] = useState(false)
  const isMobile = useIsMobile()
  const overlays = useOverlayState()
  const {
    mobileActionsOpen, mobileMovementSheetOpen, mobileActionsView, mobileActionsDirection,
    mobileActionsPanelAnimating, settlementOpen, resumenOpenPersona, resumenClosing, calculosOpen,
    graficoOpen, setMobileActionsOpen, setMobileMovementSheetOpen, setMobileActionsView,
    setMobileActionsDirection, setMobileActionsPanelAnimating, setSettlementOpen,
    setResumenOpenPersona, setCalculosOpen, setGraficoOpen, openPersonSummary: abrirResumenPersona,
    closePersonSummary: cerrarResumenPersona, openMobileAction: abrirAccionMobile,
    backToMobileActions: volverAccionesMobile,
  } = overlays
  const exportCategoriasRef = useRef<HTMLDivElement | null>(null)
  const calculosRef = useRef<HTMLDivElement | null>(null)
  const movementSectionRef = useRef<HTMLElement | null>(null)
  const movementListRef = useRef<HTMLDivElement | null>(null)
  const mobileMovementPageTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null)
  const tutorial = useTutorialController({
    personas,
    movimientos,
    setPersonas,
    setMovimientos,
    setNombre,
    setGasto,
    setTransferencia,
    setMovementTab,
    setMobileMovementPage,
    setActiveSection,
    setDesktopSection,
    setSettlementOpen,
    setResumenOpenPersona,
    setCalculosOpen,
    setGraficoOpen,
  })
  const {
    dialogOpen: tutorialDialogOpen,
    hideTutorial,
    demoActiveTarget,
    setHideTutorial,
    closeDialog: cerrarTutorialDialog,
    skipTutorial: omitirTutorial,
    startTutorial: iniciarTutorialConMockup,
    acceptTutorial: aceptarTutorial,
  } = tutorial

  useEffect(() => () => {
    if (mobileMovementPageTimerRef.current) window.clearTimeout(mobileMovementPageTimerRef.current)
  }, [])

  const mobileMovementPageSize = useAdaptivePageSize({
    containerRef: movementSectionRef,
    listRef: movementListRef,
    itemSelector: ".movement-row",
    fallbackItemHeight: 66,
    min: 1,
    max: 8,
    enabled: isMobile && activeSection === "movimientos",
    bottomReserve: 24,
    deps: [movimientosCard.length, activeSection],
  })
  const mobileMovementTotalPages = Math.max(1, Math.ceil(movimientosCard.length / mobileMovementPageSize))
  const currentMobileMovementPage = Math.min(mobileMovementPage, mobileMovementTotalPages)
  const mobileMovimientos = movimientosCard.slice((currentMobileMovementPage - 1) * mobileMovementPageSize, currentMobileMovementPage * mobileMovementPageSize)

  const resumenCopiable = textoReparto(pendientes)
  const shareActions = useShareActions({
    personas,
    movimientos,
    pendientes,
    gastosPorCategoria,
    totalGastado,
    resumenCopiable,
    isMobile,
    categoryExportRef: exportCategoriasRef,
    calculationsExportRef: calculosRef,
  })

  const mostrarSeccion = (seccion: MobileSection) => !isMobile || activeSection === seccion
  const cambiarPaginaMovimientos = (nextPage: number) => {
    setMobileMovementPageDirection(nextPage > currentMobileMovementPage ? "next" : "prev")
    setMobileMovementPageAnimating(true)
    if (mobileMovementPageTimerRef.current) window.clearTimeout(mobileMovementPageTimerRef.current)
    mobileMovementPageTimerRef.current = window.setTimeout(() => setMobileMovementPageAnimating(false), 190)
    setMobileMovementPage(nextPage)
  }
  function agregarPersona() {
    const result = addPerson(nombre)
    if (!result.ok) return toast.error(result.message)
    setNombre("")
  }

  function borrarPersona(persona: Persona) {
    deletePerson(persona)
  }

  function limpiarTodo() {
    clearAll()
    movementForms.reset()
  }

  const gastoFormDesktop = <GastoForm onChange={setGasto} onSubmit={agregarGasto} personas={personas} value={gasto} variant="desktop" />
  const transferenciaFormDesktop = <TransferenciaForm onChange={setTransferencia} onSubmit={agregarTransferencia} personas={personas} value={transferencia} variant="desktop" />

  return (
    <main className="app-bg">
      <Toaster richColors position={isMobile ? "top-center" : "bottom-left"} />
      <Dialog open={tutorialDialogOpen} onOpenChange={cerrarTutorialDialog}>
        <DialogContent className="tutorial-dialog">
          <DialogTitle>¿Primera vez usando la app?</DialogTitle>
          <DialogDescription>Podés hacer un tutorial guiado para no perderte.</DialogDescription>
          <label className="tutorial-checkbox" htmlFor="hide-tutorial">
            <Checkbox checked={hideTutorial} id="hide-tutorial" onCheckedChange={(checked) => setHideTutorial(checked === true)} />
            No mostrar más
          </label>
          <div className="dialog-actions">
            <Button className="btn-outline" onClick={omitirTutorial} type="button">Ahora no</Button>
            <Button onClick={() => void aceptarTutorial()} type="button">Aceptar</Button>
          </div>
        </DialogContent>
      </Dialog>
      <div className="export-offscreen">
        <div ref={exportCategoriasRef}>
          <CategoryChartShareCard data={gastosPorCategoria} total={totalGastado} />
        </div>
      </div>
      {isMobile ? (
        <>
          <Header onActionsClick={() => { setMobileActionsPanelAnimating(false); setMobileActionsView("menu"); setMobileActionsDirection("forward"); setMobileActionsOpen(true) }} />
          <MobileActionsDrawer
            animating={mobileActionsPanelAnimating}
            calculationsRef={calculosRef}
            categories={gastosPorCategoria}
            direction={mobileActionsDirection}
            onBack={volverAccionesMobile}
            onClear={() => { limpiarTodo(); setMobileActionsOpen(false) }}
            onCopyCategories={() => void shareActions.copyCategories()}
            onExportCalculations={() => void shareActions.exportCalculationsImage()}
            onExportCategories={() => void shareActions.exportCategoryImage()}
            onOpenChange={(open) => { setMobileActionsOpen(open); if (!open) setMobileActionsView("menu") }}
            onView={abrirAccionMobile}
            open={mobileActionsOpen}
            personas={personas}
            rows={matrizCalculos}
            total={totalGastado}
            view={mobileActionsView}
          />
        </>
      ) : null}

      {isMobile ? (
      <MobileWorkspace>
        <div className="app-panel">

          {mostrarSeccion("personas") ? (
            <PersonasSection
              className={vistaMobile("personas")}
              demoActiveTarget={demoActiveTarget}
              personas={personas}
              nombre={nombre}
              onNombreChange={setNombre}
              onAdd={agregarPersona}
              onDelete={borrarPersona}
              onStartTutorial={() => void iniciarTutorialConMockup()}
              suppressListAnimation={sectionAnimating}
            />
          ) : null}

          {mostrarSeccion("movimientos") ? <MobileMovements
            className={vistaMobile("movimientos")}
            demoTarget={demoActiveTarget}
            edit={edicion}
            formOpen={mobileMovementSheetOpen}
            gasto={gasto}
            listRef={movementListRef}
            movementCount={movimientos.length}
            onAddGasto={agregarGasto}
            onAddTransferencia={agregarTransferencia}
            onCopy={() => void shareActions.copyMovements()}
            onDelete={deleteMovement}
            onEdit={abrirEdicion}
            onEditChange={setEdicion}
            onEditGasto={editarGasto}
            onEditTransferencia={editarTransferencia}
            onFormOpenChange={setMobileMovementSheetOpen}
            onGastoChange={setGasto}
            onPage={cambiarPaginaMovimientos}
            onShare={() => void shareActions.shareMovements()}
            onSubmitEdit={aceptarEdicion}
            onTabChange={setMovementTab}
            onTransferenciaChange={setTransferencia}
            page={currentMobileMovementPage}
            pageAnimating={mobileMovementPageAnimating}
            pageDirection={mobileMovementPageDirection}
            pageSize={mobileMovementPageSize}
            personas={personas}
            sectionRef={movementSectionRef}
            suppressAnimation={sectionAnimating}
            tab={movementTab}
            totalPages={mobileMovementTotalPages}
            transferencia={transferencia}
            visibleMovements={mobileMovimientos}
          /> : null}

        </div>

        <aside className="desktop-summary">
          {mostrarSeccion("resumen") ? (
            <ResumenSection
              calculosOpen={calculosOpen}
              calculosRef={calculosRef}
              className={vistaMobile("resumen")}
              matrizCalculos={matrizCalculos}
              movimientos={movimientos}
              onCalculosOpenChange={setCalculosOpen}
              onExportCalculos={() => void shareActions.exportCalculationsImage()}
              gastosPorCategoria={gastosPorCategoria}
              graficoOpen={graficoOpen}
              onCopyCategorias={() => void shareActions.copyCategories()}
              onExportGrafico={() => void shareActions.exportCategoryImage()}
              onGraficoOpenChange={setGraficoOpen}
              onResumenOpenPersonaChange={abrirResumenPersona}
              onShareLink={() => void shareActions.shareSummaryLink()}
              onSettlementOpenChange={setSettlementOpen}
              onShareReparto={() => void shareActions.shareSettlement()}
              personas={personas}
              pendientes={pendientes}
              saldos={saldos}
              settlementOpen={settlementOpen}
              suppressListAnimation={sectionAnimating}
              totalGastado={totalGastado}
            />
          ) : null}
        </aside>
      </MobileWorkspace>
      ) : (
        <>
          <DesktopWorkspace
            desktopSection={desktopSection}
            gastoForm={gastoFormDesktop}
            gastosPorCategoria={gastosPorCategoria}
            movimientos={movimientos}
            movimientosCard={movimientosCard}
            movementTab={movementTab}
            nombre={nombre}
            nombreMovimiento={nombreMovimiento}
            onAddPersona={agregarPersona}
            onClear={limpiarTodo}
            onCopyMovimientos={() => void shareActions.copyMovements()}
            onDeletePersona={borrarPersona}
            onDesktopSectionChange={setDesktopSection}
            onEditMovimiento={abrirEdicion}
            onMovementTabChange={setMovementTab}
            onNombreChange={setNombre}
            onSettlementOpenChange={setSettlementOpen}
            onShareLink={() => void shareActions.shareSummaryLink()}
            onShareReparto={() => void shareActions.shareSettlement()}
            pendientes={pendientes}
            personas={personas}
            promedio={promedio}
            saldos={saldos}
            settlementOpen={settlementOpen}
            totalGastado={totalGastado}
            transferenciaForm={transferenciaFormDesktop}
          />
          <EditMovimientoDialog
            edicion={edicion}
            onChange={setEdicion}
            onClose={() => setEdicion(null)}
            onEditarGasto={editarGasto}
            onEditarTransferencia={editarTransferencia}
            onSubmit={aceptarEdicion}
            personas={personas}
          />
        </>
      )}
      {isMobile && resumenOpenPersona ? (
        <PersonSummaryMobilePage
          initialPersona={resumenOpenPersona}
          closing={resumenClosing}
          movimientos={movimientos}
          onBack={cerrarResumenPersona}
          onShare={(persona) => void shareActions.sharePerson(getResumenPersona(persona, movimientos))}
          personas={personas}
          title="Hoja de liquidación"
        />
      ) : null}
      {isMobile ? <BottomNavigation activeSection={activeSection} onChange={irASeccion} /> : null}
    </main>
  )
}
