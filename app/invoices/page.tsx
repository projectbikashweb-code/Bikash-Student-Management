'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AppLayout } from '@/components/layout/AppLayout'
import { InvoicePreview } from '@/components/invoices/InvoicePreview'
import { EmptyState } from '@/components/shared/EmptyState'
import { TableSkeleton } from '@/components/shared/SkeletonLoader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { formatCurrency, formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import { Plus, FileText, Eye, Trash2, ChevronLeft, ChevronRight, X, Loader2 } from 'lucide-react'

export default function InvoicesPage() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [genOpen, setGenOpen] = useState(false)
  const [previewInvoice, setPreviewInvoice] = useState<any>(null)
  const [genStudentId, setGenStudentId] = useState('')
  const [genFeeId, setGenFeeId] = useState('')
  const [genRemarks, setGenRemarks] = useState('')
  const [genLoading, setGenLoading] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['invoices', page],
    queryFn: async () => {
      const res = await fetch(`/api/invoices?page=${page}&limit=20`)
      return res.json()
    },
  })

  const { data: students } = useQuery({
    queryKey: ['students-simple'],
    queryFn: async () => {
      const res = await fetch('/api/students?limit=100')
      const d = await res.json()
      return d.students ?? []
    },
    enabled: genOpen,
  })

  const { data: feesForStudent } = useQuery({
    queryKey: ['fees-for-student', genStudentId],
    queryFn: async () => {
      const res = await fetch(`/api/fees?studentId=${genStudentId}&limit=50`)
      const d = await res.json()
      return d.records ?? []
    },
    enabled: !!genStudentId,
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/invoices/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed')
    },
    onSuccess: () => { toast.success('Invoice deleted'); qc.invalidateQueries({ queryKey: ['invoices'] }) },
    onError: () => toast.error('Failed to delete'),
  })

  const handleGenerate = async () => {
    if (!genStudentId || !genFeeId) return toast.error('Please select student and fee record')
    setGenLoading(true)
    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: genStudentId, feeRecordId: genFeeId, remarks: genRemarks }),
      })
      const data = await res.json()
      if (!res.ok) {
        const msg = data?.error ?? 'Failed to generate invoice'
        const meta = data?.meta ? JSON.stringify(data.meta) : ''
        toast.error(`${msg}${meta ? ` — ${meta}` : ''}`)
        return
      }
      toast.success(`Invoice ${data.invoiceNumber} generated`)
      qc.invalidateQueries({ queryKey: ['invoices'] })
      setGenOpen(false)
      setPreviewInvoice(data)
    } catch (err) {
      toast.error('Network error — check console')
    } finally {
      setGenLoading(false)
    }
  }

  return (
    <AppLayout title="Invoices">
      <div className="flex justify-end mb-5">
        <button onClick={() => setGenOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-brand-300 text-gray-900 rounded-xl text-sm font-medium hover:bg-brand-400 transition-colors">
          <Plus size={16} /> Generate Invoice
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                {['Invoice No.', 'Student', 'Month', 'Total', 'Paid', 'Issued', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={8} className="p-5"><TableSkeleton rows={10} cols={7} /></td></tr>
              ) : data?.invoices?.length === 0 ? (
                <tr><td colSpan={8}><EmptyState icon={FileText} title="No invoices yet" description="Generate your first invoice from a fee record" /></td></tr>
              ) : data?.invoices?.map((inv: any) => (
                <tr key={inv.id} className="border-b border-gray-50 hover:bg-gray-50/30 transition-colors">
                  <td className="px-4 py-3 font-semibold text-gray-800">{inv.invoiceNumber}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-800">{inv.student?.name}</div>
                    <div className="text-xs text-gray-400">{inv.student?.class}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{inv.feeRecord?.month}</td>
                  <td className="px-4 py-3 font-semibold text-gray-800">{formatCurrency(inv.totalAmount)}</td>
                  <td className="px-4 py-3 text-emerald-600 font-medium">{formatCurrency(inv.paidAmount)}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(inv.issuedAt)}</td>
                  <td className="px-4 py-3"><StatusBadge status={inv.feeRecord?.status ?? 'PENDING'} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setPreviewInvoice(inv)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
                        <Eye size={14} />
                      </button>
                      <button onClick={() => deleteMutation.mutate(inv.id)} className="p-1.5 rounded-lg hover:bg-rose-50 text-gray-400 hover:text-rose-600 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data && data.pages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50/30">
            <span className="text-xs text-gray-400">{data.total} invoices</span>
            <div className="flex items-center gap-1">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40"><ChevronLeft size={16} /></button>
              <span className="text-xs text-gray-600 px-2">Page {page} of {data.pages}</span>
              <button disabled={page === data.pages} onClick={() => setPage(p => p + 1)} className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40"><ChevronRight size={16} /></button>
            </div>
          </div>
        )}
      </div>

      {/* Generate Invoice Modal */}
      {genOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setGenOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-in p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-gray-800">Generate Invoice</h2>
              <button onClick={() => setGenOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X size={16} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Student *</label>
                <select value={genStudentId} onChange={e => { setGenStudentId(e.target.value); setGenFeeId('') }} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand-400">
                  <option value="">Select student</option>
                  {students?.map((s: any) => <option key={s.id} value={s.id}>{s.name} — {s.class}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Fee Record *</label>
                <select value={genFeeId} onChange={e => setGenFeeId(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand-400" disabled={!genStudentId}>
                  <option value="">Select fee record</option>
                  {feesForStudent?.map((f: any) => <option key={f.id} value={f.id}>{f.month} — {formatCurrency(f.amount)} ({f.status})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Remarks</label>
                <input value={genRemarks} onChange={e => setGenRemarks(e.target.value)} placeholder="Optional remarks" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand-400" />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setGenOpen(false)} className="flex-1 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
                <button onClick={handleGenerate} disabled={genLoading || !genStudentId || !genFeeId} className="flex-1 px-4 py-2 rounded-xl bg-brand-300 text-gray-900 text-sm font-medium hover:bg-brand-400 disabled:opacity-60 flex items-center justify-center gap-2">
                  {genLoading && <Loader2 size={14} className="animate-spin" />}
                  Generate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {previewInvoice && <InvoicePreview invoice={previewInvoice} onClose={() => setPreviewInvoice(null)} />}
    </AppLayout>
  )
}
