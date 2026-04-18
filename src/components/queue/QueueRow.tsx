'use client'

import Link from 'next/link'
import { Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import StageBadge from '@/components/contacts/StageBadge'
import { formatDate, daysUntil, formatDaysLabel, cn } from '@/lib/utils'
import type { Contact } from '@/lib/types'

interface QueueRowProps {
  contact: Contact
  onDraftEmail: (contact: Contact) => void
}

export default function QueueRow({ contact, onDraftEmail }: QueueRowProps) {
  const days = daysUntil(contact.next_due_date)
  const isOverdue = days !== null && days < 0

  return (
    <tr className={cn('border-b border-gray-100 hover:bg-gray-50 transition-colors', isOverdue && 'bg-red-50/60')}>
      <td className="px-6 py-3">
        <Link href={`/contacts/${contact.id}`} className="font-medium text-gray-900 hover:text-[#1A3C2E] hover:underline">
          {contact.full_name}
        </Link>
        {contact.email && (
          <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[200px]">{contact.email}</p>
        )}
      </td>
      <td className="px-6 py-3 text-sm text-gray-600">{contact.company || '—'}</td>
      <td className="px-6 py-3">
        <StageBadge stage={contact.kit_stage} />
      </td>
      <td className="px-6 py-3 text-sm text-gray-500">{formatDate(contact.last_contacted)}</td>
      <td className="px-6 py-3">
        <span
          className={cn(
            'text-sm font-medium',
            isOverdue ? 'text-red-600' : days === 0 ? 'text-amber-600' : 'text-gray-600'
          )}
        >
          {formatDaysLabel(days)}
        </span>
      </td>
      <td className="px-6 py-3">
        <span className="text-sm text-gray-500">{contact.contact_owner || '—'}</span>
      </td>
      <td className="px-6 py-3">
        <Button
          size="sm"
          onClick={() => onDraftEmail(contact)}
          className="gap-1.5"
        >
          <Mail className="h-3.5 w-3.5" />
          Draft Email
        </Button>
      </td>
    </tr>
  )
}
