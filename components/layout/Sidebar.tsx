'use client'

import Link from 'next/link'
import { Logo } from '@/components/shared/Logo'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Users, CreditCard, FileText,
  Receipt, MessageSquare, Settings, GraduationCap,
  LogOut, ChevronLeft, ChevronRight, X
} from 'lucide-react'
import { useUIStore } from '@/store/ui-store'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/students', label: 'Students', icon: Users },
  { href: '/fees', label: 'Fee Management', icon: CreditCard },
  { href: '/invoices', label: 'Invoices', icon: FileText },
  { href: '/payments', label: 'Payment Tracker', icon: Receipt },
  { href: '/reminders', label: 'WhatsApp Reminders', icon: MessageSquare },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const { collapsed, mobileOpen, toggleCollapsed, setMobileOpen } = useUIStore()

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 h-[100dvh] bg-[#1e2235] flex flex-col transition-all duration-300 ease-in-out shadow-2xl overflow-hidden',
          collapsed ? 'w-[72px]' : 'w-64',
          // Mobile
          'lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className={cn('flex items-center px-4 py-5 border-b border-white/10 relative', collapsed ? 'justify-center' : '')}>
          <div className="flex-shrink-0">
            <Logo 
              containerClassName="w-9 h-9 rounded-full shadow-sm border border-white/20" 
              width={36} 
              height={36} 
            />
          </div>
          <div className={cn("overflow-hidden transition-all duration-300 whitespace-nowrap flex flex-col justify-center pl-3", collapsed ? "w-0 opacity-0 pl-0" : "w-[200px] opacity-100")}>
            <div className="text-white font-bold text-sm leading-tight">Bikash Educational Institution</div>
            <div className="text-white/50 text-[10px] uppercase tracking-widest">Management System</div>
          </div>
          {/* Mobile close */}
          {!collapsed && (
            <button onClick={() => setMobileOpen(false)} className="absolute right-4 lg:hidden text-white/50 hover:text-white bg-[#1e2235]">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto scrollbar-thin">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                title={collapsed ? label : undefined}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group',
                  active
                    ? 'bg-brand-300 text-gray-900 shadow-md shadow-brand-300/30'
                    : 'text-white/60 hover:text-white hover:bg-white/8',
                  collapsed && 'justify-center px-0'
                )}
              >
                <Icon className={cn('w-4.5 h-4.5 flex-shrink-0', active ? 'text-gray-900' : 'text-white/50 group-hover:text-white')} size={18} />
                <span className={cn("whitespace-nowrap transition-all duration-300 overflow-hidden", collapsed ? "w-0 opacity-0" : "w-[160px] opacity-100")}>
                  {label}
                </span>
              </Link>
            )
          })}
        </nav>

        {/* User + Collapse */}
        <div className="border-t border-white/10 p-3 space-y-2">
          <div className="flex items-center gap-2 px-2 py-2 rounded-lg bg-white/5 overflow-hidden">
            <div className="w-7 h-7 rounded-full bg-brand-300 flex items-center justify-center text-xs font-bold text-gray-900 flex-shrink-0">
              {session?.user?.name?.[0]?.toUpperCase() ?? 'A'}
            </div>
            <div className={cn("flex-1 transition-all duration-300 overflow-hidden", collapsed ? "w-0 opacity-0" : "w-[150px] opacity-100")}>
              <div className="text-white text-xs font-medium truncate">{session?.user?.name ?? 'Admin'}</div>
              <div className="text-white/40 text-[10px] truncate">{session?.user?.email}</div>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className={cn(
              'flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-white/60 hover:text-rose-400 hover:bg-rose-500/10 transition-all',
              collapsed && 'justify-center'
            )}
          >
            <LogOut size={16} />
            <span className={cn("whitespace-nowrap overflow-hidden transition-all duration-300", collapsed ? "w-0 opacity-0" : "w-[100px] opacity-100")}>Logout</span>
          </button>
          {/* Collapse toggle (desktop / mobile) */}
          <button
            onClick={toggleCollapsed}
            className={cn("flex items-center gap-2 w-full px-3 py-1.5 rounded-lg text-xs text-white/30 hover:text-white/60 transition-all", collapsed && "justify-center")}
          >
            {collapsed ? <ChevronRight size={14} /> : <><ChevronLeft size={14} /><span>Collapse</span></>}
          </button>
        </div>
      </aside>
    </>
  )
}
