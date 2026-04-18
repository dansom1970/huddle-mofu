import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { fetchFullThread } from '@/lib/gmail'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { threadId, contactId } = await req.json()
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: contact } = await supabase
    .from('contacts')
    .select('*')
    .eq('id', contactId)
    .single()

  if (!contact) return NextResponse.json({ error: 'Contact not found' }, { status: 404 })

  const { data: tokenRow } = await supabase
    .from('gmail_tokens')
    .select('access_token, refresh_token, token_expiry')
    .eq('user_id', user.id)
    .single()

  const threadContent = tokenRow
    ? await fetchFullThread(tokenRow, threadId)
    : ''

  const anthropic = new Anthropic()

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 500,
    system: `You are drafting an email reply on behalf of Huddle Creative, a boutique brand strategy and design agency based in Shoreditch, London. The reply must sound personal, warm, and intelligent — written by a thoughtful senior person. Never use clichés. Be direct and specific. Reference the content of the email you are replying to naturally. Keep it concise and end with something that moves the conversation forward naturally. 100–150 words maximum. Output format: subject line on the first line (starting with Re: ), then a blank line, then the reply body. Nothing else.`,
    messages: [
      {
        role: 'user',
        content: `Draft a reply to this email thread from ${contact.full_name} (${contact.role ?? ''} at ${contact.company ?? ''}).

Contact notes: ${contact.notes || 'None'}

Email thread:
${threadContent || 'Thread content unavailable — draft a warm, relevant reply based on the contact context.'}`,
      },
    ],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''
  const lines = text.split('\n')
  const subject = lines[0]
  const body = lines.slice(2).join('\n')

  return NextResponse.json({ subject, body })
}
