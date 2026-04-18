import { cn } from '@/lib/utils'

const stageConfig: Record<number, { label: string; className: string }> = {
  1: { label: 'Stage 1', className: 'bg-gray-100 text-gray-600' },
  2: { label: 'Stage 2', className: 'bg-amber-100 text-amber-700' },
  3: { label: 'Stage 3', className: 'bg-blue-100 text-blue-700' },
  4: { label: 'Stage 4', className: 'bg-green-100 text-green-700' },
}

export default function StageBadge({ stage }: { stage: number }) {
  const config = stageConfig[stage] || stageConfig[1]
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        config.className
      )}
    >
      {config.label}
      {stage === 4 && (
        <span className="ml-1 text-green-600">→ Pipeline</span>
      )}
    </span>
  )
}
