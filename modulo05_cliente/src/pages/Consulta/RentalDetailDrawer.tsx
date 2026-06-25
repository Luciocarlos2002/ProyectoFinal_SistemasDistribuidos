import { X, Trash2 } from 'lucide-react'
import { formatDate, formatSoles } from '@/lib/utils'
import StatusBadge from '@/components/StatusBadge'
import type { Rental } from '@/lib/api/types'

interface Props {
  rental: Rental
  onClose: () => void
  onAnular: () => void
}

export default function RentalDetailDrawer({ rental, onClose, onAnular }: Props) {
  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />

      {/* Drawer */}
      <aside className="relative z-10 w-full max-w-sm bg-white shadow-2xl flex flex-col animate-fade-in border-l border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">Detalle de operación</p>
            <h2 className="font-bold text-slate-800 font-mono-data mt-0.5">#{rental.rental_id}</h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <div className="flex justify-center">
            <StatusBadge status={rental.status} className="text-sm px-4 py-1" />
          </div>

          <div className="rounded-xl border border-slate-200 divide-y divide-slate-100 text-sm">
            {[
              ['N° Operación',    `#${rental.rental_id}`],
              ['Cliente',         rental.customer_name],
              ['Película',        rental.film_title],
              ['Ejemplar',        `ID-${rental.inventory_id}`],
              ['Tarifa/día',      formatSoles(rental.rental_rate)],
              ['Fecha alquiler',  formatDate(rental.rental_date)],
              ['Fecha devolución', formatDate(rental.return_date)],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between px-4 py-3">
                <span className="text-slate-400 text-xs uppercase tracking-wide font-medium">{k}</span>
                <span className="font-mono-data font-medium text-slate-800 text-right text-sm">{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 p-5 flex flex-col gap-2">
          {rental.status === 'ACTIVE' && (
            <button
              onClick={onAnular}
              className="flex items-center justify-center gap-2 w-full rounded-lg bg-rose-600 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 transition-colors"
            >
              <Trash2 size={15} />
              Anular Operación
            </button>
          )}
          <button
            onClick={onClose}
            className="w-full rounded-lg border border-slate-300 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </aside>
    </div>
  )
}
