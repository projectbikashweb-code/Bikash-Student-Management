'use client'

import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { X, Loader2, Users } from 'lucide-react'
import { format } from 'date-fns'

interface BulkFeeAssignmentProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December']
const YEAR = new Date().getFullYear()
const MONTH_OPTIONS = MONTHS.flatMap(m => [`${m} ${YEAR}`, `${m} ${YEAR - 1}`])
import { CLASS_OPTIONS } from '@/lib/constants/classes'

export function BulkFeeAssignment({ open, onClose, onSuccess }: BulkFeeAssignmentProps) {
  const [filterClass, setFilterClass] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [amount, setAmount] = useState('1500')
  const [month, setMonth] = useState('')
  const [dueDate, setDueDate] = useState(
    format(new Date(new Date().getFullYear(), new Date().getMonth(), 10), 'yyyy-MM-dd')
  )
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  const { data } = useQuery({
    queryKey: ['students-bulk', filterClass],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: '100', ...(filterClass ? { class: filterClass } : {}) })
      const res = await fetch(`/api/students?${params}`)
      const d = await res.json()
      return d.students ?? []
    },
    enabled: open,
  })

  const { data: settings } = useQuery({
    queryKey: ['settings', 'institute'],
    queryFn: async () => {
      const res = await fetch('/api/settings/institute')
      return res.json()
    },
    enabled: open,
  })

  useEffect(() => {
    if (open && settings) {
      const day = settings.defaultDueDate || 10
      setAmount(String(settings.defaultFee || 1500))
      setDueDate(format(new Date(new Date().getFullYear(), new Date().getMonth(), day), 'yyyy-MM-dd'))
    } else if (open) {
      setDueDate(format(new Date(new Date().getFullYear(), new Date().getMonth(), 10), 'yyyy-MM-dd'))
    }
  }, [open, settings])

  const students = data ?? []

  const toggleAll = () =>
    setSelectedIds(s => s.length === students.length ? [] : students.map((st: any) => st.id))
  const toggle = (id: string) =>
    setSelectedIds(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])

  const handleSubmit = async () => {
    if (!selectedIds.length) return toast.error('Select at least one student')
    if (!month) return toast.error('Select a month')
    if (!amount || Number(amount) <= 0) return toast.error('Enter a valid amount')
    setLoading(true)
    try {
      const res = await fetch('/api/fees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bulk: true, studentIds: selectedIds, amount: Number(amount), dueDate, month, notes }),
      })
      if (!res.ok) throw new Error()
      const d = await res.json()
      toast.success(`Created ${d.created} fee records`)
      onSuccess?.()
      onClose()
      setSelectedIds([])
    } catch {
      toast.error('Failed to assign fees')
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-fade-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-gray-500" />
            <h2 className="text-base font-semibold text-gray-800">Bulk Fee Assignment</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X size={16} /></button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {/* Fee details */}
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Month *</label>
              <select value={month} onChange={e => setMonth(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand-400">
                <option value="">Select month</option>
                {MONTH_OPTIONS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Amount (₹) *</label>
              <input value={amount} onChange={e => setAmount(e.target.value)} type="number" min="0"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Due Date *</label>
              <input value={dueDate} onChange={e => setDueDate(e.target.value)} type="date"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
              <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand-400" />
            </div>
          </div>

          {/* Filter & student list */}
          <div className="flex items-center gap-3 mb-3">
            <select value={filterClass} onChange={e => { setFilterClass(e.target.value); setSelectedIds([]) }}
              className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-sm text-gray-600 outline-none">
              <option value="">All Classes</option>
              {CLASS_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <span className="text-xs text-gray-400">{students.length} students</span>
            <button onClick={toggleAll} className="ml-auto text-xs text-gray-600 hover:underline font-medium">
              {selectedIds.length === students.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>

          <div className="border border-gray-100 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
            {students.map((s: any) => (
              <label key={s.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0">
                <input type="checkbox" checked={selectedIds.includes(s.id)} onChange={() => toggle(s.id)}
                  className="rounded text-gray-600" />
                <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600 flex-shrink-0">
                  {s.name[0]}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-gray-800 truncate">{s.name}</div>
                  <div className="text-xs text-gray-400">{s.class} · {s.phone}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
          <span className="text-sm text-gray-500">
            {selectedIds.length > 0
              ? <><span className="font-semibold text-gray-900">{selectedIds.length}</span> students selected</>
              : 'No students selected'}
          </span>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">
              Cancel
            </button>
            <button onClick={handleSubmit} disabled={loading || !selectedIds.length}
              className="px-4 py-2 rounded-xl bg-brand-300 text-gray-900 text-sm font-medium hover:bg-brand-400 disabled:opacity-60 flex items-center gap-2">
              {loading && <Loader2 size={13} className="animate-spin" />}
              Assign Fees
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
