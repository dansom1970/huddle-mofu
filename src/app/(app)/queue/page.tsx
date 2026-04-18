'use client'

import { useState, useEffect, useCallback } from 'react'
import TopBar from '@/components/layout/TopBar'
import QueueRow from '@/components/queue/QueueRow'
import EmailDraftModal from '@/components/email/EmailDraftModal'
import type { Contact } from '@/lib/types'

export default function QueuePage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [ownerFilter, setOwnerFilter] = useState<string>('')

  const fetchQueue = useCallback(async () => {
    setLoading(true)
    try {
      const today = new Date()
      const in14 = new Date(today)
      in14.setDate(today.getDate() + 14)

      const params = new URLSearchParams({ active: 'true' })
      if (ownerFilter) params.set('owner', ownerFilter)

      const res = await fetch(`/api/contacts?${params}`)
      const data: Contact[] = await res.json()

      const cutoff = in14.toISOString().split('T')[0]
      const queue = data.filter((c) => c.next_due_date && c.next_due_date <= cutoff)
      setContacts(queue)
    } finally {
      setLoading(false)
    }
  }, [ownerFilter])

  useEffect(() => {
    fetchQueue()
  }, [fetchQueue])

  const handleDraftEmail = (contact: Contact) => {
    setSelectedContact(contact)
    setModalOpen(true)
  }

  const overdueCount = contacts.filter((c) => {
    const today = new Date().toISOString().split('T')[0]
    return c.next_due_date && c.next_due_date < today
  }).length

  return (
    <>
      <TopBar
        title="Outreach Queue"
        subtitle={
          contacts.length > 0
            ? `${contacts.length} contact${contacts.length !== 1 ? 's' : ''} due — ${overdueCount} overdue`
            : 'All caught up'
        }
        actions={
          <div className="flex gap-2">
            <select
              value={ownerFilter}
              onChange={(e) => setOwnerFilter(e.target.value)}
              className="h-8 rounded-md border border-gray-300 bg-white px-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3C2E]"
            >
              <option value="">All owners</option>
              <option value="Nicole">Nicole</option>
              <option value="Danny">Danny</option>
            </select>
          </div>
        }
      />

      <div className="p-8">
        {loading ? (
          <div className="text-sm text-gray-400 py-8 text-center">Loading queue…</div>
        ) : contacts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 text-sm">No contacts due in the next 14 days.</p>
            <p className="text-gray-400 text-xs mt-1">Nice work — you&apos;re all caught up.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Company</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Stage</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Last Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Due</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Owner</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide"></th>
                </tr>
              </thead>
              <tbody>
                {contacts.map((contact) => (
                  <QueueRow
                    key={contact.id}
                    contact={contact}
                    onDraftEmail={handleDraftEmail}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <EmailDraftModal
        contact={selectedContact}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSent={fetchQueue}
      />
    </>
  )
}
