export interface Staff {
  staff_id: number
  name: string
  role: string
  store_id: number
  store_name: string
}

export interface Customer {
  customer_id: number
  name: string
  email: string
  store_id: number
  active: boolean
  has_debt: boolean
}

export interface InventoryItem {
  inventory_id: number
  film_id: number
  film_title: string
  store_id: number
  store_name: string
  rental_rate: number
  available: boolean
}

export type RentalStatus = 'ACTIVE' | 'RETURNED' | 'CANCELLED'

export interface Rental {
  rental_id: number
  customer_id: number
  customer_name: string
  film_title: string
  inventory_id: number
  rental_date: string
  return_date: string | null
  status: RentalStatus
  rental_rate: number
}

export interface PenaltyPreview {
  rental_id: number
  days_elapsed: number
  days_late: number
  penalty_per_day: number
  penalty_amount: number
}

export interface CreateRentalPayload {
  customer_id: number
  inventory_id: number
  film_id: number
  title: string
}

export interface ReturnRentalPayload {
  staff_id: number
}

export interface RentalsFilter {
  day?: boolean
  week?: boolean
  customer_id?: number
  rental_id?: number
}
