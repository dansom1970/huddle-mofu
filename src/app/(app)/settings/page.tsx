import TopBar from '@/components/layout/TopBar'

export default function SettingsPage() {
  return (
    <>
      <TopBar title="Settings" subtitle="Configure Huddle KIT" />
      <div className="p-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm max-w-lg">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Environment</h3>
          <p className="text-sm text-gray-500">
            Connect your Supabase project and Anthropic API key via <code className="bg-gray-100 px-1 rounded text-xs">.env.local</code> to get started.
          </p>
          <div className="mt-4 space-y-2 text-sm font-mono bg-gray-50 rounded p-3 border border-gray-200 text-gray-600">
            <p>NEXT_PUBLIC_SUPABASE_URL</p>
            <p>NEXT_PUBLIC_SUPABASE_ANON_KEY</p>
            <p>ANTHROPIC_API_KEY</p>
          </div>
        </div>
      </div>
    </>
  )
}
