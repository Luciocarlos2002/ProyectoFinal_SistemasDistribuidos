import { useState } from 'react'
import { Search, CheckCircle2, AlertTriangle, Loader2, Clock } from 'lucide-react'
import { toast } from 'sonner'
import StepCard from '@/components/StepCard'
import { Skeleton } from '@/components/Skeleton'
import { formatDate, formatSoles } from '@/lib/utils'
import * as api from '@/lib/api'
import type { Rental, PenaltyPreview } from '@/lib/api/types'
import { currentStaff } from '@/lib/api/mockData'

export default function DevolucionTab() {
  const [inventoryId, setInventoryId] = useState('')
  const [searchLoading, setSearchLoading] = useState(false)
  const [activeRental, setActiveRental] = useState<Rental | null>(null)
  const [searchError, setSearchError] = useState<string | null>(null)

  const [penalty, setPenalty] = useState<PenaltyPreview | null>(null)
  const [penaltyLoaded, setPenaltyLoaded] = useState(false)

  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSearch() {
    const id = parseInt(inventoryId)
    if (!id) return
    setSearchLoading(true)
    setActiveRental(null)
    setSearchError(null)
    setPenalty(null)
    setPenaltyLoaded(false)
    setDone(false)
    try {
      const rental = await api.getActiveRentalByInventory(id)
      if (!rental) {
        setSearchError('No hay un préstamo activo para este ejemplar.')
      } else {
        setActiveRental(rental)
        // auto-load penalty
        const p = await api.getPenaltyPreview(rental.rental_id)
        setPenalty(p)
        setPenaltyLoaded(true)
      }
    } finally {
      setSearchLoading(false)
    }
  }

  async function handleConfirm() {
    if (!activeRental) return
    setSubmitting(true)
    try {
      await api.returnRental(activeRental.rental_id, { staff_id: currentStaff.staff_id })
      setDone(true)
      const penaltyMsg = penalty && penalty.penalty_amount > 0
        ? `, penalidad cobrada ${formatSoles(penalty.penalty_amount)}`
        : ''
      toast.success(`Devolución registrada exitosamente${penaltyMsg}`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al registrar devolución')
    } finally {
      setSubmitting(false)
    }
  }

  function handleReset() {
    setInventoryId('')
    setActiveRental(null)
    setSearchError(null)
    setPenalty(null)
    setPenaltyLoaded(false)
    setDone(false)
  }

  const step1Done = !!activeRental
  const step2Done = penaltyLoaded

  return (
    <div className="max-w-xl space-y-4">
      {done && (
        <div className="animate-fade-in flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <CheckCircle2 size={20} className="text-emerald-600 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-emerald-800">Devolución registrada exitosamente</p>
            <p className="text-sm text-emerald-600 mt-0.5">
              Renta <span className="font-mono-data">#{activeRental?.rental_id}</span> · Ejemplar liberado
              {penalty && penalty.penalty_amount > 0 && (
                <> · Penalidad cobrada: <span className="font-mono-data font-bold">{formatSoles(penalty.penalty_amount)}</span></>
              )}
            </p>
          </div>
          <button onClick={handleReset} className="ml-auto text-emerald-400 hover:text-emerald-600 text-lg leading-none">×</button>
        </div>
      )}

      {/* Step 1 */}
      <StepCard step={1} title="Número de ejemplar" state={step1Done ? 'completed' : 'active'}>
        <div className="flex gap-2">
          <input
            value={inventoryId}
            onChange={e => setInventoryId(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="Ej: 8"
            type="number"
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono-data focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={handleSearch}
            disabled={searchLoading || !inventoryId}
            className="flex items-center gap-2 rounded-lg bg-[#1E3A8A] px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {searchLoading ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
            Buscar préstamo activo
          </button>
        </div>

        {searchLoading && <Skeleton className="mt-3 h-20 w-full rounded-lg" />}
        {searchError && (
          <p className="mt-3 text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">{searchError}</p>
        )}

        {activeRental && !searchLoading && (
          <div className="mt-3 animate-fade-in rounded-lg border border-slate-200 bg-slate-50 divide-y divide-slate-100 text-sm">
            {[
              ['N° Renta',   `#${activeRental.rental_id}`],
              ['Cliente',    activeRental.customer_name],
              ['Película',   activeRental.film_title],
              ['F. Alquiler', formatDate(activeRental.rental_date)],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between px-4 py-2.5">
                <span className="text-slate-500">{k}</span>
                <span className="font-mono-data font-medium text-slate-800 text-right">{v}</span>
              </div>
            ))}
          </div>
        )}
      </StepCard>

      {/* Step 2: Penalty */}
      <StepCard step={2} title="Penalidad" state={step2Done ? 'completed' : step1Done ? 'active' : 'idle'}>
        {!step1Done && <p className="text-sm text-slate-400">Busca el préstamo activo primero.</p>}
        {step1Done && !penaltyLoaded && searchLoading && <Skeleton className="h-24 w-full rounded-lg" />}
        {penaltyLoaded && penalty !== null && (
          <div className={`animate-fade-in rounded-lg border-l-4 p-4 ${penalty.penalty_amount > 0 ? 'border-amber-400 bg-amber-50 border border-amber-200' : 'border-emerald-400 bg-emerald-50 border border-emerald-200'}`}>
            {penalty.penalty_amount > 0 ? (
              <>
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle size={16} className="text-amber-600" />
                  <span className="text-xs font-bold text-amber-700 uppercase tracking-wide">Penalidad detectada</span>
                </div>
                <div className="text-3xl font-bold font-mono-data text-amber-800 mb-1">
                  {formatSoles(penalty.penalty_amount)}
                </div>
                <p className="text-xs text-amber-600 mb-3">Monto total a cobrar</p>
                <div className="space-y-1 text-xs text-slate-600 border-t border-amber-200 pt-3">
                  <div className="flex justify-between"><span className="flex items-center gap-1"><Clock size={11} /> Días transcurridos</span><span className="font-mono-data">{penalty.days_elapsed}</span></div>
                  <div className="flex justify-between"><span>Días de retraso</span><span className="font-mono-data font-semibold text-amber-700">{penalty.days_late}</span></div>
                  <div className="flex justify-between"><span>Tarifa por día</span><span className="font-mono-data">{formatSoles(penalty.penalty_per_day)}</span></div>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <CheckCircle2 size={20} className="text-emerald-600" />
                <div>
                  <p className="font-semibold text-emerald-800">Sin penalidad</p>
                  <p className="text-xs text-emerald-600 mt-0.5">La devolución es a tiempo — sin cargos adicionales.</p>
                </div>
              </div>
            )}
          </div>
        )}
      </StepCard>

      {/* Step 3: Confirm */}
      <StepCard step={3} title="Confirmar devolución" state={step2Done && !done ? 'active' : 'idle'}>
        {step2Done && !done ? (
          <button
            onClick={handleConfirm}
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting && <Loader2 size={15} className="animate-spin" />}
            {submitting ? 'Procesando...' : 'Confirmar Devolución'}
          </button>
        ) : (
          <p className="text-sm text-slate-400">Completa los pasos anteriores para continuar.</p>
        )}
      </StepCard>
    </div>
  )
}
