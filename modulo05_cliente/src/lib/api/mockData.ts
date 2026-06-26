import type { Staff, Customer, InventoryItem, Rental } from './types'

export const currentStaff: Staff = {
  staff_id: 1,
  name: 'Diego H.',
  role: 'Staff',
  store_id: 1,
  store_name: 'Tienda Principal',
}

export const customers: Customer[] = [
  { customer_id: 1, name: 'MARY SMITH',       email: 'mary.smith@sakila.com',   store_id: 1, active: true,  has_debt: false },
  { customer_id: 2, name: 'PATRICIA JOHNSON',  email: 'patricia.j@sakila.com',   store_id: 1, active: true,  has_debt: true  },
  { customer_id: 3, name: 'LINDA WILLIAMS',   email: 'linda.w@sakila.com',      store_id: 2, active: true,  has_debt: false },
  { customer_id: 4, name: 'BARBARA JONES',    email: 'barbara.j@sakila.com',    store_id: 1, active: false, has_debt: false },
]

export const inventory: InventoryItem[] = [
  { inventory_id: 2,  film_id: 1, film_title: 'ACADEMY DINOSAUR',  store_id: 1, store_name: 'Tienda 1', rental_rate: 0.99, available: true  },
  { inventory_id: 5,  film_id: 2, film_title: 'ACE GOLDFINGER',    store_id: 1, store_name: 'Tienda 1', rental_rate: 4.99, available: false },
  { inventory_id: 8,  film_id: 3, film_title: 'ADAPTATION HOLES',  store_id: 1, store_name: 'Tienda 1', rental_rate: 2.99, available: false },
  { inventory_id: 11, film_id: 4, film_title: 'AFFAIR PREJUDICE',  store_id: 2, store_name: 'Tienda 2', rental_rate: 0.99, available: true  },
]

export const rentals: Rental[] = [
  { rental_id: 16122, customer_id: 1, customer_name: 'MARY SMITH',      film_title: 'ACADEMY DINOSAUR', inventory_id: 2,  rental_date: '2026-06-24T10:00:00', return_date: null,                  status: 'ACTIVE',    rental_rate: 0.99 },
  { rental_id: 16120, customer_id: 2, customer_name: 'PATRICIA JOHNSON', film_title: 'ACE GOLDFINGER',   inventory_id: 5,  rental_date: '2026-06-23T09:30:00', return_date: '2026-06-24T11:00:00', status: 'RETURNED',  rental_rate: 4.99 },
  { rental_id: 16119, customer_id: 3, customer_name: 'LINDA WILLIAMS',  film_title: 'ADAPTATION HOLES', inventory_id: 8,  rental_date: '2026-06-20T14:00:00', return_date: null,                  status: 'ACTIVE',    rental_rate: 2.99 },
  { rental_id: 16118, customer_id: 1, customer_name: 'MARY SMITH',      film_title: 'AFFAIR PREJUDICE', inventory_id: 11, rental_date: '2026-06-17T10:00:00', return_date: '2026-06-19T09:00:00', status: 'CANCELLED', rental_rate: 0.99 },
]
