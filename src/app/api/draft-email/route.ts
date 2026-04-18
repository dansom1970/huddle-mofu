import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { fetchGmailThreads } from '@/lib/gmail'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { contactId } = await req.json()
  const supabase = await createClient()

  const { data: contact } = await supabase
    .from('contacts')
    .select('*')
    .eq('id', contactId)
    .single()

  if (!contact) {
    return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
  }

  // Fetch last 3 logged interactions from Supabase
  const { data: interactions } = await supabase
    .from('interactions')
    .select('*')
    .eq('contact_id', contactId)
    .order('date', { ascending: false })
    .limit(3)

  const loggedContext = interactions?.map((i) =>
    `${i.date} — ${i.type}: ${i.summary}${i.email_content ? '\nEmail content: ' + i.email_content : ''}`
  ).join('\n\n') || 'No interactions logged.'

  // Try to fetch real Gmail threads for the logged-in user
  let gmailContext = ''
  if (contact.email) {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: tokenRow } = await supabase
        .from('gmail_tokens')
        .select('access_token, refresh_token, token_expiry')
        .eq('user_id', user.id)
        .single()

      if (tokenRow) {
        gmailContext = await fetchGmailThreads(tokenRow, contact.email)
      }
    }
  }

  const anthropic = new Anthropic()

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 500,
    system: `You are drafting a keep-in-touch email on behalf of Huddle Creative, a boutique brand strategy and design agency based in Shoreditch, London. The email must sound like it was written personally by a thoughtful senior person — warm, direct, and intelligent. Rules: never use opener clichés like "Hope this finds you well" or "I was just thinking of you". Never mention sales, pitches, proposals, or anything transactional. The goal is to re-open a genuine conversation — reference something specific from previous interactions, share something genuinely useful (a thought, a question, a piece of work), and end with a soft open question. 100–150 words maximum. Output format: subject line on the first line, then a blank line, then the email body. Nothing else.`,
    messages: [
      {
        role: 'user',
        content: `Draft a KIT email for this contact:

Name: ${contact.full_name}
Company: ${contact.company}
Role: ${contact.role}
KIT Stage: ${contact.kit_stage}
Notes: ${contact.notes || 'None'}
Tags: ${contact.tags?.join(', ') || 'None'}

Logged interactions:
${loggedContext}${gmailContext ? `\n\nReal email thread history (use this for specific references):\n${gmailContext}` : ''}`,
      },
    ],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''
  const lines = text.split('\n')
  const subject = lines[0]
  const body = lines.slice(2).join('\n')

  return NextResponse.json({ subject, body })
}
