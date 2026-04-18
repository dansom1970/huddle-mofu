import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(req.url)
  const owner = searchParams.get('owner')
  const type = searchParams.get('type')
  const active = searchParams.get('active')

  let query = supabase
    .from('contacts')
    .select('*')
    .order('next_due_date', { ascending: true })

  if (owner) query = query.eq('contact_owner', owner)
  if (type) query = query.eq('contact_type', type)
  if (active !== null) query = query.eq('is_active', active === 'true')

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const body = await req.json()

  const { data, error } = await supabase
    .from('contacts')
    .insert(body)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
