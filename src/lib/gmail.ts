export interface GmailTokenRow {
  access_token: string
  refresh_token: string | null
  token_expiry: string | null
}

export interface InboxThread {
  threadId: string
  subject: string
  snippet: string
  date: string
  fromEmail: string
  fromName: string
  contactId: string
  contactName: string
  contactCompany: string | null
  messageCount: number
}

interface ContactRef {
  id: string
  full_name: string
  company: string | null
  email: string
}

export async function getValidAccessToken(tokens: GmailTokenRow): Promise<string> {
  const isExpired =
    !tokens.token_expiry ||
    new Date(tokens.token_expiry) < new Date(Date.now() + 5 * 60 * 1000)

  if (!isExpired) return tokens.access_token
  if (!tokens.refresh_token) return tokens.access_token

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: tokens.refresh_token,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      grant_type: 'refresh_token',
    }),
  })

  const data = await res.json()
  return data.access_token ?? tokens.access_token
}

function decodeBase64(encoded: string): string {
  return Buffer.from(encoded.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8')
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractText(part: any): string {
  if (part.mimeType === 'text/plain' && part.body?.data) {
    return decodeBase64(part.body.data)
  }
  if (part.parts) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const sub of part.parts) {
      const t = extractText(sub)
      if (t) return t
    }
  }
  return ''
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseMessage(message: any): string {
  const payload = message.payload
  if (!payload) return ''
  if (payload.body?.data) return decodeBase64(payload.body.data)
  if (payload.parts) {
    for (const part of payload.parts) {
      const t = extractText(part)
      if (t) return t
    }
  }
  return ''
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function header(msg: any, name: string): string {
  return msg.payload?.headers?.find((h: any) => h.name === name)?.value ?? ''
}

function parseFromField(from: string): { email: string; name: string } {
  const match = from.match(/<(.+?)>/)
  const email = (match ? match[1] : from).toLowerCase().trim()
  const name = match ? from.replace(/<.+?>/, '').trim().replace(/^"|"$/g, '') : from
  return { email, name }
}

export async function fetchGmailThreads(
  tokens: GmailTokenRow,
  contactEmail: string
): Promise<string> {
  try {
    const accessToken = await getValidAccessToken(tokens)

    const searchRes = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/threads?q=${encodeURIComponent(contactEmail)}&maxResults=3`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )

    if (!searchRes.ok) return ''
    const { threads = [] } = await searchRes.json()
    if (threads.length === 0) return ''

    const threadSummaries: string[] = []

    for (const thread of threads.slice(0, 3)) {
      const threadRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/threads/${thread.id}?format=full`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      )
      if (!threadRes.ok) continue

      const { messages = [] } = await threadRes.json()
      const emailLines: string[] = []

      for (const msg of messages.slice(-3)) {
        const body = parseMessage(msg).slice(0, 600).trim()
        if (!body) continue
        emailLines.push(`[${header(msg, 'Date')}] ${header(msg, 'From')}\nSubject: ${header(msg, 'Subject')}\n${body}`)
      }

      if (emailLines.length) threadSummaries.push(emailLines.join('\n---\n'))
    }

    return threadSummaries.join('\n\n===\n\n')
  } catch {
    return ''
  }
}

export async function fetchInboxThreads(
  tokens: GmailTokenRow,
  contacts: ContactRef[]
): Promise<InboxThread[]> {
  try {
    const accessToken = await getValidAccessToken(tokens)

    const emailToContact: Record<string, ContactRef> = {}
    for (const c of contacts) {
      emailToContact[c.email.toLowerCase()] = c
    }

    const emailList = contacts.map((c) => c.email).slice(0, 15).join(' OR ')
    const query = `from:(${emailList}) newer_than:30d`

    const searchRes = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/threads?q=${encodeURIComponent(query)}&maxResults=20`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )

    if (!searchRes.ok) return []
    const { threads = [] } = await searchRes.json()

    const results: InboxThread[] = []

    for (const thread of threads.slice(0, 15)) {
      const threadRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/threads/${thread.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      )
      if (!threadRes.ok) continue

      const threadData = await threadRes.json()
      const messages = threadData.messages ?? []
      if (!messages.length) continue

      const firstMsg = messages[0]
      const lastMsg = messages[messages.length - 1]

      const subject = header(firstMsg, 'Subject')
      const from = header(lastMsg, 'From')
      const date = header(lastMsg, 'Date')

      const { email: fromEmail, name: fromName } = parseFromField(from)
      const contact = emailToContact[fromEmail]
      if (!contact) continue

      results.push({
        threadId: thread.id,
        subject: subject || '(no subject)',
        snippet: threadData.snippet ?? '',
        date,
        fromEmail,
        fromName,
        contactId: contact.id,
        contactName: contact.full_name,
        contactCompany: contact.company,
        messageCount: messages.length,
      })
    }

    return results
  } catch {
    return []
  }
}

export async function fetchFullThread(
  tokens: GmailTokenRow,
  threadId: string
): Promise<string> {
  try {
    const accessToken = await getValidAccessToken(tokens)

    const res = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/threads/${threadId}?format=full`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )

    if (!res.ok) return ''
    const { messages = [] } = await res.json()

    const emailLines: string[] = []
    for (const msg of messages.slice(-5)) {
      const body = parseMessage(msg).slice(0, 800).trim()
      if (!body) continue
      emailLines.push(`From: ${header(msg, 'From')}\nDate: ${header(msg, 'Date')}\n\n${body}`)
    }

    return emailLines.join('\n\n---\n\n')
  } catch {
    return ''
  }
}
