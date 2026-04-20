'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { feeRecordSchema, FeeRecordFormData } from '@/lib/validations'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { X, Loader2 } from 'lucide-react'
import { format } from 'date-fns'

interface FeeFormProps {
  open: boolean
  onClose: () => void
  studentId?: string
  onSuccess?: () => void
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const currentYear = new Date().getFullYear()
const MONTH_OPTIONS = MONTHS.flatMap(m => [`${m} ${currentYear}`, `${m} ${currentYear - 1}`])

export function FeeForm({ open, onClose, studentId, onSuccess }: FeeFormProps) {
  const qc = useQueryClient()

  const { data: students } = useQuery({
    queryKey: ['students-list'],
    queryFn: async () => {
      const res = await fetch('/api/students?limit=100')
      const d = await res.json()
      return d.students ?? []
    },
    enabled: !studentId,
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FeeRecordFormData>({
    resolver: zodResolver(feeRecordSchema),
    defaultValues: {
      studentId: studentId ?? '',
      dueDate: format(new Date(new Date().getFullYear(), new Date().getMonth(), 10), 'yyyy-MM-dd'),
    },
  })

  useEffect(() => {
    if (open) reset({ studentId: studentId ?? '', dueDate: format(new Date(new Date().getFullYear(), new Date().getMonth(), 10), 'yyyy-MM-dd') })
  }, [open, studentId])

  const mutation = useMutation({
    mutationFn: async (d: FeeRecordFormData) => {
      const res = await fetch('/api/fees', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d) })
      if (!res.ok) throw new Error('Failed to create fee record')
      return res.json()
    },
    onSuccess: () => {
      toast.success('Fee record created')
      qc.invalidateQueries({ queryKey: ['fees'] })
      onSuccess?.()
      onClose()
    },
    onError: () => toast.error('Failed to create fee record'),
  })

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-800">Add Fee Record</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit(d => mutation.mutateAsync(d))} className="p-6 space-y-4">
          {!studentId && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Student *</label>
              <select {...register('studentId')} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand-400">
                <option value="">Select student</option>
                {students?.map((s: any) => <option key={s.id} value={s.id}>{s.name} — {s.class}</option>)}
              </select>
              {errors.studentId && <p className="mt-1 text-xs text-rose-500">{errors.studentId.message}</p>}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Month *</label>
            <select {...register('month')} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand-400">
              <option value="">Select month</option>
              {MONTH_OPTIONS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            {errors.month && <p className="mt-1 text-xs text-rose-500">{errors.month.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Amount (₹) *</label>
            <input {...register('amount')} type="number" min="0" step="0.01" placeholder="1500" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand-400" />
            {errors.amount && <p className="mt-1 text-xs text-rose-500">{errors.amount.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Due Date *</label>
            <input {...register('dueDate')} type="date" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand-400" />
            {errors.dueDate && <p className="mt-1 text-xs text-rose-500">{errors.dueDate.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
            <input {...register('notes')} placeholder="Optional notes" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand-400" />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={mutation.isPending} className="flex-1 px-4 py-2 rounded-xl bg-brand-300 text-gray-900 text-sm font-medium hover:bg-brand-400 disabled:opacity-60 flex items-center justify-center gap-2">
              {mutation.isPending && <Loader2 size={14} className="animate-spin" />}
              Create Record
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
