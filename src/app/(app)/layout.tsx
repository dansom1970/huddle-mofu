import Sidebar from '@/components/layout/Sidebar'
import { createClient } from '@/lib/supabase/server'

async function getLayoutData() {
  try {
    const supabase = await createClient()

    const [
      { data: { user } },
      countResult,
    ] = await Promise.all([
      supabase.auth.getUser(),
      (async () => {
        const today = new Date()
        const in14 = new Date(today)
        in14.setDate(today.getDate() + 14)
        return supabase
          .from('contacts')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true)
          .lte('next_due_date', in14.toISOString().split('T')[0])
      })(),
    ])

    let ownerName: string | null = null
    if (user) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('owner_name')
        .eq('id', user.id)
        .single()
      ownerName = profile?.owner_name ?? null
    }

    return {
      queueCount: countResult.count || 0,
      userEmail: user?.email,
      ownerName,
    }
  } catch {
    return { queueCount: 0, userEmail: undefined, ownerName: null }
  }
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { queueCount, userEmail, ownerName } = await getLayoutData()

  return (
    <div className="flex min-h-screen bg-[#F2F5F3]">
      <Sidebar queueCount={queueCount} userEmail={userEmail} ownerName={ownerName} />
      <main className="flex-1 flex flex-col overflow-auto">{children}</main>
    </div>
  )
}
