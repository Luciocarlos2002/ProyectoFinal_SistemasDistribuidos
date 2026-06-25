import { useState, useEffect, useCallback } from 'react'
import { Search, Calendar, CalendarDays, User, Hash } from 'lucide-react'
import { cn } from '@/lib/utils'
import RentalTable from '@/components/RentalTable'
import { SkeletonRows } from '@/components/Skeleton'
import RentalDetailDrawer from './RentalDetailDrawer'
import AnulacionModal from './AnulacionModal'
import * as api from '@/lib/api'
import type { Rental, RentalsFilter } from '@/lib/api/types'

type FilterTab = 'hoy' | 'semana' | 'cliente' | 'operacion'

const filterTabs: { id: FilterTab; label: string; icon: React.FC<{ size?: number }> }[] = [
  { id: 'hoy',       label: 'Hoy',             icon: Calendar },
  { id: 'semana',    label: 'Esta semana',      icon: CalendarDays },
  { id: 'cliente',   label: 'Por cliente',      icon: User },
  { id: 'operacion', label: 'Por N° operación', icon: Hash },
]

export default function ConsultaPage() {
  const [activeFilter, setActiveFilter] = useState<FilterTab>('semana')
  const [customerQuery, setCustomerQuery] = useState('')
  const [rentalIdQuery, setRentalIdQuery] = useState('')

  const [loading, setLoading] = useState(false)
  const [rentals, setRentals] = useState<Rental[]>([])

  const [selectedRental, setSelectedRental] = useState<Rental | null>(null)
  const [showAnulacion, setShowAnulacion] = useState(false)

  const loadRentals = useCallback(async () => {
    setLoading(true)
    try {
      const filters: RentalsFilter = {}
      if (activeFilter === 'hoy')    filters.day  = true
      if (activeFilter === 'semana') filters.week = true
      if (activeFilter === 'cliente' && customerQuery.trim()) {
        // Filter client-side by name since mock doesn't have text search on list
        const all = await api.getRentals({})
        setRentals(all.filter(r => r.customer_name.toLowerCase().includes(customerQuery.toLowerCase())))
        return
      }
      if (activeFilter === 'operacion' && rentalIdQuery.trim()) {
        filters.rental_id = parseInt(rentalIdQuery)
      }
      const data = await api.getRentals(filters)
      setRentals(data)
    } finally {
      setLoading(false)
    }
  }, [activeFilter, customerQuery, rentalIdQuery])

  useEffect(() => {
    if (activeFilter === 'cliente' || activeFilter === 'operacion') return
    loadRentals()
  }, [activeFilter, loadRentals])

  function handleRowClick(rental: Rental) {
    setSelectedRental(rental)
    setShowAnulacion(false)
  }

  function handleCancelled(updated: Rental) {
    setRentals(prev => prev.map(r => r.rental_id === updated.rental_id ? updated : r))
    if (selectedRental?.rental_id === updated.rental_id) {
      setSelectedRental(updated)
    }
  }

  return (
    <div>
      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 mb-5">
        {filterTabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => { setActiveFilter(id); setRentals([]) }}
            className={cn(
              'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium border transition-all duration-150',
              activeFilter === id
                ? 'bg-[#0D9488] text-white border-[#0D9488] shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:border-teal-300 hover:text-teal-700',
            )}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* Search inputs for cliente / operacion */}
      {activeFilter === 'cliente' && (
        <div className="flex gap-2 mb-5 max-w-md">
          <input
            value={customerQuery}
            onChange={e => setCustomerQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && loadRentals()}
            placeholder="Nombre del cliente..."
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
          <button
            onClick={loadRentals}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-[#0D9488] px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50 transition-colors"
          >
            <Search size={15} /> Buscar
          </button>
        </div>
      )}

      {activeFilter === 'operacion' && (
        <div className="flex gap-2 mb-5 max-w-xs">
          <input
            value={rentalIdQuery}
            onChange={e => setRentalIdQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && loadRentals()}
            placeholder="N° de operación..."
            type="number"
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono-data focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
          <button
            onClick={loadRentals}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-[#0D9488] px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50 transition-colors"
          >
            <Search size={15} /> Buscar
          </button>
        </div>
      )}

      {/* Table card */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-700 text-sm">Operaciones de alquiler</h2>
          {!loading && <span className="text-xs text-slate-400 font-mono-data">{rentals.length} resultado{rentals.length !== 1 ? 's' : ''}</span>}
        </div>

        {loading ? (
          <SkeletonRows count={5} />
        ) : (
          <RentalTable rentals={rentals} onRowClick={handleRowClick} />
        )}
      </div>

      {/* Detail drawer */}
      {selectedRental && !showAnulacion && (
        <RentalDetailDrawer
          rental={selectedRental}
          onClose={() => setSelectedRental(null)}
          onAnular={() => setShowAnulacion(true)}
        />
      )}

      {/* Anulacion modal */}
      {selectedRental && showAnulacion && (
        <AnulacionModal
          rental={selectedRental}
          onClose={() => { setShowAnulacion(false); setSelectedRental(null) }}
          onCancelled={handleCancelled}
        />
      )}
    </div>
  )
}
