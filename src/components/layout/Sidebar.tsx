'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LayoutDashboard, Users, ListChecks, Settings } from 'lucide-react'

interface SidebarProps {
  queueCount?: number
}

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/queue', label: 'Outreach Queue', icon: ListChecks, badgeKey: 'queue' },
  { href: '/contacts', label: 'All Contacts', icon: Users },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export default function Sidebar({ queueCount = 0 }: SidebarProps) {
  const pathname = usePathname()

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

      <div className="px-5 py-4 border-t border-white/10">
        <p className="text-white/40 text-xs">Huddle Creative © 2024</p>
      </div>
    </aside>
  )
}
