'use client'

import { useState } from 'react'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'

import { useUIStore } from '@/store/ui-store'
import { cn } from '@/lib/utils'

interface AppLayoutProps {
  title: string
  children: React.ReactNode
}

export function AppLayout({ title, children }: AppLayoutProps) {
  const { collapsed, setMobileOpen } = useUIStore()

  return (
    <div className="flex w-full min-h-screen bg-gray-50/50 overflow-x-hidden">
      <Sidebar />
      <div 
        className={cn(
          "flex-1 flex flex-col transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] min-w-0 w-full ml-0",
          collapsed ? "lg:ml-[72px]" : "lg:ml-[256px]"
        )}
      >
        <TopBar title={title} onMenuClick={() => setMobileOpen(true)} />
        <main className="p-4 md:p-6 animate-fade-in flex-1">
          {children}
        </main>
      </div>
    </div>
  )
}
