'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Plus, Search } from 'lucide-react'
import TopBar from '@/components/layout/TopBar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import StageBadge from '@/components/contacts/StageBadge'
import CadenceBadge from '@/components/contacts/CadenceBadge'
import { formatDate, daysUntil, formatDaysLabel, cn } from '@/lib/utils'
import type { Contact, ContactType, KitCadence } from '@/lib/types'

const typeLabels: Record<ContactType, string> = {
  'ex-client': 'Ex-client',
  'prospect': 'Prospect',
  'referral-partner': 'Referral partner',
  'lapsed-pitch': 'Lapsed pitch',
  'network': 'Network',
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [ownerFilter, setOwnerFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [activeFilter, setActiveFilter] = useState('true')

  const fetchContacts = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (ownerFilter) params.set('owner', ownerFilter)
      if (typeFilter) params.set('type', typeFilter)
      if (activeFilter) params.set('active', activeFilter)

      const res = await fetch(`/api/contacts?${params}`)
      const data = await res.json()
      setContacts(Array.isArray(data) ? data : [])
    } finally {
      setLoading(false)
    }
  }, [ownerFilter, typeFilter, activeFilter])

  useEffect(() => {
    fetchContacts()
  }, [fetchContacts])

  const filtered = contacts.filter((c) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      c.full_name.toLowerCase().includes(q) ||
      c.company?.toLowerCase().includes(q) ||
      c.role?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q)
    )
  })

  return (
    <>
      <TopBar
        title="All Contacts"
        subtitle={`${filtered.length} contact${filtered.length !== 1 ? 's' : ''}`}
        actions={
          <Link href="/contacts/new">
            <Button size="sm" className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              Add contact
            </Button>
          </Link>
        }
      />

      <div className="p-8 space-y-4">
        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search contacts…"
              className="pl-8"
            />
          </div>
          <select
            value={ownerFilter}
            onChange={(e) => setOwnerFilter(e.target.value)}
            className="h-9 rounded-md border border-gray-300 bg-white px-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3C2E]"
          >
            <option value="">All owners</option>
            <option value="Nicole">Nicole</option>
            <option value="Danny">Danny</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-9 rounded-md border border-gray-300 bg-white px-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3C2E]"
          >
            <option value="">All types</option>
            <option value="ex-client">Ex-client</option>
            <option value="prospect">Prospect</option>
            <option value="referral-partner">Referral partner</option>
            <option value="lapsed-pitch">Lapsed pitch</option>
            <option value="network">Network</option>
          </select>
          <select
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
            className="h-9 rounded-md border border-gray-300 bg-white px-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3C2E]"
          >
            <option value="true">Active</option>
            <option value="false">Inactive</option>
            <option value="">All</option>
          </select>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400 text-sm">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-sm">No contacts found.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Stage</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Cadence</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Last contact</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Next due</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Owner</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((contact) => {
                  const days = daysUntil(contact.next_due_date)
                  const isOverdue = days !== null && days < 0
                  return (
                    <tr key={contact.id} className={cn('border-b border-gray-100 hover:bg-gray-50 transition-colors', isOverdue && 'bg-red-50/40')}>
                      <td className="px-6 py-3">
                        <Link href={`/contacts/${contact.id}`} className="font-medium text-gray-900 hover:text-[#1A3C2E] hover:underline">
                          {contact.full_name}
                        </Link>
                        {contact.company && (
                          <p className="text-xs text-gray-400 mt-0.5">{contact.company}</p>
                        )}
                      </td>
                      <td className="px-6 py-3">
                        {contact.contact_type ? (
                          <span className="text-xs text-gray-500">{typeLabels[contact.contact_type]}</span>
                        ) : '—'}
                      </td>
                      <td className="px-6 py-3">
                        <StageBadge stage={contact.kit_stage} />
                      </td>
                      <td className="px-6 py-3">
                        <CadenceBadge cadence={contact.kit_cadence as KitCadence} />
                      </td>
                      <td className="px-6 py-3 text-gray-500">{formatDate(contact.last_contacted)}</td>
                      <td className="px-6 py-3">
                        <span className={cn('text-sm', isOverdue ? 'text-red-600 font-medium' : 'text-gray-500')}>
                          {formatDaysLabel(days)}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-gray-500">{contact.contact_owner || '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
