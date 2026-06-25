import { cn } from '@/lib/utils'

type StepState = 'idle' | 'active' | 'completed'

interface Props {
  step: number
  title: string
  state: StepState
  children: React.ReactNode
}

export default function StepCard({ step, title, state, children }: Props) {
  return (
    <div
      className={cn(
        'rounded-xl border bg-white shadow-sm transition-all duration-200',
        'border-l-4',
        state === 'active'    && 'border-l-blue-500 shadow-md',
        state === 'completed' && 'border-l-emerald-500',
        state === 'idle'      && 'border-l-slate-200 opacity-60',
      )}
    >
      <div className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <span
            className={cn(
              'flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold shrink-0',
              state === 'active'    && 'bg-blue-600 text-white',
              state === 'completed' && 'bg-emerald-500 text-white',
              state === 'idle'      && 'bg-slate-200 text-slate-500',
            )}
          >
            {state === 'completed' ? '✓' : step}
          </span>
          <h3 className="font-semibold text-slate-800">{title}</h3>
        </div>
        {children}
      </div>
    </div>
  )
}
