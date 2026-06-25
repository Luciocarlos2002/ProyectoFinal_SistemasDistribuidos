import { formatDate, formatSoles } from '@/lib/utils'
import StatusBadge from './StatusBadge'
import type { Rental } from '@/lib/api/types'

interface Props {
  rentals: Rental[]
  onRowClick: (rental: Rental) => void
}

export default function RentalTable({ rentals, onRowClick }: Props) {
  if (rentals.length === 0) {
    return (
      <div className="text-center py-16 text-slate-400">
        <p className="text-lg font-medium">Sin resultados</p>
        <p className="text-sm mt-1">No se encontraron operaciones con los filtros aplicados.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">N° Operación</th>
            <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Cliente</th>
            <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Película</th>
            <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Ejemplar</th>
            <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Fecha Alquiler</th>
            <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Fecha Devolución</th>
            <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Tarifa</th>
            <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Estado</th>
          </tr>
        </thead>
        <tbody>
          {rentals.map((rental, idx) => (
            <tr
              key={rental.rental_id}
              onClick={() => onRowClick(rental)}
              className={`
                border-b border-slate-100 cursor-pointer transition-colors duration-100
                hover:bg-blue-50
                ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}
              `}
            >
              <td className="px-4 py-3 font-mono-data text-blue-700 font-medium">#{rental.rental_id}</td>
              <td className="px-4 py-3 font-medium text-slate-800">{rental.customer_name}</td>
              <td className="px-4 py-3 text-slate-700">{rental.film_title}</td>
              <td className="px-4 py-3 font-mono-data text-slate-500">ID-{rental.inventory_id}</td>
              <td className="px-4 py-3 font-mono-data text-slate-500 text-xs">{formatDate(rental.rental_date)}</td>
              <td className="px-4 py-3 font-mono-data text-slate-500 text-xs">{formatDate(rental.return_date)}</td>
              <td className="px-4 py-3 font-mono-data text-slate-700">{formatSoles(rental.rental_rate)}</td>
              <td className="px-4 py-3"><StatusBadge status={rental.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
