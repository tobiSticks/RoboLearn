'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Bot, LayoutDashboard, BookOpen, MessageSquare, LogOut, User, Search, Trophy, Users, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import type { User as SupabaseUser } from '@supabase/supabase-js'

const navItems = [
  { href: '/dashboard',   icon: LayoutDashboard, label: 'Dashboard'   },
  { href: '/learn',       icon: BookOpen,        label: 'Learn'       },
  { href: '/tutor',       icon: MessageSquare,   label: 'AI Tutor'    },
  { href: '/leaderboard', icon: Trophy,          label: 'Leaderboard' },
  { href: '/community',   icon: Users,           label: 'Community'   },
]

type Props = { user: SupabaseUser; onClose?: () => void }

export default function Sidebar({ user, onClose }: Props) {
  const pathname = usePathname()
  const router   = useRouter()
  const supabase = createClient()
  const [query, setQuery] = useState('')

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
      onClose?.()
    }
  }

  function handleNavClick() {
    onClose?.()
  }

  return (
    <aside className="w-72 md:w-60 bg-white border-r border-gray-100 flex flex-col h-screen">
      {/* Logo + mobile close */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2 font-semibold text-gray-900">
          <Bot className="w-5 h-5 text-blue-600" /> RoboLearn
        </div>
        {onClose && (
          <button onClick={onClose}
            className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        )}
      </div>

      {/* Search */}
      <div className="px-3 pt-3">
        <form onSubmit={handleSearch}>
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus-within:border-blue-300 focus-within:bg-white transition-colors">
            <Search className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search lessons..."
              className="flex-1 text-sm bg-transparent outline-none text-gray-700 placeholder-gray-400 min-w-0"
            />
          </div>
        </form>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
        {navItems.map(({ href, icon: Icon, label }) => (
          <Link key={href} href={href} onClick={handleNavClick}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              pathname === href || pathname.startsWith(href + '/')
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            )}>
            <Icon className="w-4 h-4" />
            {label}
          </Link>
        ))}
      </nav>

      {/* Ad slot */}
      <div className="px-3 pb-3">
        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-3 text-center">
          <p className="text-[10px] text-gray-400 leading-relaxed">
            Ad — <a href="https://ethicalads.io" target="_blank" rel="noopener noreferrer"
              className="underline hover:text-gray-500">Advertise here</a>
          </p>
        </div>
      </div>

      {/* User */}
      <div className="px-3 py-4 border-t border-gray-100 space-y-1">
        <Link href="/profile" onClick={handleNavClick}
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
            pathname === '/profile'
              ? 'bg-blue-50 text-blue-700 font-medium'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          )}>
          <User className="w-4 h-4" />
          <span className="truncate">{user.email}</span>
        </Link>
        <button onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors">
          <LogOut className="w-4 h-4" /> Sign out
        </button>
      </div>
    </aside>
  )
}
