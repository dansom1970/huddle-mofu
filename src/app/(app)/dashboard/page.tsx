import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import TopBar from '@/components/layout/TopBar'
import { formatDate, daysUntil } from '@/lib/utils'
import type { Contact } from '@/lib/types'

async function getDashboardData() {
  try {
    const supabase = await createClient()
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]
    const in7 = new Date(today)
    in7.setDate(today.getDate() + 7)
    const in7Str = in7.toISOString().split('T')[0]
    const in14 = new Date(today)
    in14.setDate(today.getDate() + 14)
    const in14Str = in14.toISOString().split('T')[0]

    const { data: contacts } = await supabase
      .from('contacts')
      .select('*')
      .eq('is_active', true)
      .order('next_due_date', { ascending: true })

    if (!contacts) return null

    const dueThisWeek = contacts.filter((c) => c.next_due_date && c.next_due_date <= in7Str).length
    const due14Days = contacts.filter((c) => c.next_due_date && c.next_due_date <= in14Str).length
    const totalActive = contacts.length
    const stage3Plus = contacts.filter((c) => c.kit_stage >= 3).length

    const overdue = contacts
      .filter((c) => c.next_due_date && c.next_due_date < todayStr)
      .slice(0, 5)

    return { dueThisWeek, due14Days, totalActive, stage3Plus, overdue }
  } catch {
    return null
  }
}

export default async function DashboardPage() {
  const data = await getDashboardData()

  return (
    <>
      <TopBar
        title="Dashboard"
        subtitle="Welcome back — here's where things stand."
      />

      <div className="p-8 space-y-8">
        {/* Summary cards */}
        <div className="grid grid-cols-4 gap-4">
          <StatCard
            label="Due this week"
            value={data?.dueThisWeek ?? '—'}
            href="/queue"
            highlight={data?.dueThisWeek ? data.dueThisWeek > 0 : false}
          />
          <StatCard
            label="Due in 14 days"
            value={data?.due14Days ?? '—'}
            href="/queue"
          />
          <StatCard
            label="Active contacts"
            value={data?.totalActive ?? '—'}
            href="/contacts"
          />
          <StatCard
            label="Stage 3+ (warm)"
            value={data?.stage3Plus ?? '—'}
            href="/contacts"
            note="Priority"
          />
        </div>

        {/* Overdue table */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700">Most overdue</h2>
            <Link href="/queue" className="text-xs text-[#1A3C2E] hover:underline">
              View full queue →
            </Link>
          </div>

          {!data || data.overdue.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center shadow-sm">
              <p className="text-sm text-gray-400">No overdue contacts — great work.</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Company</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Last contacted</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Overdue by</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Owner</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.overdue as Contact[]).map((contact) => {
                    const days = daysUntil(contact.next_due_date)
                    return (
                      <tr key={contact.id} className="border-b border-gray-100 hover:bg-gray-50 bg-red-50/40">
                        <td className="px-6 py-3">
                          <Link href={`/contacts/${contact.id}`} className="font-medium text-gray-900 hover:text-[#1A3C2E] hover:underline">
                            {contact.full_name}
                          </Link>
                        </td>
                        <td className="px-6 py-3 text-gray-500">{contact.company || '—'}</td>
                        <td className="px-6 py-3 text-gray-500">{formatDate(contact.last_contacted)}</td>
                        <td className="px-6 py-3 text-red-600 font-medium">
                          {days !== null ? `${Math.abs(days)}d` : '—'}
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
      </div>
    </>
  )
}

function StatCard({
  label,
  value,
  href,
  highlight,
  note,
}: {
  label: string
  value: number | string
  href: string
  highlight?: boolean
  note?: string
}) {
  return (
    <Link href={href}>
      <div className={`bg-white rounded-lg border p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer ${highlight ? 'border-amber-300' : 'border-gray-200'}`}>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500 mt-1">{label}</p>
        {note && <p className="text-xs text-[#1A3C2E] font-medium mt-1">{note}</p>}
      </div>
    </Link>
  )
}
