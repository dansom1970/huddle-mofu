import Sidebar from '@/components/layout/Sidebar'
import { createClient } from '@/lib/supabase/server'

async function getQueueCount() {
  try {
    const supabase = await createClient()
    const today = new Date()
    const in14Days = new Date(today)
    in14Days.setDate(today.getDate() + 14)

    const { count } = await supabase
      .from('contacts')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .lte('next_due_date', in14Days.toISOString().split('T')[0])

    return count || 0
  } catch {
    return 0
  }
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const queueCount = await getQueueCount()

  return (
    <div className="flex min-h-screen bg-[#F2F5F3]">
      <Sidebar queueCount={queueCount} />
      <main className="flex-1 flex flex-col overflow-auto">{children}</main>
    </div>
  )
}
