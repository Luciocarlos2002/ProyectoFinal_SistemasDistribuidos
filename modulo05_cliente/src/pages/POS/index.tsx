import { useState } from 'react'
import { ShoppingBag, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import NuevaRentaTab from './NuevaRentaTab'
import DevolucionTab from './DevolucionTab'

const tabs = [
  { id: 'nueva',     label: 'Nueva Renta',  icon: ShoppingBag },
  { id: 'devolucion', label: 'Devolución',  icon: RotateCcw   },
] as const

type TabId = typeof tabs[number]['id']

export default function POSPage() {
  const [activeTab, setActiveTab] = useState<TabId>('nueva')

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-1 rounded-xl bg-slate-200 p-1 w-fit mb-6">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              'flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-medium transition-all duration-200',
              activeTab === id
                ? 'bg-white text-[#1E3A8A] shadow-sm'
                : 'text-slate-500 hover:text-slate-700',
            )}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      <div className="animate-fade-in">
        {activeTab === 'nueva'      && <NuevaRentaTab />}
        {activeTab === 'devolucion' && <DevolucionTab />}
      </div>
    </div>
  )
}
