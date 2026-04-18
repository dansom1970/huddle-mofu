'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Contact } from '@/lib/types'

interface ContactFormProps {
  initial?: Partial<Contact>
  contactId?: string
}

export default function ContactForm({ initial = {}, contactId }: ContactFormProps) {
  const router = useRouter()
  const isEdit = !!contactId

  const [form, setForm] = useState({
    full_name: initial.full_name || '',
    company: initial.company || '',
    role: initial.role || '',
    email: initial.email || '',
    linkedin_url: initial.linkedin_url || '',
    contact_type: initial.contact_type || '',
    contact_owner: initial.contact_owner || '',
    kit_cadence: initial.kit_cadence || '',
    kit_stage: String(initial.kit_stage || 1),
    last_contacted: initial.last_contacted || '',
    notes: initial.notes || '',
    tags: initial.tags?.join(', ') || '',
    is_active: initial.is_active !== false,
  })

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = (key: string, value: string | boolean) => setForm((f) => ({ ...f, [key]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.full_name.trim()) {
      setError('Name is required.')
      return
    }
    setSaving(true)
    setError(null)

    const payload = {
      full_name: form.full_name.trim(),
      company: form.company || null,
      role: form.role || null,
      email: form.email || null,
      linkedin_url: form.linkedin_url || null,
      contact_type: form.contact_type || null,
      contact_owner: form.contact_owner || null,
      kit_cadence: form.kit_cadence || null,
      kit_stage: parseInt(form.kit_stage, 10),
      last_contacted: form.last_contacted || null,
      notes: form.notes || null,
      tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      is_active: form.is_active,
    }

    try {
      const url = isEdit ? `/api/contacts/${contactId}` : '/api/contacts'
      const method = isEdit ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Failed to save')
      const data = await res.json()
      router.push(`/contacts/${data.id}`)
    } catch {
      setError('Failed to save contact. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm space-y-5">
        <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-3">Basic details</h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Label htmlFor="full_name" className="mb-1.5 block">Full name *</Label>
            <Input
              id="full_name"
              value={form.full_name}
              onChange={(e) => set('full_name', e.target.value)}
              placeholder="Sarah Mitchell"
            />
          </div>
          <div>
            <Label htmlFor="company" className="mb-1.5 block">Company</Label>
            <Input
              id="company"
              value={form.company}
              onChange={(e) => set('company', e.target.value)}
              placeholder="Acme Ltd"
            />
          </div>
          <div>
            <Label htmlFor="role" className="mb-1.5 block">Role</Label>
            <Input
              id="role"
              value={form.role}
              onChange={(e) => set('role', e.target.value)}
              placeholder="CMO"
            />
          </div>
          <div>
            <Label htmlFor="email" className="mb-1.5 block">Email</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              placeholder="sarah@acme.com"
            />
          </div>
          <div>
            <Label htmlFor="linkedin_url" className="mb-1.5 block">LinkedIn URL</Label>
            <Input
              id="linkedin_url"
              value={form.linkedin_url}
              onChange={(e) => set('linkedin_url', e.target.value)}
              placeholder="https://linkedin.com/in/..."
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm space-y-5">
        <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-3">KIT settings</h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="mb-1.5 block">Contact type</Label>
            <Select value={form.contact_type} onValueChange={(v) => set('contact_type', v)}>
              <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ex-client">Ex-client</SelectItem>
                <SelectItem value="prospect">Prospect</SelectItem>
                <SelectItem value="referral-partner">Referral partner</SelectItem>
                <SelectItem value="lapsed-pitch">Lapsed pitch</SelectItem>
                <SelectItem value="network">Network</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-1.5 block">Owner</Label>
            <Select value={form.contact_owner} onValueChange={(v) => set('contact_owner', v)}>
              <SelectTrigger><SelectValue placeholder="Select owner" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Nicole">Nicole</SelectItem>
                <SelectItem value="Danny">Danny</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-1.5 block">KIT cadence</Label>
            <Select value={form.kit_cadence} onValueChange={(v) => set('kit_cadence', v)}>
              <SelectTrigger><SelectValue placeholder="Select cadence" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="6-weeks">Every 6 weeks</SelectItem>
                <SelectItem value="2-months">Every 2 months</SelectItem>
                <SelectItem value="3-months">Every 3 months</SelectItem>
                <SelectItem value="6-months">Every 6 months</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-1.5 block">KIT stage</Label>
            <Select value={form.kit_stage} onValueChange={(v) => set('kit_stage', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Stage 1 — Cold</SelectItem>
                <SelectItem value="2">Stage 2 — Warming</SelectItem>
                <SelectItem value="3">Stage 3 — Warm</SelectItem>
                <SelectItem value="4">Stage 4 — Hot → Pipeline</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2">
            <Label htmlFor="last_contacted" className="mb-1.5 block">Last contacted</Label>
            <Input
              id="last_contacted"
              type="date"
              value={form.last_contacted}
              onChange={(e) => set('last_contacted', e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm space-y-5">
        <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-3">Notes & context</h3>

        <div>
          <Label htmlFor="notes" className="mb-1.5 block">Notes</Label>
          <Textarea
            id="notes"
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
            placeholder="Background on this contact, history, context for outreach…"
            rows={5}
          />
        </div>

        <div>
          <Label htmlFor="tags" className="mb-1.5 block">Tags <span className="text-gray-400 font-normal">(comma-separated)</span></Label>
          <Input
            id="tags"
            value={form.tags}
            onChange={(e) => set('tags', e.target.value)}
            placeholder="legal, warm, rebrand"
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
          {isEdit ? 'Save changes' : 'Create contact'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
