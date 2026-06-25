import type {
  Staff, Customer, InventoryItem, Rental, PenaltyPreview,
  CreateRentalPayload, ReturnRentalPayload, RentalsFilter,
} from './types'
import { currentStaff, customers, inventory, rentals } from './mockData'

const delay = (ms = 700) => new Promise<void>(r => setTimeout(r, ms))

// ── Auth ──────────────────────────────────────────────────────────────────────
// GET /api/v1/auth/me
export async function getMe(): Promise<Staff> {
  await delay()
  return currentStaff
}

// ── Customers ─────────────────────────────────────────────────────────────────
// GET /api/v1/customers?name=&store_id=&active=
export async function searchCustomers(name: string): Promise<Customer[]> {
  await delay()
  const q = name.toLowerCase().trim()
  return customers.filter(c => c.name.toLowerCase().includes(q) && c.active)
}

// GET /api/v1/customers/{customer_id}
export async function getCustomerById(customer_id: number): Promise<Customer | null> {
  await delay()
  return customers.find(c => c.customer_id === customer_id) ?? null
}

// ── Inventory ─────────────────────────────────────────────────────────────────
// GET /api/v1/inventory/{inventory_id}
export async function getInventoryItem(inventory_id: number): Promise<InventoryItem | null> {
  await delay()
  return inventory.find(i => i.inventory_id === inventory_id) ?? null
}

// GET /api/v1/inventory/{inventory_id}/availability
export async function getInventoryAvailability(inventory_id: number): Promise<{ available: boolean } | null> {
  await delay()
  const item = inventory.find(i => i.inventory_id === inventory_id)
  if (!item) return null
  return { available: item.available }
}

// ── Rentals ───────────────────────────────────────────────────────────────────
// POST /api/v1/rentals
export async function createRental(payload: CreateRentalPayload): Promise<Rental> {
  await delay(800)
  const item = inventory.find(i => i.inventory_id === payload.inventory_id)
  const customer = customers.find(c => c.customer_id === payload.customer_id)
  if (!item || !customer) throw new Error('Inventario o cliente no encontrado')
  const newRental: Rental = {
    rental_id: 16122 + rentals.length + 1,
    customer_id: customer.customer_id,
    customer_name: customer.name,
    film_title: item.film_title,
    inventory_id: item.inventory_id,
    rental_date: new Date().toISOString(),
    return_date: null,
    status: 'ACTIVE',
    rental_rate: item.rental_rate,
  }
  rentals.unshift(newRental)
  item.available = false
  return newRental
}

// GET /api/v1/rentals/active/by-inventory/{inventory_id}
export async function getActiveRentalByInventory(inventory_id: number): Promise<Rental | null> {
  await delay()
  return rentals.find(r => r.inventory_id === inventory_id && r.status === 'ACTIVE') ?? null
}

// GET /api/v1/rentals/{rental_id}/penalty-preview
export async function getPenaltyPreview(rental_id: number): Promise<PenaltyPreview | null> {
  await delay()
  const rental = rentals.find(r => r.rental_id === rental_id)
  if (!rental || rental.status !== 'ACTIVE') return null
  // rental 16119 is overdue by 2 days
  if (rental_id === 16119) {
    return { rental_id, days_elapsed: 5, days_late: 2, penalty_per_day: 1.0, penalty_amount: 2.0 }
  }
  const rentalMs = Date.now() - new Date(rental.rental_date).getTime()
  const daysElapsed = Math.floor(rentalMs / 86_400_000)
  const daysLate = Math.max(0, daysElapsed - 3)
  const penaltyPerDay = rental.rental_rate
  return { rental_id, days_elapsed: daysElapsed, days_late: daysLate, penalty_per_day: penaltyPerDay, penalty_amount: daysLate * penaltyPerDay }
}

// PUT /api/v1/rentals/{rental_id}/return
export async function returnRental(rental_id: number, _payload: ReturnRentalPayload): Promise<Rental> {
  await delay(800)
  const rental = rentals.find(r => r.rental_id === rental_id)
  if (!rental) throw new Error('Renta no encontrada')
  rental.status = 'RETURNED'
  rental.return_date = new Date().toISOString()
  const item = inventory.find(i => i.inventory_id === rental.inventory_id)
  if (item) item.available = true
  // TODO: integrate POST /api/v1/payments (Finanzas module) here for penalty charging
  return { ...rental }
}

// GET /api/v1/rentals — with filters
export async function getRentals(filters: RentalsFilter = {}): Promise<Rental[]> {
  await delay()
  let result = [...rentals]
  if (filters.day) {
    const today = new Date().toDateString()
    result = result.filter(r => new Date(r.rental_date).toDateString() === today)
  } else if (filters.week) {
    const weekAgo = Date.now() - 7 * 86_400_000
    result = result.filter(r => new Date(r.rental_date).getTime() >= weekAgo)
  }
  if (filters.customer_id) {
    result = result.filter(r => r.customer_id === filters.customer_id)
  }
  if (filters.rental_id) {
    result = result.filter(r => r.rental_id === filters.rental_id)
  }
  return result
}

// GET /api/v1/rentals/{rental_id}
export async function getRentalById(rental_id: number): Promise<Rental | null> {
  await delay()
  return rentals.find(r => r.rental_id === rental_id) ?? null
}

// PUT /api/v1/rentals/{rental_id}/cancel
export async function cancelRental(rental_id: number): Promise<Rental> {
  await delay(800)
  const rental = rentals.find(r => r.rental_id === rental_id)
  if (!rental) throw new Error('Renta no encontrada')
  rental.status = 'CANCELLED'
  const item = inventory.find(i => i.inventory_id === rental.inventory_id)
  if (item) item.available = true
  return { ...rental }
}
