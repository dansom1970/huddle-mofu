'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Invalid email or password.')
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-8 shadow-sm w-full max-w-sm">
      <div className="mb-6 text-center">
        <h1 className="text-xl font-semibold text-[#1A3C2E]">Huddle KIT</h1>
        <p className="text-sm text-gray-500 mt-1">Sign in to continue</p>
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <Label htmlFor="email" className="mb-1.5 block">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@huddlecreative.com"
            required
            autoFocus
          />
        </div>
        <div>
          <Label htmlFor="password" className="mb-1.5 block">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
          Sign in
        </Button>
      </form>
    </div>
  )
}
