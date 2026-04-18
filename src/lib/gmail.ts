interface GmailTokenRow {
  access_token: string
  refresh_token: string | null
  token_expiry: string | null
}

async function getValidAccessToken(tokens: GmailTokenRow): Promise<string> {
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
        const headers = msg.payload?.headers ?? []
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const h = (name: string) => headers.find((x: any) => x.name === name)?.value ?? ''
        const body = parseMessage(msg).slice(0, 600).trim()
        if (!body) continue
        emailLines.push(`[${h('Date')}] ${h('From')}\nSubject: ${h('Subject')}\n${body}`)
      }

      if (emailLines.length) threadSummaries.push(emailLines.join('\n---\n'))
    }

    return threadSummaries.join('\n\n===\n\n')
  } catch {
    return ''
  }
}
