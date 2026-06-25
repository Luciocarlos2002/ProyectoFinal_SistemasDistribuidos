import { useState, useEffect, useRef } from 'react'
import { Film, Loader2 } from 'lucide-react'
import type { InventoryItem } from '@/lib/api/types'

interface Props {
  items: InventoryItem[]
  loading: boolean
  selected: InventoryItem | null
  onSelect: (item: InventoryItem) => void
  onClear: () => void
}

export default function InventorySearch({ items, loading, selected, onSelect, onClear }: Props) {
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
    ? items.filter(i => i.film_title.toLowerCase().includes(query.toLowerCase()))
    : items

  function handleSelect(item: InventoryItem) {
    onSelect(item)
    setQuery('')
    setOpen(false)
  }

  function handleClear() {
    onClear()
    setOpen(true)
  }

  if (selected) {
    return (
      <div className="animate-fade-in rounded-lg border border-emerald-200 bg-emerald-50 p-3">
        <div className="flex items-center gap-2 justify-between">
          <div className="flex items-center gap-2">
            <Film size={16} className="text-emerald-600" />
            <div>
              <p className="font-semibold text-sm text-slate-800">{selected.film_title}</p>
              <p className="text-xs text-slate-500 mt-0.5">
                {selected.store_name} · ID-{selected.inventory_id}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">
              DISPONIBLE
            </span>
            <button onClick={handleClear} className="text-slate-400 hover:text-slate-600 text-sm">
              Cambiar
            </button>
          </div>
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
          placeholder={loading ? 'Cargando ejemplares...' : 'Buscar por título...'}
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
            filtered.map((item, idx) => (
              <button
                key={item.inventory_id}
                onClick={() => handleSelect(item)}
                className={`w-full text-left flex items-center justify-between px-4 py-2.5 hover:bg-blue-50 transition-colors text-sm ${idx === 0 ? '' : 'border-t border-slate-100'}`}
              >
                <span className="font-medium text-slate-800">{item.film_title}</span>
                <span className="text-xs text-slate-400 shrink-0 ml-2">ID-{item.inventory_id}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
