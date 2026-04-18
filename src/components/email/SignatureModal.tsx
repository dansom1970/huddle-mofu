'use client'

import { useState } from 'react'
import { Loader2, Check, ArrowRight } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { InboxThread } from '@/lib/gmail'

const fieldLabels: Record<string, string> = {
  full_name: 'Name',
  role: 'Role',
  company: 'Company',
  email: 'Email',
  phone: 'Phone',
  linkedin_url: 'LinkedIn',
}

interface Change {
  current: string | null
  scraped: string | null
}

interface SignatureModalProps {
  thread: InboxThread | null
  open: boolean
  onClose: () => void
  onUpdated: () => void
}

export default function SignatureModal({ thread, open, onClose, onUpdated }: SignatureModalProps) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [changes, setChanges] = useState<Record<string, Change>>({})
  const [contactId, setContactId] = useState<string | null>(null)
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [done, setDone] = useState(false)

  const handleOpen = async (isOpen: boolean) => {
    if (isOpen && thread && !done && Object.keys(changes).length === 0) {
      await scrape()
    }
    if (!isOpen) {
      onClose()
      reset()
    }
  }

  const reset = () => {
    setChanges({})
    setSelected({})
    setError(null)
    setDone(false)
    setContactId(null)
  }

  const scrape = async () => {
    if (!thread) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/scrape-signature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threadId: thread.threadId, contactId: thread.contactId }),
      })
      if (!res.ok) throw new Error('Failed to scrape')
      const data = await res.json()
      setChanges(data.changes ?? {})
      setContactId(data.contact?.id ?? thread.contactId)
      // Default all changes to selected
      const sel: Record<string, boolean> = {}
      for (const key of Object.keys(data.changes ?? {})) sel[key] = true
      setSelected(sel)
    } catch {
      setError('Could not read signature. The email may not contain one.')
    } finally {
      setLoading(false)
    }
  }

  const handleApply = async () => {
    if (!contactId) return
    setSaving(true)
    const patch: Record<string, string> = {}
    for (const [key, checked] of Object.entries(selected)) {
      if (checked && changes[key]?.scraped) {
        patch[key] = changes[key].scraped!
      }
    }
    await fetch(`/api/contacts/${contactId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    setSaving(false)
    setDone(true)
    onUpdated()
    setTimeout(() => {
      onClose()
      reset()
    }, 1200)
  }

  const selectedCount = Object.values(selected).filter(Boolean).length

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Update from signature</DialogTitle>
          <DialogDescription>
            {thread ? `Scanning email from ${thread.contactName}` : ''}
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <Loader2 className="h-7 w-7 animate-spin text-[#1A3C2E]" />
            <p className="text-sm text-gray-500">Reading signature…</p>
          </div>
        )}

        {error && !loading && (
          <div className="rounded-md bg-amber-50 border border-amber-200 p-4 text-sm text-amber-700">
            {error}
          </div>
        )}

        {done && (
          <div className="flex flex-col items-center justify-center py-10 gap-2 text-green-600">
            <Check className="h-7 w-7" />
            <p className="text-sm font-medium">Contact updated</p>
          </div>
        )}

        {!loading && !error && !done && Object.keys(changes).length === 0 && contactId && (
          <p className="text-sm text-gray-500 py-4 text-center">
            No new information found in the signature — contact is already up to date.
          </p>
        )}

        {!loading && !error && !done && Object.keys(changes).length > 0 && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Select the fields you want to update:
            </p>

            <div className="space-y-2">
              {Object.entries(changes).map(([field, { current, scraped }]) => (
                <label
                  key={field}
                  className="flex items-start gap-3 rounded-md border border-gray-200 p-3 cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selected[field] ?? true}
                    onChange={(e) => setSelected((s) => ({ ...s, [field]: e.target.checked }))}
                    className="mt-0.5 accent-[#1A3C2E]"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                      {fieldLabels[field] ?? field}
                    </p>
                    <div className="flex items-center gap-2 text-sm flex-wrap">
                      <span className="text-gray-400 line-through truncate">{current || 'empty'}</span>
                      <ArrowRight className="h-3 w-3 text-gray-400 shrink-0" />
                      <span className="text-gray-800 font-medium truncate">{scraped}</span>
                    </div>
                  </div>
                </label>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button onClick={handleApply} disabled={saving || selectedCount === 0}>
                {saving && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
                Apply {selectedCount} change{selectedCount !== 1 ? 's' : ''}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
