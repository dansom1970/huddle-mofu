export type ContactType = 'ex-client' | 'prospect' | 'referral-partner' | 'lapsed-pitch' | 'network'
export type ContactOwner = 'Nicole' | 'Danny'
export type KitCadence = '6-weeks' | '2-months' | '3-months' | '6-months'
export type InteractionType = 'email-sent' | 'email-received' | 'call' | 'meeting' | 'linkedin' | 'note'
export type InteractionOutcome = 'no-response' | 'positive' | 'catch-up-booked' | 'brief-mentioned' | 'other'

export interface Contact {
  id: string
  full_name: string
  company: string | null
  role: string | null
  contact_type: ContactType | null
  contact_owner: ContactOwner | null
  kit_cadence: KitCadence | null
  last_contacted: string | null
  next_due_date: string | null
  kit_stage: number
  linkedin_url: string | null
  email: string | null
  notes: string | null
  is_active: boolean
  tags: string[] | null
  created_at: string
}

export interface Interaction {
  id: string
  contact_id: string
  date: string
  type: InteractionType | null
  summary: string | null
  outcome: InteractionOutcome | null
  logged_by: string | null
  email_content: string | null
  next_action: string | null
  created_at: string
}
