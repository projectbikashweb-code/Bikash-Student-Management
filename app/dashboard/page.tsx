'use client'

import { useQuery } from '@tanstack/react-query'
import { AppLayout } from '@/components/layout/AppLayout'
import { StatCard } from '@/components/shared/StatCard'
import { CardSkeleton, TableSkeleton } from '@/components/shared/SkeletonLoader'
import { StatusBadge, PaymentModeBadge } from '@/components/shared/StatusBadge'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Users, TrendingUp, AlertCircle, Clock } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'

const PIE_COLORS = ['#10b981', '#ef4444', '#f59e0b']

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard/stats')
      return res.json()
    },
  })

  return (
    <AppLayout title="Dashboard">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
        ) : (
          <>
            <StatCard title="Total Students" value={data?.totalStudents ?? 0} icon={Users} color="blue" subtitle={`${data?.activeStudents ?? 0} active`} />
            <StatCard title="Collected This Month" value={formatCurrency(data?.collectedThisMonth)} icon={TrendingUp} color="green" />
            <StatCard title="Pending Fees" value={formatCurrency(data?.pendingFees)} icon={AlertCircle} color="rose" />
            <StatCard title="Partial Payments" value={data?.partialCount ?? 0} icon={Clock} color="amber" subtitle="Students" />
          </>
        )}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Monthly Fee Collection (Last 6 Months)</h3>
          {isLoading ? (
            <div className="h-52 bg-gray-100 rounded-xl animate-pulse" />
          ) : (
            <div className="w-full overflow-hidden">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data?.monthlyData ?? []} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: any) => formatCurrency(v)} labelStyle={{ color: '#374151', fontWeight: 600 }} contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }} />
                  <Bar dataKey="amount" fill="#b5c71a" stroke="#8e9e10" strokeWidth={1} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Pie Chart */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Fee Status Distribution</h3>
          {isLoading ? (
            <div className="h-52 bg-gray-100 rounded-xl animate-pulse" />
          ) : (
            <div className="w-full overflow-hidden">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={data?.statusCounts?.map((s: any) => ({ name: s.status, value: s._count })) ?? []}
                    cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                    paddingAngle={3} dataKey="value"
                  >
                    {(data?.statusCounts ?? []).map((_: any, i: number) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Pending */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50">
            <h3 className="text-sm font-semibold text-gray-700">Top Pending Fees</h3>
          </div>
          {isLoading ? (
            <div className="p-5"><TableSkeleton rows={5} cols={3} /></div>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full text-sm min-w-[500px]">
                <thead>
                  <tr className="border-b border-gray-50">
                    <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Student</th>
                    <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Amount</th>
                    <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.topPendingStudents ?? []).map((r: any) => (
                    <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3">
                        <div className="font-medium text-gray-800">{r.student?.name}</div>
                        <div className="text-xs text-gray-400">{r.student?.class}</div>
                      </td>
                      <td className="px-5 py-3 font-semibold text-gray-800">{formatCurrency(r.amount)}</td>
                      <td className="px-5 py-3"><StatusBadge status={r.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Payments */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50">
            <h3 className="text-sm font-semibold text-gray-700">Recent Payments</h3>
          </div>
          {isLoading ? (
            <div className="p-5"><TableSkeleton rows={5} cols={3} /></div>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full text-sm min-w-[500px]">
                <thead>
                  <tr className="border-b border-gray-50">
                    <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Student</th>
                    <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Amount</th>
                    <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Mode</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.recentPayments ?? []).map((p: any) => (
                    <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3">
                        <div className="font-medium text-gray-800">{p.student?.name}</div>
                        <div className="text-xs text-gray-400">{formatDate(p.paymentDate)}</div>
                      </td>
                      <td className="px-5 py-3 font-semibold text-emerald-600">{formatCurrency(p.amountPaid)}</td>
                      <td className="px-5 py-3"><PaymentModeBadge mode={p.paymentMode} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
