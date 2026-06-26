import { useState, useEffect } from 'react'
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import StepCard from '@/components/StepCard'
import { Skeleton } from '@/components/Skeleton'
import { formatSoles, formatDate } from '@/lib/utils'
import * as api from '@/lib/api'
import type { Customer, InventoryItem } from '@/lib/api/types'
import CustomerSearch from './CustomerSearch'
import InventorySearch from './InventorySearch'

export default function NuevaRentaTab() {
  const [allCustomers, setAllCustomers] = useState<Customer[]>([])
  const [customerLoading, setCustomerLoading] = useState(true)
  const [customerError, setCustomerError] = useState<string | null>(null)
  const [customerRetry, setCustomerRetry] = useState(0)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)

  const [selectedStore, setSelectedStore] = useState<1 | 2>(1)

  const [allInventory, setAllInventory] = useState<InventoryItem[]>([])
  const [inventoryLoading, setInventoryLoading] = useState(true)
  const [inventoryError, setInventoryError] = useState<string | null>(null)
  const [inventoryRetry, setInventoryRetry] = useState(0)
  const [selectedInventory, setSelectedInventory] = useState<InventoryItem | null>(null)

  const [submitting, setSubmitting] = useState(false)
  const [successRental, setSuccessRental] = useState<{ id: number; date: string } | null>(null)

  const step1Done = !!selectedCustomer
  const step2Done = !!selectedInventory
  const canSubmit = step1Done && step2Done && !selectedCustomer?.has_debt

  function step2State() {
    if (step2Done) return 'completed'
    if (step1Done) return 'active'
    return 'idle' as const
  }

  useEffect(() => {
    setCustomerLoading(true)
    setCustomerError(null)
    api.searchCustomers('')
      .then(setAllCustomers)
      .catch(e => setCustomerError(e instanceof Error ? e.message : 'Error al cargar clientes'))
      .finally(() => setCustomerLoading(false))
  }, [customerRetry])

  useEffect(() => {
    setInventoryLoading(true)
    setInventoryError(null)
    setSelectedInventory(null)
    api.getAllInventoryItems(selectedStore)
      .then(setAllInventory)
      .catch(e => setInventoryError(e instanceof Error ? e.message : 'Error al cargar inventario'))
      .finally(() => setInventoryLoading(false))
  }, [selectedStore, inventoryRetry])

  async function handleSubmit() {
    if (!selectedCustomer || !selectedInventory) return
    setSubmitting(true)
    try {
      const rental = await api.createRental({
        customer_id: selectedCustomer.customer_id,
        inventory_id: selectedInventory.inventory_id,
        film_id: selectedInventory.film_id,
        title: selectedInventory.film_title,
        full_name: selectedCustomer.name,
      })
      setSuccessRental({ id: rental.rental_id, date: rental.rental_date })
      toast.success(`Renta #${rental.rental_id} registrada exitosamente`)
      setSelectedCustomer(null)
      setSelectedInventory(null)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al registrar la renta')
    } finally {
      setSubmitting(false)
    }
  }

  function serviceErrorBanner(message: string, label: string, onRetry: () => void) {
    return (
      <div className="mt-2 flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm">
        <AlertCircle size={15} className="text-rose-500 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-rose-700">{label}</p>
          <p className="text-rose-600 mt-0.5 break-words">{message}</p>
        </div>
        <button
          onClick={onRetry}
          className="text-rose-600 hover:text-rose-800 text-xs font-semibold underline shrink-0"
        >
          Reintentar
        </button>
      </div>
    )
  }

  function inventoryStepContent() {
    if (inventoryLoading) return <Skeleton className="h-10 w-full rounded-lg" />
    if (inventoryError) {
      return serviceErrorBanner(
        inventoryError,
        'Servicio de inventario no disponible',
        () => setInventoryRetry(n => n + 1),
      )
    }
    return (
      <InventorySearch
        items={allInventory}
        loading={inventoryLoading}
        selected={selectedInventory}
        onSelect={setSelectedInventory}
        onClear={() => setSelectedInventory(null)}
        disabled={!step1Done}
      />
    )
  }

  return (
    <div className="max-w-xl space-y-4">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-slate-500">Tienda:</span>
        <div className="flex rounded-lg border border-slate-200 overflow-hidden text-sm">
          {([1, 2] as const).map(id => (
            <button
              key={id}
              onClick={() => setSelectedStore(id)}
              className={`px-4 py-1.5 font-medium transition-colors ${
                selectedStore === id
                  ? 'bg-[#1E3A8A] text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {id === 1 ? 'Tienda Principal' : 'Sucursal'}
            </button>
          ))}
        </div>
      </div>

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

      <StepCard step={1} title="Buscar cliente" state={step1Done ? 'completed' : 'active'}>
        <CustomerSearch
          customers={allCustomers}
          loading={customerLoading}
          selected={selectedCustomer}
          onSelect={setSelectedCustomer}
          onClear={() => setSelectedCustomer(null)}
        />
        {customerError && serviceErrorBanner(
          customerError,
          'Servicio de clientes no disponible',
          () => setCustomerRetry(n => n + 1),
        )}
      </StepCard>

      <StepCard step={2} title="Número de ejemplar" state={step2State()}>
        {inventoryStepContent()}
      </StepCard>

      <StepCard step={3} title="Confirmar préstamo" state={canSubmit ? 'active' : 'idle'}>
        {selectedCustomer && selectedInventory ? (
          <div className="space-y-3">
            <div className="rounded-lg bg-slate-50 border border-slate-200 divide-y divide-slate-100 text-sm">
              {[
                ['Cliente',  selectedCustomer.name],
                ['Película', selectedInventory.film_title],
                ['Ejemplar', `ID-${selectedInventory.inventory_id}`],
                ['Tarifa',   `${formatSoles(selectedInventory.rental_rate)}/día`],
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
