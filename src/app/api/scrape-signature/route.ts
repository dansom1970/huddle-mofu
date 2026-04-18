import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { fetchFullThread } from '@/lib/gmail'
import { NextRequest, NextResponse } from 'next/server'

export interface ScrapedSignature {
  full_name: string | null
  role: string | null
  company: string | null
  email: string | null
  phone: string | null
  linkedin_url: string | null
}

export async function POST(req: NextRequest) {
  const { threadId, contactId } = await req.json()
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [{ data: contact }, { data: tokenRow }] = await Promise.all([
    supabase.from('contacts').select('*').eq('id', contactId).single(),
    supabase.from('gmail_tokens').select('access_token, refresh_token, token_expiry').eq('user_id', user.id).single(),
  ])

  if (!contact) return NextResponse.json({ error: 'Contact not found' }, { status: 404 })

  const threadContent = tokenRow ? await fetchFullThread(tokenRow, threadId) : ''

  if (!threadContent) {
    return NextResponse.json({ error: 'Could not read thread' }, { status: 400 })
  }

  const anthropic = new Anthropic()

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 300,
    system: `You extract contact information from email signatures. Return ONLY a valid JSON object with these exact keys: full_name, role, company, email, phone, linkedin_url. Use null for any field not found in the signature. Do not include any explanation or markdown — just the raw JSON object.`,
    messages: [
      {
        role: 'user',
        content: `Extract the contact signature details from this email thread:\n\n${threadContent}`,
      },
    ],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text.trim() : '{}'

  let scraped: ScrapedSignature = {
    full_name: null,
    role: null,
    company: null,
    email: null,
    phone: null,
    linkedin_url: null,
  }

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) scraped = JSON.parse(jsonMatch[0])
  } catch {
    return NextResponse.json({ error: 'Failed to parse signature' }, { status: 500 })
  }

  // Compute which fields are new or changed vs current contact
  const fields: (keyof ScrapedSignature)[] = ['full_name', 'role', 'company', 'email', 'phone', 'linkedin_url']
  const changes: Record<string, { current: string | null; scraped: string | null }> = {}

  for (const field of fields) {
    const scrapedVal = scraped[field]
    const currentVal = (contact as Record<string, string | null>)[field] ?? null
    if (scrapedVal && scrapedVal !== currentVal) {
      changes[field] = { current: currentVal, scraped: scrapedVal }
    }
  }

  return NextResponse.json({ scraped, contact, changes })
}
