'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Mail, RefreshCw } from 'lucide-react'
import TopBar from '@/components/layout/TopBar'
import { Button } from '@/components/ui/button'
import ReplyDraftModal from '@/components/email/ReplyDraftModal'
import type { InboxThread } from '@/lib/gmail'

function formatThreadDate(dateStr: string): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  const today = new Date()
  const diffDays = Math.floor((today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  if (diffDays < 7) return d.toLocaleDateString('en-GB', { weekday: 'short' })
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export default function InboxPage() {
  const [threads, setThreads] = useState<InboxThread[]>([])
  const [loading, setLoading] = useState(true)
  const [noGmail, setNoGmail] = useState(false)
  const [selectedThread, setSelectedThread] = useState<InboxThread | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const fetchInbox = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/gmail/inbox')
      const data = await res.json()
      if (data.noGmail) {
        setNoGmail(true)
      } else {
        setThreads(data.threads ?? [])
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInbox()
  }, [])

  const handleDraftReply = (thread: InboxThread) => {
    setSelectedThread(thread)
    setModalOpen(true)
  }

  return (
    <>
      <TopBar
        title="Inbox"
        subtitle="Emails from your contacts in the last 30 days"
        actions={
          <Button variant="outline" size="sm" onClick={fetchInbox} className="gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>
        }
      />

      <div className="p-8">
        {loading && (
          <div className="text-center py-16 text-sm text-gray-400">Checking inbox…</div>
        )}

        {!loading && noGmail && (
          <div className="text-center py-16 space-y-3">
            <Mail className="h-8 w-8 text-gray-300 mx-auto" />
            <p className="text-gray-500 text-sm">Gmail not connected.</p>
            <Link href="/settings">
              <Button variant="outline" size="sm">Connect Gmail in Settings</Button>
            </Link>
          </div>
        )}

        {!loading && !noGmail && threads.length === 0 && (
          <div className="text-center py-16">
            <Mail className="h-8 w-8 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No emails from your contacts in the last 30 days.</p>
          </div>
        )}

        {!loading && !noGmail && threads.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">From</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Subject</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Preview</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide"></th>
                </tr>
              </thead>
              <tbody>
                {threads.map((thread) => (
                  <tr key={thread.threadId} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3">
                      <Link
                        href={`/contacts/${thread.contactId}`}
                        className="font-medium text-gray-900 hover:text-[#1A3C2E] hover:underline"
                      >
                        {thread.contactName}
                      </Link>
                      {thread.contactCompany && (
                        <p className="text-xs text-gray-400 mt-0.5">{thread.contactCompany}</p>
                      )}
                    </td>
                    <td className="px-6 py-3 text-gray-700 max-w-[200px]">
                      <span className="truncate block">{thread.subject}</span>
                      <span className="text-xs text-gray-400">{thread.messageCount} message{thread.messageCount !== 1 ? 's' : ''}</span>
                    </td>
                    <td className="px-6 py-3 text-gray-400 max-w-[280px]">
                      <span className="truncate block text-xs">{thread.snippet}</span>
                    </td>
                    <td className="px-6 py-3 text-gray-500 text-xs whitespace-nowrap">
                      {formatThreadDate(thread.date)}
                    </td>
                    <td className="px-6 py-3">
                      <Button size="sm" onClick={() => handleDraftReply(thread)} className="gap-1.5">
                        <Mail className="h-3.5 w-3.5" />
                        Draft Reply
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ReplyDraftModal
        thread={selectedThread}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSent={fetchInbox}
      />
    </>
  )
}
