import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(req.url)
  const contactId = searchParams.get('contact_id')

  let query = supabase
    .from('interactions')
    .select('*')
    .order('date', { ascending: false })

  if (contactId) query = query.eq('contact_id', contactId)

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const body = await req.json()

  const { data, error } = await supabase
    .from('interactions')
    .insert(body)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Update last_contacted on the contact if type is outbound
  if (body.contact_id && body.date) {
    await supabase
      .from('contacts')
      .update({ last_contacted: body.date })
      .eq('id', body.contact_id)
  }

  return NextResponse.json(data, { status: 201 })
}
