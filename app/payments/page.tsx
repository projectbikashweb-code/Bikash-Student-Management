'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AppLayout } from '@/components/layout/AppLayout'
import { StatCard } from '@/components/shared/StatCard'
import { EmptyState } from '@/components/shared/EmptyState'
import { TableSkeleton } from '@/components/shared/SkeletonLoader'
import { PaymentModeBadge } from '@/components/shared/StatusBadge'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Receipt, TrendingUp, Smartphone, Banknote, Download, ChevronLeft, ChevronRight } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function PaymentsPage() {
  const [page, setPage] = useState(1)
  const [filterMode, setFilterMode] = useState('')
  const [filterFrom, setFilterFrom] = useState('')
  const [filterTo, setFilterTo] = useState('')

  const params = new URLSearchParams({ page: String(page), limit: '20', mode: filterMode, from: filterFrom, to: filterTo })

  const { data, isLoading } = useQuery({
    queryKey: ['payments', page, filterMode, filterFrom, filterTo],
    queryFn: async () => {
      const res = await fetch(`/api/payments?${params}`)
      return res.json()
    },
  })

  // Fetch true summaries from backend
  const payments = data?.payments ?? []
  const totalThisMonth = data?.summary?.totalThisMonth ?? 0
  const totalUPI = data?.summary?.totalUPI ?? 0
  const totalCash = data?.summary?.totalCash ?? 0

  // Build monthly chart from true backend aggregations
  const chartData = data?.summary?.monthlyData ?? []

  const exportCSV = () => {
    window.open(`/api/payments?${params}&export=csv`, '_blank')
  }

  return (
    <AppLayout title="Payment Tracker">
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <StatCard title="This Month" value={formatCurrency(totalThisMonth)} icon={TrendingUp} color="green" />
        <StatCard title="Via UPI" value={formatCurrency(totalUPI)} icon={Smartphone} color="purple" />
        <StatCard title="Via Cash" value={formatCurrency(totalCash)} icon={Banknote} color="amber" />
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm mb-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Payment Collection Overview</h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={chartData} barSize={24}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: any) => formatCurrency(v)} contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }} />
              <Bar dataKey="amount" fill="#10b981" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Filters + Export */}
      <div className="flex flex-wrap gap-3 mb-4">
        <select value={filterMode} onChange={e => { setFilterMode(e.target.value); setPage(1) }} className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-600 outline-none">
          <option value="">All Modes</option>
          {['CASH', 'UPI', 'ONLINE', 'CHEQUE'].map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <input type="date" value={filterFrom} onChange={e => { setFilterFrom(e.target.value); setPage(1) }} className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-600 outline-none" />
        <input type="date" value={filterTo} onChange={e => { setFilterTo(e.target.value); setPage(1) }} className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-600 outline-none" />
        <div className="flex-1" />
        <button onClick={exportCSV} className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors">
          <Download size={15} /> Export CSV
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                {['Date', 'Student', 'Amount', 'Mode', 'Month', 'Received By', 'Notes'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} className="p-5"><TableSkeleton rows={10} cols={6} /></td></tr>
              ) : payments.length === 0 ? (
                <tr><td colSpan={7}><EmptyState icon={Receipt} title="No payments recorded" description="Payment records will appear here" /></td></tr>
              ) : payments.map((p: any) => (
                <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50/30 transition-colors">
                  <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{formatDate(p.paymentDate)}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-800">{p.student?.name}</div>
                    <div className="text-xs text-gray-400">{p.student?.class}</div>
                  </td>
                  <td className="px-4 py-3 font-semibold text-emerald-600 whitespace-nowrap">{formatCurrency(p.amountPaid)}</td>
                  <td className="px-4 py-3"><PaymentModeBadge mode={p.paymentMode} /></td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{p.feeRecord?.month ?? '-'}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{p.receivedBy ?? '-'}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{p.notes ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data && data.pages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50/30">
            <span className="text-xs text-gray-400">{data.total} payments</span>
            <div className="flex items-center gap-1">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40"><ChevronLeft size={16} /></button>
              <span className="text-xs text-gray-600 px-2">Page {page} of {data.pages}</span>
              <button disabled={page === data.pages} onClick={() => setPage(p => p + 1)} className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40"><ChevronRight size={16} /></button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
