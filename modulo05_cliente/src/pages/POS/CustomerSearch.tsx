import { useState, useEffect, useRef } from 'react'
import { AlertTriangle, Loader2, User } from 'lucide-react'
import type { Customer } from '@/lib/api/types'

interface Props {
  customers: Customer[]
  loading: boolean
  selected: Customer | null
  onSelect: (c: Customer) => void
  onClear: () => void
}

export default function CustomerSearch({ customers, loading, selected, onSelect, onClear }: Readonly<Props>) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

  const filtered = query.trim()
    ? customers.filter(c => c.name.toLowerCase().startsWith(query.toLowerCase()))
    : customers

  function handleSelect(c: Customer) {
    onSelect(c)
    setQuery('')
    setOpen(false)
  }

  function handleClear() {
    onClear()
    setOpen(true)
  }

  if (selected) {
    return (
      <div className="animate-fade-in">
        <div className={`rounded-lg border p-3 ${selected.has_debt ? 'border-amber-300 bg-amber-50' : 'border-emerald-200 bg-emerald-50'}`}>
          <div className="flex items-center gap-2 justify-between">
            <div className="flex items-center gap-2">
              <User size={16} className={selected.has_debt ? 'text-amber-600' : 'text-emerald-600'} />
              <p className="font-semibold text-sm text-slate-800">{selected.name}</p>
            </div>
            <button onClick={handleClear} className="text-slate-400 hover:text-slate-600 text-sm">
              Cambiar
            </button>
          </div>
          {selected.has_debt && (
            <div className="mt-2 flex items-center gap-2 text-amber-700 text-xs font-medium">
              <AlertTriangle size={13} />
              Este cliente tiene deuda pendiente. No puede realizar un nuevo alquiler.
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <input
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          placeholder={loading ? 'Cargando clientes...' : 'Buscar por nombre...'}
          disabled={loading}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-60"
        />
        {loading && (
          <Loader2 size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 animate-spin text-slate-400" />
        )}
      </div>

      {open && !loading && (
        <div className="absolute left-0 right-0 top-full mt-1 z-20 rounded-lg border border-slate-200 bg-white shadow-lg overflow-hidden max-h-56 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">Sin resultados</p>
          ) : (
            filtered.map((c, idx) => (
              <button
                key={c.customer_id}
                onClick={() => handleSelect(c)}
                className={`w-full text-left flex items-center justify-between px-4 py-2.5 hover:bg-blue-50 transition-colors text-sm ${idx === 0 ? '' : 'border-t border-slate-100'}`}
              >
                <span className="font-medium text-slate-800">{c.name}</span>
                {c.has_debt && (
                  <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-2 py-0.5 shrink-0">
                    <AlertTriangle size={11} /> Deuda
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
