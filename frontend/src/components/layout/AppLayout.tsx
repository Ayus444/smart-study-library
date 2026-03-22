'use client'
import { useState, ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, Grid3x3, CreditCard, CalendarCheck,
  Bell, LogOut, BookOpen, ChevronLeft, ChevronRight, Menu, X, Moon, Sun
} from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { notificationsAPI } from '@/lib/api'
import { useEffect } from 'react'

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/students', icon: Users, label: 'Students' },
  { href: '/seats', icon: Grid3x3, label: 'Seat Map' },
  { href: '/payments', icon: CreditCard, label: 'Payments' },
  { href: '/attendance', icon: CalendarCheck, label: 'Attendance' },
]

export default function AppLayout({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [dark, setDark] = useState(false)
  const [alertCount, setAlertCount] = useState(0)
  const pathname = usePathname()
  const { user, logout } = useAuth()

  useEffect(() => {
    notificationsAPI.getAll().then(r => {
      setAlertCount(r.data.counts.overdue + r.data.counts.dueSoon)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-white text-sm font-bold"
          style={{ background: 'linear-gradient(135deg, var(--saffron), #c74608)' }}>
          <BookOpen size={16} />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <div className="font-display font-bold text-sm leading-tight" style={{ color: 'var(--text-primary)' }}>Smart Study</div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Abhyasika System</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(({ href, icon: Icon, label }) => (
          <Link key={href} href={href} onClick={() => setMobileOpen(false)}
            className={`nav-link ${pathname.startsWith(href) ? 'active' : ''} ${collapsed ? 'justify-center px-2' : ''}`}>
            <Icon size={18} className="flex-shrink-0" />
            {!collapsed && <span>{label}</span>}
            {!collapsed && href === '/dashboard' && alertCount > 0 && (
              <span className="ml-auto badge badge-overdue text-xs">{alertCount}</span>
            )}
          </Link>
        ))}
      </nav>

      {/* Bottom */}
      <div className="p-3 border-t space-y-1" style={{ borderColor: 'var(--border)' }}>
        <button onClick={() => setDark(d => !d)}
          className={`nav-link w-full ${collapsed ? 'justify-center px-2' : ''}`}>
          {dark ? <Sun size={18} /> : <Moon size={18} />}
          {!collapsed && <span>{dark ? 'Light Mode' : 'Dark Mode'}</span>}
        </button>
        {!collapsed && user && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
              style={{ background: 'var(--saffron)' }}>
              {user.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>{user.name}</div>
              <div className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{user.role}</div>
            </div>
          </div>
        )}
        <button onClick={logout}
          className={`nav-link w-full hover:text-red-500 ${collapsed ? 'justify-center px-2' : ''}`}>
          <LogOut size={18} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      {/* Desktop Sidebar */}
      <aside className={`hidden md:flex flex-col transition-all duration-300 flex-shrink-0 border-r`}
        style={{ width: collapsed ? 64 : 224, background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <SidebarContent />
        <button
          onClick={() => setCollapsed(c => !c)}
          className="absolute left-0 top-1/2 -translate-y-1/2 translate-x-full w-5 h-10 rounded-r-md flex items-center justify-center text-xs z-10"
          style={{ background: 'var(--border)', color: 'var(--text-muted)', marginLeft: collapsed ? 64 : 224, transition: 'margin 0.3s' }}>
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </aside>

      {/* Mobile Sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 flex flex-col" style={{ background: 'var(--bg-card)' }}>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 border-b" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <button onClick={() => setMobileOpen(true)} className="p-1">
            <Menu size={20} style={{ color: 'var(--text-primary)' }} />
          </button>
          <div className="font-display font-bold text-sm" style={{ color: 'var(--saffron)' }}>📚 Smart Study</div>
          {alertCount > 0 && <span className="badge badge-overdue">{alertCount}</span>}
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
