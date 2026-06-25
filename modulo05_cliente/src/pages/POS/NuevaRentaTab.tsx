import { useState } from 'react'
import { Search, CheckCircle2, AlertTriangle, Loader2, Film, User } from 'lucide-react'
import { toast } from 'sonner'
import StepCard from '@/components/StepCard'
import { Skeleton } from '@/components/Skeleton'
import { formatSoles, formatDate } from '@/lib/utils'
import * as api from '@/lib/api'
import type { Customer, InventoryItem } from '@/lib/api/types'
import { currentStaff } from '@/lib/api/mockData'

export default function NuevaRentaTab() {
  // Step 1 state
  const [customerQuery, setCustomerQuery] = useState('')
  const [customerResults, setCustomerResults] = useState<Customer[] | null>(null)
  const [customerLoading, setCustomerLoading] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)

  // Step 2 state
  const [inventoryId, setInventoryId] = useState('')
  const [inventoryItem, setInventoryItem] = useState<InventoryItem | null>(null)
  const [inventoryLoading, setInventoryLoading] = useState(false)
  const [inventoryError, setInventoryError] = useState<string | null>(null)

  // Step 3 state
  const [submitting, setSubmitting] = useState(false)
  const [successRental, setSuccessRental] = useState<{ id: number; date: string } | null>(null)

  const step1Done = !!selectedCustomer
  const step2Done = !!inventoryItem && inventoryItem.available
  const canSubmit = step1Done && step2Done && !selectedCustomer?.has_debt

  async function handleSearchCustomer() {
    if (!customerQuery.trim()) return
    setCustomerLoading(true)
    setCustomerResults(null)
    setSelectedCustomer(null)
    try {
      const results = await api.searchCustomers(customerQuery)
      setCustomerResults(results)
    } finally {
      setCustomerLoading(false)
    }
  }

  async function handleCheckInventory() {
    const id = parseInt(inventoryId)
    if (!id) return
    setInventoryLoading(true)
    setInventoryItem(null)
    setInventoryError(null)
    try {
      const item = await api.getInventoryItem(id)
      if (!item) {
        setInventoryError('Ejemplar no encontrado.')
      } else {
        setInventoryItem(item)
      }
    } finally {
      setInventoryLoading(false)
    }
  }

  async function handleSubmit() {
    if (!selectedCustomer || !inventoryItem) return
    setSubmitting(true)
    try {
      const rental = await api.createRental({
        customer_id: selectedCustomer.customer_id,
        inventory_id: inventoryItem.inventory_id,
        staff_id: currentStaff.staff_id,
      })
      setSuccessRental({ id: rental.rental_id, date: rental.rental_date })
      toast.success(`Renta #${rental.rental_id} registrada exitosamente`)
      // reset
      setCustomerQuery('')
      setCustomerResults(null)
      setSelectedCustomer(null)
      setInventoryId('')
      setInventoryItem(null)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al registrar la renta')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-xl space-y-4">
      {/* Success banner */}
      {successRental && (
        <div className="animate-fade-in flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <CheckCircle2 size={20} className="text-emerald-600 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-emerald-800">Renta registrada exitosamente</p>
            <p className="text-sm text-emerald-600 mt-0.5">
              <span className="font-mono-data">N° Operación: #{successRental.id}</span>
              {' · '}
              {formatDate(successRental.date)}
            </p>
          </div>
          <button onClick={() => setSuccessRental(null)} className="ml-auto text-emerald-400 hover:text-emerald-600 text-lg leading-none">×</button>
        </div>
      )}

      {/* Step 1: Customer search */}
      <StepCard step={1} title="Buscar cliente" state={step1Done ? 'completed' : 'active'}>
        <div className="flex gap-2">
          <input
            value={customerQuery}
            onChange={e => setCustomerQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearchCustomer()}
            placeholder="Nombre del cliente..."
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={handleSearchCustomer}
            disabled={customerLoading || !customerQuery.trim()}
            className="flex items-center gap-2 rounded-lg bg-[#1E3A8A] px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {customerLoading ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
            Buscar
          </button>
        </div>

        {/* Results skeleton */}
        {customerLoading && (
          <div className="mt-3 space-y-2">
            {[1, 2].map(i => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
          </div>
        )}

        {/* Customer results */}
        {customerResults !== null && !customerLoading && (
          <div className="mt-3 space-y-2">
            {customerResults.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-3">Sin resultados</p>
            ) : (
              customerResults.map(c => (
                <button
                  key={c.customer_id}
                  onClick={() => { setSelectedCustomer(c); setCustomerResults(null) }}
                  className="w-full text-left rounded-lg border border-slate-200 px-4 py-3 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-800 text-sm">{c.name}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{c.email}</p>
                    </div>
                    {c.has_debt && (
                      <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-2 py-0.5">
                        <AlertTriangle size={12} /> Deuda pendiente
                      </span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        )}

        {/* Selected customer card */}
        {selectedCustomer && (
          <div className="mt-3 animate-fade-in">
            <div className={`rounded-lg border p-3 ${selectedCustomer.has_debt ? 'border-amber-300 bg-amber-50' : 'border-emerald-200 bg-emerald-50'}`}>
              <div className="flex items-center gap-2 justify-between">
                <div className="flex items-center gap-2">
                  <User size={16} className={selectedCustomer.has_debt ? 'text-amber-600' : 'text-emerald-600'} />
                  <div>
                    <p className="font-semibold text-sm text-slate-800">{selectedCustomer.name}</p>
                    <p className="text-xs text-slate-500">{selectedCustomer.email}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedCustomer(null)} className="text-slate-400 hover:text-slate-600 text-sm">Cambiar</button>
              </div>
              {selectedCustomer.has_debt && (
                <div className="mt-2 flex items-center gap-2 text-amber-700 text-xs font-medium">
                  <AlertTriangle size={13} />
                  Este cliente tiene deuda pendiente. No puede realizar un nuevo alquiler.
                </div>
              )}
            </div>
          </div>
        )}
      </StepCard>

      {/* Step 2: Inventory */}
      <StepCard step={2} title="Número de ejemplar" state={step2Done ? 'completed' : step1Done ? 'active' : 'idle'}>
        <div className="flex gap-2">
          <input
            value={inventoryId}
            onChange={e => setInventoryId(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCheckInventory()}
            placeholder="Ej: 2"
            type="number"
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono-data focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={handleCheckInventory}
            disabled={inventoryLoading || !inventoryId || !step1Done}
            className="flex items-center gap-2 rounded-lg bg-[#0D9488] px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {inventoryLoading ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
            Verificar
          </button>
        </div>

        {inventoryLoading && <Skeleton className="mt-3 h-20 w-full rounded-lg" />}

        {inventoryError && (
          <p className="mt-3 text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">{inventoryError}</p>
        )}

        {inventoryItem && !inventoryLoading && (
          <div className={`mt-3 animate-fade-in rounded-lg border p-3 ${inventoryItem.available ? 'border-emerald-200 bg-emerald-50' : 'border-rose-200 bg-rose-50'}`}>
            <div className="flex items-start gap-2">
              <Film size={16} className={inventoryItem.available ? 'text-emerald-600 mt-0.5' : 'text-rose-500 mt-0.5'} />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-slate-800">{inventoryItem.film_title}</p>
                <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                  <span>{inventoryItem.store_name}</span>
                  <span className="font-mono-data font-medium text-slate-700">{formatSoles(inventoryItem.rental_rate)}/día</span>
                </div>
              </div>
              <span className={`shrink-0 text-xs font-bold px-2 py-0.5 rounded ${inventoryItem.available ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                {inventoryItem.available ? 'DISPONIBLE' : 'NO DISPONIBLE'}
              </span>
            </div>
          </div>
        )}
      </StepCard>

      {/* Step 3: Confirm */}
      <StepCard step={3} title="Confirmar préstamo" state={canSubmit ? 'active' : 'idle'}>
        {selectedCustomer && inventoryItem ? (
          <div className="space-y-3">
            <div className="rounded-lg bg-slate-50 border border-slate-200 divide-y divide-slate-100 text-sm">
              {[
                ['Cliente',    selectedCustomer.name],
                ['Película',   inventoryItem?.film_title ?? '—'],
                ['Ejemplar',   `ID-${inventoryItem?.inventory_id}`],
                ['Tarifa',     formatSoles(inventoryItem?.rental_rate ?? 0) + '/día'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between px-4 py-2.5">
                  <span className="text-slate-500">{k}</span>
                  <span className="font-medium text-slate-800 font-mono-data text-right">{v}</span>
                </div>
              ))}
            </div>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit || submitting}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#1E3A8A] py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting && <Loader2 size={15} className="animate-spin" />}
              {submitting ? 'Registrando...' : 'Confirmar Préstamo'}
            </button>
          </div>
        ) : (
          <p className="text-sm text-slate-400">Completa los pasos anteriores para continuar.</p>
        )}
      </StepCard>
    </div>
  )
}
