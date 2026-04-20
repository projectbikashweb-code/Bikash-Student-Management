'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Menu, Search, Bell, X } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { formatCurrency } from '@/lib/utils'

interface TopBarProps {
  title: string
  onMenuClick: () => void
}

export function TopBar({ title, onMenuClick }: TopBarProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const { data: searchResults } = useQuery({
    queryKey: ['search', searchQuery],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 2) return []
      const res = await fetch(`/api/students/search?q=${encodeURIComponent(searchQuery)}`)
      return res.json()
    },
    enabled: searchQuery.length >= 2,
  })

  const { data: notifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard/stats')
      const data = await res.json()
      return data.dueSoon || []
    },
  })

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <header className="h-14 bg-white border-b border-gray-100 flex items-center gap-3 px-4 sticky top-0 z-30">
      <button
        onClick={onMenuClick}
        className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
      >
        <Menu size={20} />
      </button>

      <h1 className="font-semibold text-gray-800 text-base hidden sm:block">{title}</h1>

      <div className="flex-1" />

      {/* Search */}
      <div ref={searchRef} className="relative">
        {searchOpen ? (
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 w-64">
            <Search size={15} className="text-gray-400 flex-shrink-0" />
            <input
              autoFocus
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setShowResults(true) }}
              placeholder="Search students..."
              className="bg-transparent text-sm outline-none w-full text-gray-700 placeholder-gray-400"
            />
            <button onClick={() => { setSearchOpen(false); setSearchQuery(''); setShowResults(false) }}>
              <X size={14} className="text-gray-400" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setSearchOpen(true)}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
          >
            <Search size={18} />
          </button>
        )}

        {/* Search results dropdown */}
        {showResults && searchResults && searchResults.length > 0 && (
          <div className="absolute top-full right-0 mt-1 w-72 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-50">
            {searchResults.map((s: any) => (
              <button
                key={s.id}
                onClick={() => { router.push(`/students/${s.id}`); setSearchOpen(false); setSearchQuery(''); setShowResults(false) }}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 text-left"
              >
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600 flex-shrink-0">
                  {s.name[0]}
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-800">{s.name}</div>
                  <div className="text-xs text-gray-400">{s.class} · {s.phone}</div>
                </div>
              </button>
            ))}
          </div>
        )}
        {showResults && searchQuery.length >= 2 && searchResults?.length === 0 && (
          <div className="absolute top-full right-0 mt-1 w-64 bg-white rounded-xl shadow-xl border border-gray-100 py-4 z-50 text-center text-sm text-gray-400">
            No students found
          </div>
        )}
      </div>

      {/* Notifications */}
      <div className="relative">
        <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 relative">
          <Bell size={18} />
          {notifications && notifications.length > 0 && (
            <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-rose-500 rounded-full" />
          )}
        </button>
      </div>

      {/* Avatar */}
      <div className="w-8 h-8 rounded-full bg-[#1e2235] flex items-center justify-center text-xs font-bold text-white ring-2 ring-brand-300/40">
        A
      </div>
    </header>
  )
}
