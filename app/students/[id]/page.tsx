'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useRouter } from 'next/navigation'
import { AppLayout } from '@/components/layout/AppLayout'
import { StatusBadge, PaymentModeBadge } from '@/components/shared/StatusBadge'
import { StudentForm } from '@/components/students/StudentForm'
import { FeeForm } from '@/components/fees/FeeForm'
import { PaymentModal } from '@/components/fees/PaymentModal'
import { InvoicePreview } from '@/components/invoices/InvoicePreview'
import { formatCurrency, formatDate, getInitials, buildWhatsAppLink, buildReminderMessage } from '@/lib/utils'
import { toast } from 'sonner'
import {
  ArrowLeft, Pencil, Plus, CreditCard, FileText,
  MessageSquare, Phone, MapPin, School, BookOpen, Calendar, Loader2
} from 'lucide-react'

const TABS = ['Fee History', 'Payment History', 'Invoices', 'WhatsApp Reminders']

export default function StudentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const qc = useQueryClient()
  const [tab, setTab] = useState(0)
  const [editOpen, setEditOpen] = useState(false)
  const [feeOpen, setFeeOpen] = useState(false)
  const [paymentFeeId, setPaymentFeeId] = useState<string | null>(null)
  const [previewInvoice, setPreviewInvoice] = useState<any>(null)
  const [genInvoiceLoading, setGenInvoiceLoading] = useState(false)

  const { data: student, isLoading } = useQuery({
    queryKey: ['student', id],
    queryFn: async () => {
      const res = await fetch(`/api/students/${id}`)
      return res.json()
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (d: any) => {
      const res = await fetch(`/api/students/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(d),
      })
      if (!res.ok) throw new Error('Failed to update')
      return res.json()
    },
    onSuccess: () => {
      toast.success('Student updated')
      qc.invalidateQueries({ queryKey: ['student', id] })
      setEditOpen(false)
    },
    onError: () => toast.error('Failed to update student'),
  })

  const generateInvoice = async (feeId: string) => {
    setGenInvoiceLoading(true)
    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: id, feeRecordId: feeId }),
      })
      if (!res.ok) throw new Error()
      const inv = await res.json()
      toast.success(`Invoice ${inv.invoiceNumber} generated`)
      qc.invalidateQueries({ queryKey: ['student', id] })
      setPreviewInvoice(inv)
    } catch {
      toast.error('Failed to generate invoice')
    } finally {
      setGenInvoiceLoading(false)
    }
  }

  const sendReminder = async (fee: any) => {
    if (!student) return
    const balance = Number(fee.amount) - Number(fee.paidAmount)
    const msg = buildReminderMessage(student.name, balance, fee.month, fee.dueDate, '9000000000')
    window.open(buildWhatsAppLink(student.phone, msg), '_blank')
    await fetch('/api/reminders/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId: id, feeRecordId: fee.id, message: msg, status: 'SENT' }),
    })
    qc.invalidateQueries({ queryKey: ['student', id] })
    toast.success('WhatsApp reminder opened')
  }

  if (isLoading) {
    return (
      <AppLayout title="Student Details">
        <div className="animate-pulse space-y-4">
          <div className="h-10 w-32 bg-gray-200 rounded-lg" />
          <div className="h-48 bg-gray-200 rounded-2xl" />
          <div className="h-64 bg-gray-200 rounded-2xl" />
        </div>
      </AppLayout>
    )
  }

  if (!student || student.error) {
    return (
      <AppLayout title="Student Not Found">
        <div className="text-center py-20 text-gray-400">Student not found</div>
      </AppLayout>
    )
  }

  const subjects = Array.isArray(student.subjects) ? student.subjects.join(', ') : ''
  const unpaidFees = student.feeRecords?.filter((f: any) => f.status !== 'PAID') ?? []

  return (
    <AppLayout title="Student Details">
      <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-5 transition-colors group">
        <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
        Back to Students
      </button>

      {/* Profile Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-5">
        <div className="flex flex-col sm:flex-row gap-5 items-start">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-300 to-brand-500 flex items-center justify-center text-2xl font-bold text-gray-900 flex-shrink-0 shadow-lg shadow-brand-300/20">
            {getInitials(student.name)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <h1 className="text-xl font-bold text-gray-900">{student.name}</h1>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${student.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                    {student.isActive ? '● Active' : '● Inactive'}
                  </span>
                  {student.feeRecords?.[0] && <StatusBadge status={student.feeRecords[0].status} />}
                </div>
              </div>
              <button onClick={() => setEditOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                <Pencil size={13} /> Edit Student
              </button>
            </div>
            <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-y-2 gap-x-6 text-sm">
              <div className="flex items-center gap-2 text-gray-500"><School size={14} className="text-gray-400 flex-shrink-0" /><span className="truncate">{student.school}</span></div>
              <div className="flex items-center gap-2 text-gray-500"><BookOpen size={14} className="text-gray-400 flex-shrink-0" /><span>{student.class}</span></div>
              <div className="flex items-center gap-2 text-gray-500"><Phone size={14} className="text-gray-400 flex-shrink-0" /><span>{student.phone}</span></div>
              {student.guardianPhone && <div className="flex items-center gap-2 text-gray-500"><Phone size={14} className="text-gray-400 flex-shrink-0" /><span className="text-xs">Guardian: {student.guardianPhone}</span></div>}
              <div className="flex items-center gap-2 text-gray-500"><Calendar size={14} className="text-gray-400 flex-shrink-0" /><span>Enrolled {formatDate(student.enrolledAt)}</span></div>
              {student.address && <div className="flex items-center gap-2 text-gray-500 col-span-2"><MapPin size={14} className="text-gray-400 flex-shrink-0" /><span className="truncate">{student.address}</span></div>}
              {subjects && <div className="flex items-center gap-2 col-span-2 md:col-span-3"><BookOpen size={14} className="text-brand-400 flex-shrink-0" /><span className="text-brand-600 font-medium text-sm">{subjects}</span></div>}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-5 pt-5 border-t border-gray-100">
          <button onClick={() => setFeeOpen(true)} className="flex items-center gap-1.5 px-3 py-2 bg-brand-300 text-gray-900 rounded-xl text-xs font-medium hover:bg-brand-400 transition-colors">
            <Plus size={13} /> Add Fee Record
          </button>
          {unpaidFees.length > 0 && (
            <button onClick={() => setPaymentFeeId(unpaidFees[0].id)} className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white rounded-xl text-xs font-medium hover:bg-emerald-700 transition-colors">
              <CreditCard size={13} /> Record Payment
            </button>
          )}
          {unpaidFees.length > 0 && (
            <button onClick={() => sendReminder(unpaidFees[0])} className="flex items-center gap-1.5 px-3 py-2 bg-green-500 text-white rounded-xl text-xs font-medium hover:bg-green-600 transition-colors">
              <MessageSquare size={13} /> Send Reminder
            </button>
          )}
          <button onClick={() => setTab(2)} className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl text-xs font-medium hover:bg-gray-50 transition-colors">
            <FileText size={13} /> View Invoices
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-100 overflow-x-auto">
          {TABS.map((t, i) => (
            <button key={t} onClick={() => setTab(i)} className={`px-5 py-3.5 text-sm font-medium whitespace-nowrap transition-colors relative ${tab === i ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
              {t}
              {tab === i && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-300 rounded-t" />}
            </button>
          ))}
        </div>

        <div className="p-5 overflow-x-auto">
          {tab === 0 && (
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Month','Total','Paid','Balance','Due Date','Status','Actions'].map(h => (
                    <th key={h} className="pb-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider pr-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {student.feeRecords?.length === 0 ? (
                  <tr><td colSpan={7} className="py-12 text-center text-sm text-gray-400">No fee records yet. Use "Add Fee Record" to create one.</td></tr>
                ) : student.feeRecords?.map((f: any) => (
                  <tr key={f.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 pr-4 font-medium text-gray-800">{f.month}</td>
                    <td className="py-3 pr-4 text-gray-600">{formatCurrency(f.amount)}</td>
                    <td className="py-3 pr-4 text-emerald-600 font-medium">{formatCurrency(f.paidAmount)}</td>
                    <td className="py-3 pr-4"><span className={Number(f.amount)-Number(f.paidAmount) > 0 ? 'text-rose-500 font-medium' : 'text-gray-400'}>{formatCurrency(Number(f.amount)-Number(f.paidAmount))}</span></td>
                    <td className="py-3 pr-4 text-gray-400 text-xs whitespace-nowrap">{formatDate(f.dueDate)}</td>
                    <td className="py-3 pr-4"><StatusBadge status={f.status} /></td>
                    <td className="py-3">
                      <div className="flex gap-1.5">
                        {f.status !== 'PAID' && <button onClick={() => setPaymentFeeId(f.id)} className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-medium hover:bg-emerald-100">Pay</button>}
                        <button onClick={() => generateInvoice(f.id)} disabled={genInvoiceLoading} className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-200 flex items-center gap-1 disabled:opacity-50">
                          {genInvoiceLoading && <Loader2 size={10} className="animate-spin" />}Invoice
                        </button>
                        {f.status !== 'PAID' && <button onClick={() => sendReminder(f)} className="px-2.5 py-1 bg-green-50 text-green-700 rounded-lg text-xs font-medium hover:bg-green-100">Remind</button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {tab === 1 && (
            <table className="w-full text-sm min-w-[540px]">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Date','Amount','Mode','Received By','Notes'].map(h => (
                    <th key={h} className="pb-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider pr-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {student.paymentHistory?.length === 0 ? (
                  <tr><td colSpan={5} className="py-12 text-center text-sm text-gray-400">No payments recorded yet</td></tr>
                ) : student.paymentHistory?.map((p: any) => (
                  <tr key={p.id} className="hover:bg-gray-50/50">
                    <td className="py-3 pr-4 text-gray-400 text-xs whitespace-nowrap">{formatDate(p.paymentDate)}</td>
                    <td className="py-3 pr-4 font-semibold text-emerald-600">{formatCurrency(p.amountPaid)}</td>
                    <td className="py-3 pr-4"><PaymentModeBadge mode={p.paymentMode} /></td>
                    <td className="py-3 pr-4 text-gray-500 text-sm">{p.receivedBy ?? '—'}</td>
                    <td className="py-3 text-gray-400 text-xs">{p.notes ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {tab === 2 && (
            <table className="w-full text-sm min-w-[520px]">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Invoice No.','Issued','Total','Paid','Balance','Actions'].map(h => (
                    <th key={h} className="pb-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider pr-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {student.invoices?.length === 0 ? (
                  <tr><td colSpan={6} className="py-12 text-center">
                    <p className="text-sm text-gray-400 mb-3">No invoices yet</p>
                    {student.feeRecords?.length > 0 && (
                      <button onClick={() => generateInvoice(student.feeRecords[0].id)} disabled={genInvoiceLoading} className="px-4 py-2 bg-brand-300 text-gray-900 rounded-xl text-xs font-medium hover:bg-brand-400 disabled:opacity-60 mx-auto flex items-center gap-1.5">
                        {genInvoiceLoading && <Loader2 size={12} className="animate-spin" />}Generate First Invoice
                      </button>
                    )}
                  </td></tr>
                ) : student.invoices?.map((inv: any) => (
                  <tr key={inv.id} className="hover:bg-gray-50/50">
                    <td className="py-3 pr-4 font-semibold text-gray-800">{inv.invoiceNumber}</td>
                    <td className="py-3 pr-4 text-gray-400 text-xs whitespace-nowrap">{formatDate(inv.issuedAt)}</td>
                    <td className="py-3 pr-4 font-semibold text-gray-800">{formatCurrency(inv.totalAmount)}</td>
                    <td className="py-3 pr-4 text-emerald-600 font-medium">{formatCurrency(inv.paidAmount)}</td>
                    <td className="py-3 pr-4"><span className={Number(inv.totalAmount)-Number(inv.paidAmount) > 0 ? 'text-rose-500 font-medium' : 'text-gray-400'}>{formatCurrency(Number(inv.totalAmount)-Number(inv.paidAmount))}</span></td>
                    <td className="py-3">
                      <button onClick={() => setPreviewInvoice({ ...inv, student, feeRecord: student.feeRecords?.find((f: any) => f.id === inv.feeRecordId) })} className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-200">Preview</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {tab === 3 && (
            <table className="w-full text-sm min-w-[540px]">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Sent At','Message','Status','Triggered By'].map(h => (
                    <th key={h} className="pb-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider pr-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {student.reminders?.length === 0 ? (
                  <tr><td colSpan={4} className="py-12 text-center">
                    <p className="text-sm text-gray-400 mb-3">No reminders sent yet</p>
                    {unpaidFees.length > 0 && (
                      <button onClick={() => sendReminder(unpaidFees[0])} className="px-4 py-2 bg-green-600 text-white rounded-xl text-xs font-medium hover:bg-green-700 mx-auto flex items-center gap-1.5">
                        <MessageSquare size={12} /> Send First Reminder
                      </button>
                    )}
                  </td></tr>
                ) : student.reminders?.map((r: any) => (
                  <tr key={r.id} className="hover:bg-gray-50/50">
                    <td className="py-3 pr-4 text-gray-400 text-xs whitespace-nowrap">{formatDate(r.sentAt)}</td>
                    <td className="py-3 pr-4 text-gray-500 text-xs max-w-xs truncate">{r.message}</td>
                    <td className="py-3 pr-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${r.status==='SENT'?'bg-emerald-100 text-emerald-700':r.status==='FAILED'?'bg-rose-100 text-rose-700':'bg-gray-100 text-gray-600'}`}>{r.status}</span>
                    </td>
                    <td className="py-3 text-gray-400 text-xs">{r.triggeredBy ?? 'Admin'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <StudentForm open={editOpen} onClose={() => setEditOpen(false)} onSubmit={updateMutation.mutateAsync}
        defaultValues={student ? { ...student, subjects: Array.isArray(student.subjects) ? student.subjects.join(', ') : '', guardianPhone: student.guardianPhone ?? '' } : undefined}
        title="Edit Student" loading={updateMutation.isPending} />
      <FeeForm open={feeOpen} onClose={() => setFeeOpen(false)} studentId={id} onSuccess={() => qc.invalidateQueries({ queryKey: ['student', id] })} />
      {paymentFeeId && (
        <PaymentModal open={!!paymentFeeId} onClose={() => setPaymentFeeId(null)} feeRecordId={paymentFeeId}
          onSuccess={() => { qc.invalidateQueries({ queryKey: ['student', id] }); setPaymentFeeId(null) }} />
      )}
      {previewInvoice && <InvoicePreview invoice={previewInvoice} onClose={() => setPreviewInvoice(null)} />}
    </AppLayout>
  )
}
