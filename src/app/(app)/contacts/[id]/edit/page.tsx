import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import TopBar from '@/components/layout/TopBar'
import ContactForm from '@/components/contacts/ContactForm'

export default async function EditContactPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: contact } = await supabase
    .from('contacts')
    .select('*')
    .eq('id', id)
    .single()

  if (!contact) notFound()

  return (
    <>
      <TopBar
        title={`Edit — ${contact.full_name}`}
        subtitle={contact.company || undefined}
      />
      <div className="p-8">
        <ContactForm initial={contact} contactId={id} />
      </div>
    </>
  )
}
