'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Mail, Link2, Building2, Briefcase,
  ArrowLeft, Edit, ExternalLink
} from 'lucide-react'
import TopBar from '@/components/layout/TopBar'
import { Button } from '@/components/ui/button'
import StageBadge from '@/components/contacts/StageBadge'
import CadenceBadge from '@/components/contacts/CadenceBadge'
import InteractionTimeline from '@/components/interactions/InteractionTimeline'
import LogInteractionModal from '@/components/interactions/LogInteractionModal'
import EmailDraftModal from '@/components/email/EmailDraftModal'
import { formatDate, daysUntil, formatDaysLabel } from '@/lib/utils'
import type { Contact, Interaction } from '@/lib/types'

const typeLabels: Record<string, string> = {
  'ex-client': 'Ex-client',
  'prospect': 'Prospect',
  'referral-partner': 'Referral partner',
  'lapsed-pitch': 'Lapsed pitch',
  'network': 'Network',
}

export default function ContactProfilePage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [contact, setContact] = useState<Contact | null>(null)
  const [interactions, setInteractions] = useState<Interaction[]>([])
  const [loading, setLoading] = useState(true)
  const [logModalOpen, setLogModalOpen] = useState(false)
  const [emailModalOpen, setEmailModalOpen] = useState(false)
  const [togglingActive, setTogglingActive] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const [cRes, iRes] = await Promise.all([
        fetch(`/api/contacts/${id}`),
        fetch(`/api/interactions?contact_id=${id}`),
      ])
      const contactData = await cRes.json()
      const interactionData = await iRes.json()
      setContact(contactData)
      setInteractions(Array.isArray(interactionData) ? interactionData : [])
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const toggleActive = async () => {
    if (!contact) return
    setTogglingActive(true)
    await fetch(`/api/contacts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !contact.is_active }),
    })
    setContact((c) => c ? { ...c, is_active: !c.is_active } : c)
    setTogglingActive(false)
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
        Loading…
      </div>
    )
  }

  if (!contact) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3">
        <p className="text-gray-500">Contact not found.</p>
        <Button variant="outline" onClick={() => router.push('/contacts')}>Back to contacts</Button>
      </div>
    )
  }

  const days = daysUntil(contact.next_due_date)

  return (
    <>
      <TopBar
        title={contact.full_name}
        subtitle={[contact.role, contact.company].filter(Boolean).join(' · ')}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/contacts">
              <Button variant="ghost" size="sm" className="gap-1.5">
                <ArrowLeft className="h-3.5 w-3.5" />
                Back
              </Button>
            </Link>
            <Link href={`/contacts/${id}/edit`}>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Edit className="h-3.5 w-3.5" />
                Edit
              </Button>
            </Link>
          </div>
        }
      />

      <div className="p-8 grid grid-cols-5 gap-6">
        {/* Left column: contact details */}
        <div className="col-span-2 space-y-4">
          <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <StageBadge stage={contact.kit_stage} />
                  {contact.contact_type && (
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                      {typeLabels[contact.contact_type] || contact.contact_type}
                    </span>
                  )}
                </div>
                {!contact.is_active && (
                  <span className="inline-block mt-1 text-xs text-gray-400 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded">
                    Inactive
                  </span>
                )}
              </div>
              <span className="text-sm font-medium text-gray-500">{contact.contact_owner}</span>
            </div>

            <div className="space-y-2.5 text-sm">
              {contact.company && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Building2 className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                  {contact.company}
                </div>
              )}
              {contact.role && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Briefcase className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                  {contact.role}
                </div>
              )}
              {contact.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                  <a href={`mailto:${contact.email}`} className="text-[#1A3C2E] hover:underline truncate">
                    {contact.email}
                  </a>
                </div>
              )}
              {contact.linkedin_url && (
                <div className="flex items-center gap-2">
                  <Link2 className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                  <a href={contact.linkedin_url} target="_blank" rel="noopener noreferrer"
                    className="text-[#1A3C2E] hover:underline flex items-center gap-1">
                    LinkedIn <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Cadence & timing */}
          <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">KIT Schedule</h3>
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Cadence</span>
                <CadenceBadge cadence={contact.kit_cadence} />
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Last contacted</span>
                <span className="text-gray-700">{formatDate(contact.last_contacted)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Next due</span>
                <span className={`font-medium ${days !== null && days < 0 ? 'text-red-600' : days === 0 ? 'text-amber-600' : 'text-gray-700'}`}>
                  {contact.next_due_date ? `${formatDate(contact.next_due_date)} (${formatDaysLabel(days)})` : '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Tags */}
          {contact.tags && contact.tags.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Tags</h3>
              <div className="flex flex-wrap gap-1.5">
                {contact.tags.map((tag) => (
                  <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {contact.notes && (
            <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Notes</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{contact.notes}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleActive}
              disabled={togglingActive}
              className="text-gray-500"
            >
              {contact.is_active ? 'Mark as inactive' : 'Mark as active'}
            </Button>
          </div>
        </div>

        {/* Right column: interactions */}
        <div className="col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">Interaction history</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setLogModalOpen(true)}>
                Log interaction
              </Button>
              <Button size="sm" onClick={() => setEmailModalOpen(true)} className="gap-1.5">
                <Mail className="h-3.5 w-3.5" />
                Draft KIT Email
              </Button>
            </div>
          </div>

          <InteractionTimeline interactions={interactions} />
        </div>
      </div>

      {logModalOpen && (
        <LogInteractionModal
          contact={contact}
          open={logModalOpen}
          onClose={() => setLogModalOpen(false)}
          onLogged={fetchData}
        />
      )}

      <EmailDraftModal
        contact={contact}
        open={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
        onSent={fetchData}
      />
    </>
  )
}
