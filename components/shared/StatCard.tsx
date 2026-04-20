import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  trend?: string
  trendUp?: boolean
  color?: 'blue' | 'green' | 'amber' | 'rose' | 'purple'
  subtitle?: string
}

const colorMap = {
  blue: { bg: 'bg-brand-50', icon: 'bg-brand-600', text: 'text-brand-700' },
  green: { bg: 'bg-emerald-50', icon: 'bg-emerald-600', text: 'text-emerald-600' },
  amber: { bg: 'bg-amber-50', icon: 'bg-amber-500', text: 'text-amber-600' },
  rose: { bg: 'bg-rose-50', icon: 'bg-rose-600', text: 'text-rose-600' },
  purple: { bg: 'bg-purple-50', icon: 'bg-purple-600', text: 'text-purple-600' },
}

export function StatCard({ title, value, icon: Icon, trend, trendUp, color = 'blue', subtitle }: StatCardProps) {
  const colors = colorMap[color]
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{title}</p>
          <p className="mt-1.5 text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="mt-0.5 text-xs text-gray-400">{subtitle}</p>}
          {trend && (
            <p className={cn('mt-1 text-xs font-medium', trendUp ? 'text-emerald-600' : 'text-rose-500')}>
              {trendUp ? '↑' : '↓'} {trend}
            </p>
          )}
        </div>
        <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0', colors.icon)}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  )
}
