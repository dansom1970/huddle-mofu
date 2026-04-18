'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LayoutDashboard, Users, ListChecks, Settings, LogOut, Inbox } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface SidebarProps {
  queueCount?: number
  userEmail?: string
  ownerName?: string | null
}

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/queue', label: 'Outreach Queue', icon: ListChecks, badgeKey: 'queue' },
  { href: '/inbox', label: 'Inbox', icon: Inbox },
  { href: '/contacts', label: 'All Contacts', icon: Users },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export default function Sidebar({ queueCount = 0, userEmail, ownerName }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="w-56 min-h-screen bg-[#1A3C2E] flex flex-col">
      <div className="px-5 py-6 border-b border-white/10">
        <Link href="/dashboard" className="block">
          <span className="text-white font-semibold text-lg tracking-tight">Huddle KIT</span>
          <span className="block text-white/50 text-xs mt-0.5">Relationship Nurture</span>
        </Link>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon, badgeKey }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center justify-between gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                isActive
                  ? 'bg-white/15 text-white font-medium'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              )}
            >
              <span className="flex items-center gap-3">
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </span>
              {badgeKey === 'queue' && queueCount > 0 && (
                <span className="bg-amber-400 text-amber-900 text-xs font-semibold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                  {queueCount}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      <div className="px-4 py-4 border-t border-white/10 space-y-2">
        {userEmail && (
          <div className="px-1">
            <p className="text-white/80 text-xs font-medium truncate">{ownerName || userEmail}</p>
            {ownerName && <p className="text-white/40 text-xs truncate">{userEmail}</p>}
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-1.5 rounded-md text-white/60 hover:text-white hover:bg-white/10 text-xs transition-colors"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
