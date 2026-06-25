# Rental POS — GUI 05 (Alquileres y Devoluciones) · Build Spec

Build a complete frontend for the **Rental POS module** of a distributed movie-rental
system (Sakila-style, 2 physical stores). This is a university group project — Group 5,
covering only the **Alquileres y Devoluciones** module. All data is **mocked** (no real
backend yet); the mock layer must be cleanly swappable for real API calls later.

---

## 1. Tech Stack

- **Vite + React + TypeScript**
- **Tailwind CSS** + **shadcn/ui** components
- **React Router** for the 3 routes
- **lucide-react** for icons
- **Sonner** (or shadcn toast) for notifications
- Fonts: **Inter** (base) + **JetBrains Mono** (numeric/code data), imported from Google Fonts

Organize the mock data and API functions in a dedicated `src/lib/api/` folder so each
function maps 1:1 to a real endpoint. Each mock function should `await` a small artificial
delay (~600–800ms) so loading states (skeletons/spinners) are visible and realistic.

---

## 2. Endpoints (mock these exactly — names matter for backend integration)

These are the real backend endpoints our group owns. Mock each as a TypeScript function.

### Owned by Group 5 (build full UI for these)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/api/v1/rentals` | Create a new rental. Validates customer, copy, store and availability. |
| `GET`  | `/api/v1/rentals/active/by-inventory/{inventory_id}` | Find the ACTIVE rental for a physical copy — needed to start a return. |
| `GET`  | `/api/v1/rentals/{rental_id}/penalty-preview` | Calculate the late penalty before confirming a return. |
| `PUT`  | `/api/v1/rentals/{rental_id}/return` | Register a return. Sets return_date, releases the copy, may charge penalty. |
| `GET`  | `/api/v1/rentals` | List rentals with filters: `?day=`, `?week=`, `?customer_id=`, `?rental_id=`. |
| `GET`  | `/api/v1/rentals/{rental_id}` | Get the detail of one operation. |
| `PUT`  | `/api/v1/rentals/{rental_id}/cancel` | Cancel an operation. Releases inventory + refunds money if applicable. |

### Consumed from other modules (mock these too, read-only)

| From module | Endpoint | Purpose |
|-------------|----------|---------|
| Auth | `GET /api/v1/auth/me` | Logged-in staff: staff_id, role, store. |
| Clientes | `GET /api/v1/customers?name=&store_id=&active=` | Search customers for the rental. |
| Clientes | `GET /api/v1/customers/{customer_id}` | Validate a customer exists & is active. |
| Inventario | `GET /api/v1/inventory/{inventory_id}` | Copy data: film, store, rental_rate, base status. |
| Inventario | `GET /api/v1/inventory/{inventory_id}/availability` | Is the copy available before renting. |

> Note: penalty charging is handled **inside** the `return` flow for now. A separate
> `POST /api/v1/payments` (Finanzas module) will absorb this later — leave a TODO comment
> where that integration would go, but don't build a UI for it.

---

## 3. Mock Data

```ts
// Logged-in staff (header + sidebar)
const currentStaff = { staff_id: 1, name: "Diego H.", role: "Staff", store_id: 1, store_name: "Tienda 1" };

// Customers (for search)
const customers = [
  { customer_id: 1, name: "MARY SMITH",      email: "mary.smith@sakila.com",      store_id: 1, active: true,  has_debt: false },
  { customer_id: 2, name: "PATRICIA JOHNSON", email: "patricia.j@sakila.com",      store_id: 1, active: true,  has_debt: true  },
  { customer_id: 3, name: "LINDA WILLIAMS",  email: "linda.w@sakila.com",         store_id: 2, active: true,  has_debt: false },
  { customer_id: 4, name: "BARBARA JONES",   email: "barbara.j@sakila.com",       store_id: 1, active: false, has_debt: false },
];

// Inventory (copies)
const inventory = [
  { inventory_id: 2, film_id: 1, film_title: "ACADEMY DINOSAUR", store_id: 1, store_name: "Tienda 1", rental_rate: 0.99, available: true  },
  { inventory_id: 5, film_id: 2, film_title: "ACE GOLDFINGER",   store_id: 1, store_name: "Tienda 1", rental_rate: 4.99, available: false },
  { inventory_id: 8, film_id: 3, film_title: "ADAPTATION HOLES", store_id: 1, store_name: "Tienda 1", rental_rate: 2.99, available: false }, // currently rented
  { inventory_id: 11, film_id: 4, film_title: "AFFAIR PREJUDICE", store_id: 2, store_name: "Tienda 2", rental_rate: 0.99, available: true  },
];

// Rentals (for Consulta + return + cancel)
const rentals = [
  { rental_id: 16122, customer_id: 1, customer_name: "MARY SMITH",      film_title: "ACADEMY DINOSAUR", inventory_id: 2,  rental_date: "2026-06-24T10:00:00", return_date: null,                 status: "ACTIVE",    rental_rate: 0.99 },
  { rental_id: 16120, customer_id: 2, customer_name: "PATRICIA JOHNSON", film_title: "ACE GOLDFINGER",   inventory_id: 5,  rental_date: "2026-06-23T09:30:00", return_date: "2026-06-24T11:00:00", status: "RETURNED",  rental_rate: 4.99 },
  { rental_id: 16119, customer_id: 3, customer_name: "LINDA WILLIAMS",  film_title: "ADAPTATION HOLES", inventory_id: 8,  rental_date: "2026-06-20T14:00:00", return_date: null,                 status: "ACTIVE",    rental_rate: 2.99 },
  { rental_id: 16118, customer_id: 1, customer_name: "MARY SMITH",      film_title: "AFFAIR PREJUDICE", inventory_id: 11, rental_date: "2026-06-17T10:00:00", return_date: "2026-06-19T09:00:00", status: "CANCELLED", rental_rate: 0.99 },
];

// Penalty preview for rental 16119 (overdue): days_elapsed 5, days_late 2, penalty_per_day 1.00, penalty_amount 2.00
```

---

## 4. Design System (instructor specifications — follow exactly)

### Colors (support light/dark mode; primary palette below is for light)
- **Primary:** Navy `#1E3A8A` / Indigo `#3B82F6` → nav bars, primary action buttons
- **Secondary:** Teal `#0D9488` → search filters, category tabs/badges
- **Accent:** Amber `#F59E0B` → alerts & overdue/late warnings
- **Background:** `#F8FAFC` (light) / `#0F172A` (dark)
- **Success:** Green `#10B981` · **Error:** Red `#EF4444` → transactional payment states
- **Input border:** `#CBD5E1`, focus ring blue

### Typography
- **Base font:** Inter (sans-serif)
- **Titles:** font-bold (600/700), scale 1.5rem → 2.25rem
- **Body:** font-normal (400), 0.875rem (14px) or 1rem (16px)
- **Monospace (JetBrains Mono):** inventory codes (`inventory_id`), payment amounts, dates, rental IDs

### Layout & structure
- Fixed **Sidebar** for module navigation (persistent)
- **POS:** adaptive grid for fast scanning on tablet/PC; CSS Grid/Flexbox, min 3 columns where applicable
- **Mobile-first** for Staff/POS
- Tables collapse to cards on mobile

### Components
- **Cards:** rounded-xl (12px), light/subtle shadow
- **Inputs:** border `#CBD5E1`, focus = blue ring
- **Buttons:** clear states (hover / focus / disabled). **Disable the "Alquilar" action if the customer has debt** (`has_debt: true`)

### Data tables
- **Zebra rows** (subtle alternating color) + **hover** effect
- **Clickable rows** → open rental detail
- Density: high for admin, medium for POS

### Loading states
- **Skeletons** with pulse fade on every API consumption (search results, availability card, rentals table, cancel dialog detail) — essential to mask distributed-API latency
- **Spinners** (circular) inside submit buttons when processing a payment / registering a return

### Transitions
- Smooth on route changes & modals (`duration-200`)

### Iconography
- **lucide-react**, outline style, 20–24px
- Film → catalog · Users → customers · CreditCard → payments · ShoppingBag → POS

---

## 5. Screens

### Sidebar (all screens)
- Navy background `#1E3A8A`
- Brand: "Rental POS · Movie Store"
- Nav: **Nueva Renta / Devolución** (ShoppingBag), **Consulta de Préstamos** (ClipboardList)
- Active item highlighted; bottom block shows logged-in staff (Diego H. · Tienda 1 · ID #1)
- Header of each page shows page title (left) and staff · store (right)

---

### Screen 1 — POS: Nueva Renta y Devolución  (`/`)
Two tabs at top: **Nueva Renta** | **Devolución**

**Tab: Nueva Renta** — 3 numbered step cards (left border highlights the active/completed step):
1. **Buscar cliente** — text input + Buscar button → results list (skeleton while loading).
   Selecting a customer shows a card with name + email. **If `has_debt`, show an amber warning
   and keep "Confirmar Préstamo" disabled.**
2. **Número de ejemplar** — number input (`inventory_id`) + "Verificar disponibilidad".
   Shows film card: title, store, rental_rate (mono), status badge (green DISPONIBLE / red NO DISPONIBLE).
   - `2` → ACADEMY DINOSAUR, Tienda 1, S/0.99, DISPONIBLE
   - `5` → ACE GOLDFINGER, Tienda 1, S/4.99, NO DISPONIBLE
3. **Confirmar préstamo** — summary (customer, film, inventory_id, rate) + "Confirmar Préstamo"
   (disabled until steps 1 & 2 valid). On confirm: spinner → success toast + result card
   (rental_id 16122, status ACTIVE).

**Tab: Devolución** — 3 steps:
1. **Número de ejemplar** + "Buscar préstamo activo" → calls `active/by-inventory/{id}`.
   - `8` → rental 16119, LINDA WILLIAMS, ADAPTATION HOLES, rented 2026-06-20.
2. **Penalidad** (auto via penalty-preview): card with días transcurridos, días de atraso,
   penalidad/día, penalidad total. Amber left border + amber badge if penalty > 0; green card if none.
3. **Confirmar devolución** — spinner on submit → success: returned, penalty charged S/2.00, copy released.

---

### Screen 2 — Consulta de Préstamos  (`/consulta`)
Filter tabs: **Hoy** | **Esta semana** | **Por cliente** | **Por N° operación**
- "Por cliente" → text input filtering by customer name
- "Por N° operación" → number input filtering by rental_id
- Table columns: **N° Operación · Cliente · Película · Ejemplar · Fecha Alquiler · Fecha Devolución · Estado**
- Mono font on N° Operación, Ejemplar, and dates. Zebra + hover + clickable rows.
- Status badges: ACTIVE (green) · RETURNED (blue) · CANCELLED (red/gray)
- Table shows skeleton rows on load.
- Clicking a row → detail drawer/dialog with all fields + buttons:
  - **Anular Operación** (red, only if ACTIVE) → opens Screen 3 flow
  - **Cerrar**

---

### Screen 3 — Anulación de Operación  (modal/dialog from Screen 2)
- Title: "Anular Operación #{rental_id}"
- Amber warning banner: releasing the copy + refunding the charge if applicable
- Rental summary card (customer, film, inventory_id, rental_date, rate)
- Refund highlighted (e.g. "Devolución: S/2.99")
- Buttons: **Cancelar** (secondary) + **Confirmar Anulación** (destructive red, spinner on submit)
- On confirm → success state ("Operación anulada exitosamente"), refund shown, status CANCELLED

---

## 6. General requirements
- All UI text in **Spanish**. Currency: `S/` (soles). Dates: `DD/MM/YYYY HH:mm`.
- Clean, professional, store-counter feel. POS must feel fast (minimal clicks).
- Keep components small and reusable (StatusBadge, StepCard, RentalTable, etc.).
- Add a short `README.md` explaining how to run it and where the mock layer lives.