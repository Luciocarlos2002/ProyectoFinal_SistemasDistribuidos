import { cn } from '@/lib/utils'
import type { RentalStatus } from '@/lib/api/types'

const config: Record<RentalStatus, { label: string; className: string }> = {
  ACTIVE:    { label: 'ACTIVO',    className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  RETURNED:  { label: 'DEVUELTO',  className: 'bg-blue-100   text-blue-700   border-blue-200'   },
  CANCELLED: { label: 'ANULADO',   className: 'bg-rose-100   text-rose-700   border-rose-200'   },
}

interface Props {
  status: RentalStatus
  className?: string
}

export default function StatusBadge({ status, className }: Props) {
  const { label, className: base } = config[status] ?? { label: status, className: 'bg-slate-100 text-slate-600 border-slate-200' }
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border font-mono-data tracking-wide', base, className)}>
      {label}
    </span>
  )
}
