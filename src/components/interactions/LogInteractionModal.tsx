'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Contact, InteractionType, InteractionOutcome } from '@/lib/types'

interface LogInteractionModalProps {
  contact: Contact
  open: boolean
  onClose: () => void
  onLogged: () => void
}

const interactionTypes: { value: InteractionType; label: string }[] = [
  { value: 'email-sent', label: 'Email sent' },
  { value: 'email-received', label: 'Email received' },
  { value: 'call', label: 'Call' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'note', label: 'Note' },
]

const outcomes: { value: InteractionOutcome; label: string }[] = [
  { value: 'positive', label: 'Positive' },
  { value: 'no-response', label: 'No response' },
  { value: 'catch-up-booked', label: 'Catch-up booked' },
  { value: 'brief-mentioned', label: 'Brief mentioned' },
  { value: 'other', label: 'Other' },
]

export default function LogInteractionModal({ contact, open, onClose, onLogged }: LogInteractionModalProps) {
  const [type, setType] = useState<InteractionType>('email-sent')
  const [outcome, setOutcome] = useState<InteractionOutcome>('positive')
  const [summary, setSummary] = useState('')
  const [nextAction, setNextAction] = useState('')
  const [loggedBy, setLoggedBy] = useState<string>(contact.contact_owner || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!summary.trim()) {
      setError('Please add a summary.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const today = new Date().toISOString().split('T')[0]
      const res = await fetch('/api/interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact_id: contact.id,
          date: today,
          type,
          outcome,
          summary,
          next_action: nextAction || null,
          logged_by: loggedBy,
        }),
      })
      if (!res.ok) throw new Error('Failed to log interaction')
      onLogged()
      onClose()
      setSummary('')
      setNextAction('')
    } catch {
      setError('Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Log Interaction</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="mb-1.5 block">Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as InteractionType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {interactionTypes.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1.5 block">Outcome</Label>
              <Select value={outcome} onValueChange={(v) => setOutcome(v as InteractionOutcome)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {outcomes.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="mb-1.5 block">Summary</Label>
            <Textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="What happened in this interaction?"
              rows={4}
            />
          </div>

          <div>
            <Label className="mb-1.5 block">Next action <span className="text-gray-400 font-normal">(optional)</span></Label>
            <Textarea
              value={nextAction}
              onChange={(e) => setNextAction(e.target.value)}
              placeholder="Any follow-up needed?"
              rows={2}
            />
          </div>

          <div>
            <Label className="mb-1.5 block">Logged by</Label>
            <Select value={loggedBy} onValueChange={setLoggedBy}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Nicole">Nicole</SelectItem>
                <SelectItem value="Danny">Danny</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
              Log interaction
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
