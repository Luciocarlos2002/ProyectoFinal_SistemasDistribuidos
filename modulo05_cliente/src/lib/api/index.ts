import type {
  Customer, InventoryItem, Rental, PenaltyPreview,
  CreateRentalPayload, ReturnRentalPayload, RentalsFilter,
} from './types'
const BASE = (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:8000'

const TO_STATUS: Record<string, Rental['status']> = {
  ALQUILADO: 'ACTIVE',
  RETORNADO: 'RETURNED',
  CANCELADO: 'CANCELLED',
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  if (!res.ok) {
    let message = `Error ${res.status}`
    try {
      const body = await res.json()
      message = typeof body?.detail === 'string'
        ? body.detail
        : JSON.stringify(body?.detail ?? body)
    } catch { /* ignore */ }
    throw new Error(message)
  }
  return res.json() as Promise<T>
}

function toRental(r: Record<string, unknown>): Rental {
  return {
    rental_id:     r.rental_id as number,
    customer_id:   r.customer_id as number,
    customer_name: ((r.fullName ?? r.fullname ?? '') as string),
    film_title:    (r.title as string) ?? '',
    inventory_id:  r.inventory_id as number,
    rental_date:   r.rental_date as string,
    return_date:   (r.return_date as string | null) ?? null,
    status:        TO_STATUS[r.status as string] ?? 'ACTIVE',
    rental_rate:   (r.rental_rate as number) ?? 0,
  }
}

// ── Customers ─────────────────────────────────────────────────────────────────
// GET /customers → {total, items: [{customer_id, nombre, apellido}]}
export async function searchCustomers(name: string): Promise<Customer[]> {
  const { items } = await request<{
    total: number
    items: Array<{ customer_id: number; nombre: string; apellido: string }>
  }>('/customers')
  const q = name.toLowerCase().trim()
  return items
    .map(c => ({
      customer_id: c.customer_id,
      name: `${c.nombre} ${c.apellido}`,
      email: '',
      store_id: 1,
      active: true,
      has_debt: false,
    }))
    .filter(c => !q || c.name.toLowerCase().includes(q))
}

export async function getCustomerById(customer_id: number): Promise<Customer | null> {
  const { items } = await request<{
    total: number
    items: Array<{ customer_id: number; nombre: string; apellido: string }>
  }>('/customers')
  const c = items.find(i => i.customer_id === customer_id)
  if (!c) return null
  return {
    customer_id: c.customer_id,
    name: `${c.nombre} ${c.apellido}`,
    email: '',
    store_id: 1,
    active: true,
    has_debt: false,
  }
}

// ── Inventory ─────────────────────────────────────────────────────────────────
// GET /inventorys?store_id=N → {total, items: [{inventory_id, film_id, title}]}
// Only available items appear in this list; absent = checked out or doesn't exist
const STORE_NAMES: Record<number, string> = { 1: 'Tienda Principal', 2: 'Sucursal' }

export async function getAllInventoryItems(storeId: 1 | 2 = 1): Promise<InventoryItem[]> {
  const { items } = await request<{
    total: number
    items: Array<{ inventory_id: number; film_id: number; title: string }>
  }>(`/inventorys?store_id=${storeId}`)
  return items.map(i => ({
    inventory_id: i.inventory_id,
    film_id: i.film_id,
    film_title: i.title,
    store_id: storeId,
    store_name: STORE_NAMES[storeId],
    rental_rate: 0,
    available: true,
  }))
}

export async function getInventoryItem(inventory_id: number, storeId: 1 | 2 = 1): Promise<InventoryItem | null> {
  const { items } = await request<{
    total: number
    items: Array<{ inventory_id: number; film_id: number; title: string }>
  }>(`/inventorys?store_id=${storeId}`)
  const found = items.find(i => i.inventory_id === inventory_id)
  return {
    inventory_id,
    film_id: found?.film_id ?? 0,
    film_title: found?.title ?? '—',
    store_id: storeId,
    store_name: STORE_NAMES[storeId],
    rental_rate: 0,
    available: !!found,
  }
}

export async function getInventoryAvailability(inventory_id: number): Promise<{ available: boolean } | null> {
  const item = await getInventoryItem(inventory_id)
  return item ? { available: item.available } : null
}

// ── Rentals ───────────────────────────────────────────────────────────────────
// POST /api/v1/rentals
export async function createRental(payload: CreateRentalPayload): Promise<Rental> {
  const res = await request<{ data: Record<string, unknown> }>('/api/v1/rentals', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return toRental(res.data)
}

// GET /api/v1/rentals?status=ALQUILADO&inventory_id=N
export async function getActiveRentalByInventory(inventory_id: number): Promise<Rental | null> {
  const res = await request<{ data: Array<Record<string, unknown>> }>(
    `/api/v1/rentals?status=ALQUILADO&inventory_id=${inventory_id}`
  )
  return res.data.length > 0 ? toRental(res.data[0]) : null
}

// GET /api/v1/rentals/{rental_id}/penalty-preview
export async function getPenaltyPreview(rental_id: number): Promise<PenaltyPreview | null> {
  try {
    const res = await request<{ data: PenaltyPreview }>(`/api/v1/rentals/${rental_id}/penalty-preview`)
    return res.data
  } catch {
    return null
  }
}

// PUT /api/v1/rentals/{rental_id}/return  +  POST /penalty-payment (if penalty > 0)
export async function returnRental(rental_id: number, payload: ReturnRentalPayload): Promise<Rental> {
  await request(`/api/v1/rentals/${rental_id}/return`, {
    method: 'PUT',
  })
  // register penalty charge — endpoint handles the no-penalty case gracefully
  await request(`/api/v1/rentals/${rental_id}/penalty-payment`, {
    method: 'POST',
    body: JSON.stringify(payload),
  }).catch(() => { /* safe to ignore: penalty calc after return is best-effort */ })
  const updated = await getRentalById(rental_id)
  if (!updated) throw new Error('No se pudo obtener la renta actualizada')
  return updated
}

// GET /api/v1/rentals
export async function getRentals(filters: RentalsFilter = {}): Promise<Rental[]> {
  if (filters.rental_id) {
    const r = await getRentalById(filters.rental_id)
    return r ? [r] : []
  }
  const params = new URLSearchParams()
  if (filters.day)         params.set('day', 'true')
  if (filters.week)        params.set('week', 'true')
  if (filters.customer_id) params.set('customer_id', String(filters.customer_id))
  const qs = params.toString()
  const path = qs ? `/api/v1/rentals?${qs}` : '/api/v1/rentals'
  const res = await request<{ data: Array<Record<string, unknown>> }>(path)
  return res.data.map(toRental)
}

// GET /api/v1/rentals/{rental_id}
export async function getRentalById(rental_id: number): Promise<Rental | null> {
  try {
    const res = await request<{ data: Record<string, unknown> }>(`/api/v1/rentals/${rental_id}`)
    return toRental(res.data)
  } catch {
    return null
  }
}

// PUT /api/v1/rentals/{rental_id}/cancel
export async function cancelRental(rental_id: number, staffId: number): Promise<Rental> {
  await request(`/api/v1/rentals/${rental_id}/cancel`, {
    method: 'PUT',
    body: JSON.stringify({ staff_id: staffId }),
  })
  const updated = await getRentalById(rental_id)
  if (!updated) throw new Error('No se pudo obtener la renta actualizada')
  return updated
}
