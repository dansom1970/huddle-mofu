'use client'

import { useState } from 'react'
import { Copy, Check, Loader2, ExternalLink } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import type { Contact } from '@/lib/types'

interface EmailDraftModalProps {
  contact: Contact | null
  open: boolean
  onClose: () => void
  onSent?: () => void
}

export default function EmailDraftModal({ contact, open, onClose, onSent }: EmailDraftModalProps) {
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(false)
  const [logging, setLogging] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [drafted, setDrafted] = useState(false)

  const handleOpen = async (isOpen: boolean) => {
    if (isOpen && contact && !drafted) {
      await generateDraft()
    }
    if (!isOpen) {
      onClose()
      resetState()
    }
  }

  const resetState = () => {
    setSubject('')
    setBody('')
    setError(null)
    setDrafted(false)
    setCopied(false)
  }

  const generateDraft = async () => {
    if (!contact) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/draft-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactId: contact.id }),
      })
      if (!res.ok) throw new Error('Failed to generate draft')
      const data = await res.json()
      setSubject(data.subject || '')
      setBody(data.body || '')
      setDrafted(true)
    } catch {
      setError('Failed to generate draft. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const buildMailtoLink = () => {
    if (!contact?.email) return null
    const params = new URLSearchParams({
      subject,
      body,
    })
    return `mailto:${contact.email}?${params}`
  }

  const handleOpenInEmail = async () => {
    // Log interaction first, then open email client
    setLogging(true)
    try {
      const today = new Date().toISOString().split('T')[0]
      await fetch('/api/interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact_id: contact!.id,
          date: today,
          type: 'email-sent',
          summary: `KIT email drafted and opened. Subject: ${subject}`,
          email_content: body,
          logged_by: contact!.contact_owner || 'Unknown',
        }),
      })
      onSent?.()
    } catch {
      // Non-fatal — still open the email client
    } finally {
      setLogging(false)
    }

    const mailto = buildMailtoLink()
    if (mailto) window.location.href = mailto
    onClose()
    resetState()
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Draft KIT Email</DialogTitle>
          <DialogDescription>
            {contact
              ? `For ${contact.full_name}${contact.company ? ` at ${contact.company}` : ''}`
              : ''}
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-[#1A3C2E]" />
            <p className="text-sm text-gray-500">Reading email history and drafting…</p>
          </div>
        )}

        {error && !loading && (
          <div className="rounded-md bg-red-50 border border-red-200 p-4">
            <p className="text-sm text-red-700">{error}</p>
            <Button variant="outline" size="sm" onClick={generateDraft} className="mt-3">
              Try again
            </Button>
          </div>
        )}

        {!loading && !error && drafted && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="subject" className="mb-1.5 block">Subject</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="font-medium"
              />
            </div>
            <div>
              <Label htmlFor="body" className="mb-1.5 block">Email body</Label>
              <Textarea
                id="body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={10}
                className="text-sm leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5">
                  {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? 'Copied' : 'Copy'}
                </Button>
                <Button variant="ghost" size="sm" onClick={generateDraft} className="text-gray-500">
                  Regenerate
                </Button>
              </div>
              <Button
                onClick={handleOpenInEmail}
                disabled={logging || !contact?.email}
                className="gap-1.5"
                title={!contact?.email ? 'No email address on file' : undefined}
              >
                {logging
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  : <ExternalLink className="h-3.5 w-3.5" />
                }
                Open in email + log
              </Button>
            </div>

            {!contact?.email && (
              <p className="text-xs text-amber-600">No email address saved for this contact — add one to enable the send button.</p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
