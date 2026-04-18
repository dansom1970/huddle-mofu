import type { KitCadence } from '@/lib/types'

const labels: Record<KitCadence, string> = {
  '6-weeks': '6 weeks',
  '2-months': '2 months',
  '3-months': '3 months',
  '6-months': '6 months',
}

export default function CadenceBadge({ cadence }: { cadence: KitCadence | null }) {
  if (!cadence) return <span className="text-gray-400 text-xs">—</span>
  return (
    <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
      every {labels[cadence]}
    </span>
  )
}
