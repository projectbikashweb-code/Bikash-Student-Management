'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { AppLayout } from '@/components/layout/AppLayout'
import { EmptyState } from '@/components/shared/EmptyState'
import { TableSkeleton } from '@/components/shared/SkeletonLoader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { formatCurrency, formatDate, buildWhatsAppLink, buildReminderMessage } from '@/lib/utils'
import { toast } from 'sonner'
import { MessageSquare, Send, CheckSquare, Square } from 'lucide-react'

const FALLBACK_TEMPLATE = `Dear [Student Name]'s parent, your tuition fee of ₹[Amount] for [Month] at Bikash Educational Institution is due on [Due Date]. Please pay at the earliest. Contact: +918249297170. Thank you.`

export default function RemindersPage() {
  const [tab, setTab] = useState(0)
  const [template, setTemplate] = useState(FALLBACK_TEMPLATE)
  const [templateLoaded, setTemplateLoaded] = useState(false)
  const [selected, setSelected] = useState<string[]>([])
  const qc = useQueryClient()

  const { data: settings } = useQuery({
    queryKey: ['settings-institute'],
    queryFn: async () => {
      const res = await fetch('/api/settings/institute')
      return res.json()
    }
  })

  // Set the dynamic template once settings load
  if (settings && !templateLoaded) {
    setTemplate(`Dear [Student Name]'s parent, your tuition fee of ₹[Amount] for [Month] at ${settings.name} is due on [Due Date]. Please pay at the earliest. Contact: ${settings.phone}. Thank you.`)
    setTemplateLoaded(true)
  }

  const { data: pendingFees, isLoading } = useQuery({
    queryKey: ['pending-fees-reminders'],
    queryFn: async () => {
      const res = await fetch('/api/fees?status=PENDING&limit=50')
      const d = await res.json()
      const partial = await fetch('/api/fees?status=PARTIAL&limit=50')
      const pd = await partial.json()
      return [...(d.records ?? []), ...(pd.records ?? [])]
    },
  })

  const { data: history } = useQuery({
    queryKey: ['reminder-history'],
    queryFn: async () => {
      const res = await fetch('/api/reminders/log')
      return res.json()
    },
  })

  const buildMsg = (fee: any) => {
    return template
      .replace('[Student Name]', fee.student?.name ?? '')
      .replace('₹[Amount]', formatCurrency(Number(fee.amount) - Number(fee.paidAmount)))
      .replace('[Month]', fee.month)
      .replace('[Due Date]', formatDate(fee.dueDate))
  }

  const sendReminder = async (fee: any) => {
    const msg = buildMsg(fee)
    const link = buildWhatsAppLink(fee.student?.phone ?? '', msg)
    window.open(link, '_blank')

    await fetch('/api/reminders/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId: fee.student?.id, feeRecordId: fee.id, message: msg, status: 'SENT' }),
    })
    qc.invalidateQueries({ queryKey: ['reminder-history'] })
    toast.success(`Reminder opened for ${fee.student?.name}`)
  }

  const sendBulk = async () => {
    const toSend = (pendingFees ?? []).filter((f: any) => selected.includes(f.id))
    for (const fee of toSend) {
      await sendReminder(fee)
      await new Promise(r => setTimeout(r, 400))
    }
    setSelected([])
  }

  const toggleSelect = (id: string) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])
  const toggleAll = () => setSelected(s => s.length === (pendingFees?.length ?? 0) ? [] : (pendingFees ?? []).map((f: any) => f.id))

  return (
    <AppLayout title="WhatsApp Reminders">
      <div className="flex gap-2 mb-5 border-b border-gray-200">
        {['Pending Fees', 'Reminder History'].map((t, i) => (
          <button key={t} onClick={() => setTab(i)} className={`px-4 py-2.5 text-sm font-medium transition-colors ${tab === i ? 'border-b-2 border-brand-300 text-gray-900 -mb-px' : 'text-gray-500 hover:text-gray-700'}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 0 && (
        <>
          {/* Message Template */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Message Template</h3>
            <textarea
              value={template}
              onChange={e => setTemplate(e.target.value)}
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-400 resize-none"
            />
            <p className="text-xs text-gray-400 mt-1.5">Variables: [Student Name], ₹[Amount], [Month], [Due Date]</p>
          </div>

          {/* Bulk actions */}
          {selected.length > 0 && (
            <div className="mb-3 flex items-center gap-3 px-4 py-2.5 bg-green-50 border border-green-200 rounded-xl text-sm">
              <span className="text-green-700 font-medium">{selected.length} selected</span>
              <button onClick={sendBulk} className="flex items-center gap-1.5 px-3 py-1 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700">
                <Send size={12} /> Send All ({selected.length})
              </button>
              <button onClick={() => setSelected([])} className="text-xs text-green-600 hover:underline">Clear</button>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="px-4 py-3 w-10">
                      <button onClick={toggleAll} className="text-gray-400 hover:text-gray-700">
                        {selected.length === (pendingFees?.length ?? 0) && selected.length > 0
                          ? <CheckSquare size={16} />
                          : <Square size={16} />}
                      </button>
                    </th>
                    {['Student', 'Class', 'Phone', 'Month', 'Due', 'Balance', 'Status', 'Action'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr><td colSpan={9} className="p-5"><TableSkeleton rows={8} cols={7} /></td></tr>
                  ) : (pendingFees ?? []).length === 0 ? (
                    <tr><td colSpan={9}><EmptyState icon={MessageSquare} title="No pending fees" description="All students are up to date" /></td></tr>
                  ) : (pendingFees ?? []).map((f: any) => (
                    <tr key={f.id} className="border-b border-gray-50 hover:bg-gray-50/30 transition-colors">
                      <td className="px-4 py-3">
                        <button onClick={() => toggleSelect(f.id)} className="text-gray-400 hover:text-gray-700">
                          {selected.includes(f.id) ? <CheckSquare size={16} className="text-gray-700" /> : <Square size={16} />}
                        </button>
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-800">{f.student?.name}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{f.student?.class}</td>
                      <td className="px-4 py-3 text-gray-500">{f.student?.phone}</td>
                      <td className="px-4 py-3 text-gray-600">{f.month}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(f.dueDate)}</td>
                      <td className="px-4 py-3 font-semibold text-rose-600">{formatCurrency(Number(f.amount) - Number(f.paidAmount))}</td>
                      <td className="px-4 py-3"><StatusBadge status={f.status} /></td>
                      <td className="px-4 py-3">
                        <button onClick={() => sendReminder(f)} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-medium hover:bg-green-600 transition-colors whitespace-nowrap">
                          <Send size={11} /> Send
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {tab === 1 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  {['Date', 'Student', 'Month', 'Message', 'Status', 'By'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {!history?.length ? (
                  <tr><td colSpan={6}><EmptyState icon={MessageSquare} title="No reminders sent yet" /></td></tr>
                ) : history.map((r: any) => (
                  <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50/30 transition-colors">
                    <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{formatDate(r.sentAt)}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{r.student?.name}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{r.feeRecord?.month}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs max-w-xs truncate">{r.message}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${r.status === 'SENT' ? 'bg-emerald-100 text-emerald-700' : r.status === 'FAILED' ? 'bg-rose-100 text-rose-700' : 'bg-gray-100 text-gray-600'}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{r.triggeredBy ?? 'Admin'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
