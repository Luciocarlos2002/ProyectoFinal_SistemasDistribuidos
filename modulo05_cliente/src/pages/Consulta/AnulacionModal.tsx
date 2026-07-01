import { useState } from 'react'
import { AlertTriangle, X, Loader2, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { formatDate, formatSoles } from '@/lib/utils'
import StatusBadge from '@/components/StatusBadge'
import { Skeleton } from '@/components/Skeleton'
import * as api from '@/lib/api'
import type { Rental } from '@/lib/api/types'

interface Props {
  rental: Rental
  onClose: () => void
  onCancelled: (updated: Rental) => void
}

export default function AnulacionModal({ rental, onClose, onCancelled }: Props) {
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  async function handleConfirm() {
    setSubmitting(true)
    try {
      const updated = await api.cancelRental(rental.rental_id)
      setDone(true)
      toast.success(`Operación #${rental.rental_id} anulada exitosamente`)
      onCancelled(updated)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al anular la operación')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Dialog */}
      <div className="relative z-10 w-full max-w-md rounded-2xl bg-white shadow-2xl animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="font-bold text-slate-800">
            Anular Operación <span className="font-mono-data text-rose-600">#{rental.rental_id}</span>
          </h2>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {done ? (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <CheckCircle2 size={40} className="text-emerald-500" />
              <div>
                <p className="font-semibold text-slate-800">Operación anulada exitosamente</p>
                <p className="text-sm text-slate-500 mt-1">
                  El ejemplar ha sido liberado
                  {rental.rental_rate > 0 && (
                    <> · Devolución: <span className="font-mono-data font-semibold text-emerald-600">{formatSoles(rental.rental_rate)}</span></>
                  )}
                </p>
                <p className="text-sm mt-1">
                  <StatusBadge status="CANCELLED" />
                </p>
              </div>
              <button
                onClick={onClose}
                className="mt-2 rounded-lg bg-slate-100 px-6 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 transition-colors"
              >
                Cerrar
              </button>
            </div>
          ) : (
            <>
              {/* Warning banner */}
              <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                <AlertTriangle size={18} className="text-amber-600 mt-0.5 shrink-0" />
                <p className="text-sm text-amber-800">
                  Esta acción liberará el ejemplar y puede generar un reembolso si aplica. Esta operación no se puede deshacer.
                </p>
              </div>

              {/* Rental summary */}
              {submitting ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-8 w-full rounded" />)}
                </div>
              ) : (
                <div className="rounded-xl border border-slate-200 divide-y divide-slate-100 text-sm">
                  {[
                    ['Cliente',      rental.customer_name],
                    ['Película',     rental.film_title],
                    ['Ejemplar',     `ID-${rental.inventory_id}`],
                    ['Fecha alquiler', formatDate(rental.rental_date)],
                    ['Tarifa',       formatSoles(rental.rental_rate) + '/día'],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between px-4 py-2.5">
                      <span className="text-slate-500">{k}</span>
                      <span className="font-mono-data font-medium text-slate-800 text-right">{v}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Refund highlight */}
              <div className="flex items-center justify-between rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3">
                <span className="text-sm font-medium text-emerald-800">Devolución estimada</span>
                <span className="font-mono-data font-bold text-emerald-700 text-lg">{formatSoles(rental.rental_rate)}</span>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button
                  onClick={onClose}
                  className="flex-1 rounded-lg border border-slate-300 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-rose-600 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting && <Loader2 size={15} className="animate-spin" />}
                  {submitting ? 'Anulando...' : 'Confirmar Anulación'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
