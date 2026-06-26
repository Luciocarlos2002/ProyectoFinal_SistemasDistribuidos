import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { ShoppingBag, ClipboardList, Film, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/',           label: 'Nueva Renta',          icon: ShoppingBag  },
  { to: '/devolucion', label: 'Devolución',            icon: RotateCcw    },
  { to: '/consulta',   label: 'Consulta de Préstamos', icon: ClipboardList },
]

const pageTitles: Record<string, string> = {
  '/':           'Nueva Renta',
  '/devolucion': 'Devolución',
  '/consulta':   'Consulta de Préstamos',
}

export default function AppLayout() {
  const { pathname } = useLocation()
  const pageTitle = pageTitles[pathname] ?? 'Rental POS'

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* ── Sidebar ── */}
      <aside className="flex flex-col w-64 shrink-0 bg-[#1E3A8A] text-white">
        {/* Brand */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-blue-700/50">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/30">
            <Film size={20} />
          </div>
          <div>
            <p className="font-bold text-sm leading-tight">Rental POS</p>
            <p className="text-blue-300 text-xs">Movie Store</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 space-y-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors duration-150',
                  isActive
                    ? 'bg-white/15 text-white font-semibold'
                    : 'text-blue-200 hover:bg-white/10 hover:text-white',
                )
              }
            >
              <Icon size={18} className="shrink-0" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

      </aside>

      {/* ── Main ── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Top header */}
        <header className="flex items-center px-6 py-4 bg-white border-b border-slate-200 shrink-0">
          <h1 className="text-lg font-bold text-slate-800">{pageTitle}</h1>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
