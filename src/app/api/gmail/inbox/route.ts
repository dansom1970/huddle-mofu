import { createClient } from '@/lib/supabase/server'
import { fetchInboxThreads } from '@/lib/gmail'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: tokenRow } = await supabase
    .from('gmail_tokens')
    .select('access_token, refresh_token, token_expiry')
    .eq('user_id', user.id)
    .single()

  if (!tokenRow) return NextResponse.json({ threads: [], noGmail: true })

  const { data: contacts } = await supabase
    .from('contacts')
    .select('id, full_name, company, email')
    .eq('is_active', true)
    .not('email', 'is', null)

  if (!contacts?.length) return NextResponse.json({ threads: [] })

  const threads = await fetchInboxThreads(
    tokenRow,
    contacts.filter((c) => c.email) as { id: string; full_name: string; company: string | null; email: string }[]
  )

  return NextResponse.json({ threads })
}
