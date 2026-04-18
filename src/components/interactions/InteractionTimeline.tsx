import { Mail, Phone, Video, Link2, StickyNote, MailOpen } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { Interaction, InteractionType, InteractionOutcome } from '@/lib/types'

const typeIcons: Record<InteractionType, React.ReactNode> = {
  'email-sent': <Mail className="h-3.5 w-3.5" />,
  'email-received': <MailOpen className="h-3.5 w-3.5" />,
  'call': <Phone className="h-3.5 w-3.5" />,
  'meeting': <Video className="h-3.5 w-3.5" />,
  'linkedin': <Link2 className="h-3.5 w-3.5" />,
  'note': <StickyNote className="h-3.5 w-3.5" />,
}

const typeLabels: Record<InteractionType, string> = {
  'email-sent': 'Email sent',
  'email-received': 'Email received',
  'call': 'Call',
  'meeting': 'Meeting',
  'linkedin': 'LinkedIn',
  'note': 'Note',
}

const outcomeStyles: Record<InteractionOutcome, string> = {
  'no-response': 'bg-gray-100 text-gray-600',
  'positive': 'bg-green-100 text-green-700',
  'catch-up-booked': 'bg-blue-100 text-blue-700',
  'brief-mentioned': 'bg-purple-100 text-purple-700',
  'other': 'bg-gray-100 text-gray-600',
}

const outcomeLabels: Record<InteractionOutcome, string> = {
  'no-response': 'No response',
  'positive': 'Positive',
  'catch-up-booked': 'Catch-up booked',
  'brief-mentioned': 'Brief mentioned',
  'other': 'Other',
}

export default function InteractionTimeline({ interactions }: { interactions: Interaction[] }) {
  if (interactions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-gray-400">No interactions logged yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {interactions.map((interaction, idx) => (
        <div key={interaction.id} className="relative pl-8">
          {idx < interactions.length - 1 && (
            <div className="absolute left-[13px] top-6 bottom-0 w-px bg-gray-200" />
          )}
          <div className="absolute left-0 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-gray-500 ring-2 ring-white">
            {interaction.type ? typeIcons[interaction.type] : <StickyNote className="h-3 w-3" />}
          </div>

          <div className="bg-white rounded-md border border-gray-200 p-3">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-700">
                  {interaction.type ? typeLabels[interaction.type] : 'Interaction'}
                </span>
                {interaction.logged_by && (
                  <span className="text-xs text-gray-400">by {interaction.logged_by}</span>
                )}
              </div>
              <span className="text-xs text-gray-400">{formatDate(interaction.date)}</span>
            </div>

            {interaction.summary && (
              <p className="text-sm text-gray-600 leading-relaxed">{interaction.summary}</p>
            )}

            {interaction.email_content && (
              <details className="mt-2">
                <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">
                  View email content
                </summary>
                <pre className="mt-2 text-xs text-gray-500 whitespace-pre-wrap font-sans leading-relaxed border-t border-gray-100 pt-2">
                  {interaction.email_content}
                </pre>
              </details>
            )}

            <div className="flex items-center gap-2 mt-2">
              {interaction.outcome && (
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${outcomeStyles[interaction.outcome]}`}
                >
                  {outcomeLabels[interaction.outcome]}
                </span>
              )}
              {interaction.next_action && (
                <span className="text-xs text-gray-400 italic">→ {interaction.next_action}</span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
