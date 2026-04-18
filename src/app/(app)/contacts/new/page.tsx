import TopBar from '@/components/layout/TopBar'
import ContactForm from '@/components/contacts/ContactForm'

export default function NewContactPage() {
  return (
    <>
      <TopBar title="Add Contact" subtitle="Create a new contact in Huddle KIT" />
      <div className="p-8">
        <ContactForm />
      </div>
    </>
  )
}
