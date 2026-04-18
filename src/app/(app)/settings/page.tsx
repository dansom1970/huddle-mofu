'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Check, Mail } from 'lucide-react'
import TopBar from '@/components/layout/TopBar'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'

function SettingsContent() {
  const searchParams = useSearchParams()
  const justConnected = searchParams.get('connected') === 'true'

  const [ownerName, setOwnerName] = useState('')
  const [gmailEmail, setGmailEmail] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [userEmail, setUserEmail] = useState('')

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      setUserEmail(user.email || '')

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('owner_name')
        .eq('id', user.id)
        .single()
      if (profile?.owner_name) setOwnerName(profile.owner_name)

      const { data: tokens } = await supabase
        .from('gmail_tokens')
        .select('gmail_email')
        .eq('user_id', user.id)
        .single()
      if (tokens?.gmail_email) setGmailEmail(tokens.gmail_email)
    }
    load()
  }, [])

  const handleSaveProfile = async () => {
    if (!ownerName) return
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('user_profiles').upsert({
      id: user.id,
      owner_name: ownerName,
    })

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="p-8 space-y-6 max-w-lg">
      {/* Profile */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-semibold text-gray-700">Your profile</h3>
        <div>
          <Label className="mb-1.5 block text-gray-500 text-xs">Signed in as</Label>
          <p className="text-sm text-gray-700">{userEmail}</p>
        </div>
        <div>
          <Label className="mb-1.5 block">I am</Label>
          <div className="flex gap-2">
            <Select value={ownerName} onValueChange={setOwnerName}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select your name" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Nicole">Nicole</SelectItem>
                <SelectItem value="Danny">Danny</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleSaveProfile} disabled={saving || !ownerName} size="sm" className="gap-1.5">
              {saved ? <Check className="h-3.5 w-3.5" /> : null}
              {saved ? 'Saved' : 'Save'}
            </Button>
          </div>
          <p className="text-xs text-gray-400 mt-1.5">This links your account to contacts owned by you.</p>
        </div>
      </div>

      {/* Gmail */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-semibold text-gray-700">Gmail connection</h3>
        <p className="text-sm text-gray-500">
          Connect your Gmail so Huddle KIT can read your email history with each contact and use it to write more relevant drafts.
        </p>

        {(gmailEmail || justConnected) && (
          <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2">
            <Check className="h-4 w-4 shrink-0" />
            <span>Connected as <strong>{gmailEmail || 'your Gmail account'}</strong></span>
          </div>
        )}

        <a href="/api/auth/google">
          <Button variant="outline" className="gap-2">
            <Mail className="h-4 w-4" />
            {gmailEmail ? 'Reconnect Gmail' : 'Connect Gmail'}
          </Button>
        </a>
      </div>

      {/* Env info */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Environment</h3>
        <div className="space-y-1 text-xs font-mono bg-gray-50 rounded p-3 border border-gray-100 text-gray-500">
          <p>NEXT_PUBLIC_SUPABASE_URL ✓</p>
          <p>NEXT_PUBLIC_SUPABASE_ANON_KEY ✓</p>
          <p>ANTHROPIC_API_KEY ✓</p>
          <p>GOOGLE_CLIENT_ID ✓</p>
          <p>GOOGLE_CLIENT_SECRET ✓</p>
        </div>
      </div>
    </div>
  )
}

export default function SettingsPage() {
  return (
    <>
      <TopBar title="Settings" />
      <Suspense fallback={<div className="p-8 text-sm text-gray-400">Loading…</div>}>
        <SettingsContent />
      </Suspense>
    </>
  )
}
