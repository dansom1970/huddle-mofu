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
import type { InboxThread } from '@/lib/gmail'

interface ReplyDraftModalProps {
  thread: InboxThread | null
  open: boolean
  onClose: () => void
  onSent?: () => void
}

export default function ReplyDraftModal({ thread, open, onClose, onSent }: ReplyDraftModalProps) {
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(false)
  const [logging, setLogging] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [drafted, setDrafted] = useState(false)

  const handleOpen = async (isOpen: boolean) => {
    if (isOpen && thread && !drafted) {
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
    if (!thread) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/draft-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threadId: thread.threadId, contactId: thread.contactId }),
      })
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      setSubject(data.subject || `Re: ${thread.subject}`)
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

  const handleOpenInEmail = async () => {
    setLogging(true)
    try {
      const today = new Date().toISOString().split('T')[0]
      await fetch('/api/interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact_id: thread!.contactId,
          date: today,
          type: 'email-sent',
          summary: `Reply drafted and sent. Subject: ${subject}`,
          email_content: body,
          logged_by: 'Unknown',
        }),
      })
      onSent?.()
    } catch {
      // Non-fatal
    } finally {
      setLogging(false)
    }

    const params = new URLSearchParams({ subject, body })
    window.location.href = `mailto:${thread!.fromEmail}?${params}`
    onClose()
    resetState()
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Draft Reply</DialogTitle>
          <DialogDescription>
            {thread
              ? `Replying to ${thread.contactName}${thread.contactCompany ? ` · ${thread.contactCompany}` : ''}`
              : ''}
          </DialogDescription>
        </DialogHeader>

        {thread && (
          <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-xs text-gray-500 mb-1">
            <span className="font-medium text-gray-700">Re:</span> {thread.subject}
            <span className="ml-2 text-gray-400">· {thread.messageCount} message{thread.messageCount !== 1 ? 's' : ''}</span>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-[#1A3C2E]" />
            <p className="text-sm text-gray-500">Reading thread and drafting reply…</p>
          </div>
        )}

        {error && !loading && (
          <div className="rounded-md bg-red-50 border border-red-200 p-4">
            <p className="text-sm text-red-700">{error}</p>
            <Button variant="outline" size="sm" onClick={generateDraft} className="mt-3">Try again</Button>
          </div>
        )}

        {!loading && !error && drafted && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="reply-subject" className="mb-1.5 block">Subject</Label>
              <Input
                id="reply-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="font-medium"
              />
            </div>
            <div>
              <Label htmlFor="reply-body" className="mb-1.5 block">Reply</Label>
              <Textarea
                id="reply-body"
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
              <Button onClick={handleOpenInEmail} disabled={logging} className="gap-1.5">
                {logging ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ExternalLink className="h-3.5 w-3.5" />}
                Open in email + log
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
