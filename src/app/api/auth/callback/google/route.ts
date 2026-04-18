import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(`${appUrl}/settings?error=no_code`)
  }

  // Exchange code for tokens
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: `${appUrl}/api/auth/callback/google`,
      grant_type: 'authorization_code',
    }),
  })

  const tokens = await tokenRes.json()

  if (!tokenRes.ok) {
    return NextResponse.redirect(`${appUrl}/settings?error=token_failed`)
  }

  // Get Gmail email address
  const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  })
  const userInfo = await userInfoRes.json()

  // Get logged-in Supabase user
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(`${appUrl}/login`)
  }

  const expiry = new Date(Date.now() + tokens.expires_in * 1000).toISOString()

  await supabase.from('gmail_tokens').upsert({
    user_id: user.id,
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token ?? null,
    token_expiry: expiry,
    gmail_email: userInfo.email ?? null,
    updated_at: new Date().toISOString(),
  })

  return NextResponse.redirect(`${appUrl}/settings?connected=true`)
}
