'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AppLayout } from '@/components/layout/AppLayout'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { EmptyState } from '@/components/shared/EmptyState'
import { TableSkeleton } from '@/components/shared/SkeletonLoader'
import { FeeForm } from '@/components/fees/FeeForm'
import { PaymentModal } from '@/components/fees/PaymentModal'
import { formatCurrency, formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import { Plus, CreditCard, ChevronLeft, ChevronRight, CheckCircle, Users, Trash } from 'lucide-react'
import { BulkFeeAssignment } from '@/components/fees/BulkFeeAssignment'

const MONTHS = ['January 2025','February 2025','March 2025','April 2025','May 2025','June 2025','July 2025','August 2025','September 2025','October 2025','November 2025','December 2025']
import { CLASS_OPTIONS } from '@/lib/constants/classes'

export default function FeesPage() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [filterMonth, setFilterMonth] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterClass, setFilterClass] = useState('')
  const [feeOpen, setFeeOpen] = useState(false)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [paymentFeeId, setPaymentFeeId] = useState<string | null>(null)

  const params = new URLSearchParams({ page: String(page), limit: '20', month: filterMonth, status: filterStatus, class: filterClass })

  const { data, isLoading } = useQuery({
    queryKey: ['fees', page, filterMonth, filterStatus, filterClass],
    queryFn: async () => {
      const res = await fetch(`/api/fees?${params}`)
      return res.json()
    },
  })

  const markPaidMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/fees/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'PAID', paidDate: new Date() }) })
      if (!res.ok) throw new Error('Failed')
    },
    onSuccess: () => { toast.success('Marked as paid'); qc.invalidateQueries({ queryKey: ['fees'] }) },
    onError: () => toast.error('Failed to update'),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/fees/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
    },
    onSuccess: () => { toast.success('Fee record deleted'); qc.invalidateQueries({ queryKey: ['fees'] }) },
    onError: () => toast.error('Check if payments are attached. Only PENDING fees can be deleted.'),
  })

  return (
    <AppLayout title="Fee Management">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <select value={filterMonth} onChange={e => { setFilterMonth(e.target.value); setPage(1) }} className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-600 outline-none">
          <option value="">All Months</option>
          {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1) }} className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-600 outline-none">
          <option value="">All Status</option>
          <option value="PAID">Paid</option>
          <option value="PENDING">Pending</option>
          <option value="PARTIAL">Partial</option>
        </select>
        <select value={filterClass} onChange={e => { setFilterClass(e.target.value); setPage(1) }} className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-600 outline-none">
          <option value="">All Classes</option>
          {CLASS_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <div className="flex-1" />
        <button onClick={() => setBulkOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
          <Users size={16} /> Bulk Assign
        </button>
        <button onClick={() => setFeeOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-brand-300 text-gray-900 rounded-xl text-sm font-medium hover:bg-brand-400 transition-colors">
          <Plus size={16} /> Add Fee Record
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                {['Student', 'Class', 'Month', 'Total', 'Paid', 'Balance', 'Due Date', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={9} className="p-5"><TableSkeleton rows={10} cols={8} /></td></tr>
              ) : data?.records?.length === 0 ? (
                <tr><td colSpan={9}><EmptyState icon={CreditCard} title="No fee records" description="Add fee records to track payments" /></td></tr>
              ) : data?.records?.map((r: any) => (
                <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-800">{r.student?.name}</div>
                    <div className="text-xs text-gray-400">{r.student?.phone}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{r.student?.class}</td>
                  <td className="px-4 py-3 font-medium text-gray-700 whitespace-nowrap">{r.month}</td>
                  <td className="px-4 py-3 font-semibold text-gray-800 whitespace-nowrap">{formatCurrency(r.amount)}</td>
                  <td className="px-4 py-3 text-emerald-600 font-medium whitespace-nowrap">{formatCurrency(r.paidAmount)}</td>
                  <td className="px-4 py-3 text-rose-500 font-medium whitespace-nowrap">{formatCurrency(Number(r.amount) - Number(r.paidAmount))}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{formatDate(r.dueDate)}</td>
                  <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 flex-nowrap">
                      {r.status !== 'PAID' && (
                        <>
                          <button onClick={() => setPaymentFeeId(r.id)} title="Record Payment" className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors text-xs">
                            <CreditCard size={13} />
                          </button>
                          <button onClick={() => markPaidMutation.mutate(r.id)} title="Mark as Paid" className="p-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
                            <CheckCircle size={13} />
                          </button>
                        </>
                      )}
                      {r.status === 'PENDING' && (
                        <button 
                          onClick={() => {
                            if (window.confirm('Are you sure you want to delete this pending fee completely?')) {
                              deleteMutation.mutate(r.id)
                            }
                          }}
                          title="Delete Fee" 
                          className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
                        >
                          <Trash size={13} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {data && data.pages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50/30">
            <span className="text-xs text-gray-400">{data.total} records total</span>
            <div className="flex items-center gap-1">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40"><ChevronLeft size={16} /></button>
              <span className="text-xs text-gray-600 px-2">Page {page} of {data.pages}</span>
              <button disabled={page === data.pages} onClick={() => setPage(p => p + 1)} className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40"><ChevronRight size={16} /></button>
            </div>
          </div>
        )}
      </div>

      <FeeForm open={feeOpen} onClose={() => setFeeOpen(false)} onSuccess={() => qc.invalidateQueries({ queryKey: ['fees'] })} />
      <BulkFeeAssignment open={bulkOpen} onClose={() => setBulkOpen(false)} onSuccess={() => qc.invalidateQueries({ queryKey: ['fees'] })} />
      {paymentFeeId && <PaymentModal open={!!paymentFeeId} onClose={() => setPaymentFeeId(null)} feeRecordId={paymentFeeId} onSuccess={() => setPaymentFeeId(null)} />}
    </AppLayout>
  )
}
