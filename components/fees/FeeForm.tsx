'use client'

import { useState, useRef, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { feeRecordSchema, FeeRecordFormData } from '@/lib/validations'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { X, Loader2, Search, ChevronDown } from 'lucide-react'
import { format } from 'date-fns'

interface FeeFormProps {
  open: boolean
  onClose: () => void
  studentId?: string
  onSuccess?: () => void
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const baseYear = Math.max(2026, new Date().getFullYear())
const MONTH_OPTIONS = MONTHS.flatMap(m => [`${m} ${baseYear}`, `${m} ${baseYear + 1}`])

export function FeeForm({ open, onClose, studentId, onSuccess }: FeeFormProps) {
  const qc = useQueryClient()
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const selectRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(e.target as Node)) {
        setSearchOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const { data: students } = useQuery({
    queryKey: ['students-list'],
    queryFn: async () => {
      const res = await fetch('/api/students?limit=100')
      const d = await res.json()
      return d.students ?? []
    },
    enabled: !studentId && open,
  })

  const { data: specificStudent } = useQuery({
    queryKey: ['student', studentId],
    queryFn: async () => {
      const res = await fetch(`/api/students/${studentId}`)
      return res.json()
    },
    enabled: !!studentId && open,
  })

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<FeeRecordFormData>({
    resolver: zodResolver(feeRecordSchema),
    defaultValues: {
      studentId: studentId ?? '',
      dueDate: format(new Date(new Date().getFullYear(), new Date().getMonth(), 10), 'yyyy-MM-dd'),
    },
  })

  const { data: settings } = useQuery({
    queryKey: ['settings', 'institute'],
    queryFn: async () => {
      const res = await fetch('/api/settings/institute')
      return res.json()
    },
    enabled: open,
  })

  const selectedStudentId = watch('studentId')

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      const day = settings?.defaultDueDate || 10
      let initialAmount = settings?.defaultFee || 1500

      if (studentId && specificStudent && settings) {
        if (specificStudent.monthlyFee) initialAmount = Number(specificStudent.monthlyFee)
        else if (settings.classFees?.[specificStudent.class]) initialAmount = Number(settings.classFees[specificStudent.class])
      }

      reset({ 
        studentId: studentId ?? '', 
        amount: Number(initialAmount),
        dueDate: format(new Date(new Date().getFullYear(), new Date().getMonth(), day), 'yyyy-MM-dd') 
      })
    } else {
      reset({ 
        studentId: studentId ?? '', 
        dueDate: format(new Date(new Date().getFullYear(), new Date().getMonth(), 10), 'yyyy-MM-dd') 
      })
    }
  }, [open, studentId, settings, specificStudent, reset])

  // Watch dropdown changes to auto-fill amount
  useEffect(() => {
    if (open && !studentId && selectedStudentId && students && settings) {
      const student = students.find((s: any) => s.id === selectedStudentId)
      if (student) {
        let amt = settings.defaultFee || 1500
        if (student.monthlyFee) amt = Number(student.monthlyFee)
        else if (settings.classFees?.[student.class]) amt = Number(settings.classFees[student.class])
        setValue('amount', amt)
      }
    }
  }, [selectedStudentId, students, settings, setValue, open, studentId])

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
            <div className="relative" ref={selectRef}>
              <label className="block text-xs font-medium text-gray-600 mb-1">Student *</label>
              
              <div 
                onClick={() => setSearchOpen(!searchOpen)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white cursor-pointer flex justify-between items-center focus:border-brand-400"
              >
                <span className={selectedStudentId ? 'text-gray-900' : 'text-gray-500'}>
                  {selectedStudentId && students
                    ? (() => {
                        const s = students.find((s:any) => s.id === selectedStudentId)
                        return s ? `${s.name} — ${s.class}` : 'Select student'
                      })() 
                    : 'Select student'}
                </span>
                <ChevronDown size={16} className="text-gray-400" />
              </div>

              {searchOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg flex flex-col overflow-hidden">
                  <div className="p-2 border-b border-gray-100 flex items-center gap-2">
                    <Search size={14} className="text-gray-400 shrink-0" />
                    <input 
                      type="text"
                      autoFocus
                      placeholder="Search student..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full text-sm outline-none"
                    />
                  </div>
                  <div className="overflow-y-auto max-h-48">
                    {students?.filter((s:any) => s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.class.toLowerCase().includes(searchQuery.toLowerCase())).map((s: any) => (
                      <div 
                        key={s.id}
                        onClick={() => {
                          setValue('studentId', s.id, { shouldValidate: true })
                          setSearchOpen(false)
                          setSearchQuery('')
                        }}
                        className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 ${selectedStudentId === s.id ? 'bg-brand-50 text-brand-900' : 'text-gray-700'}`}
                      >
                        {s.name} <span className="text-gray-400 text-xs">— {s.class}</span>
                      </div>
                    ))}
                    {students?.filter((s:any) => s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.class.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                      <div className="px-3 py-4 text-sm text-center text-gray-400">No students found</div>
                    )}
                  </div>
                </div>
              )}
              
              <input type="hidden" {...register('studentId')} />
              {errors.studentId && <p className="mt-1 text-xs text-rose-500">{errors.studentId.message}</p>}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Month *</label>
              <select 
                value={(watch('month') || '').split(' ')[0] || ''}
                onChange={e => {
                  const y = (watch('month') || '').split(' ')[1] || String(baseYear)
                  setValue('month', `${e.target.value} ${y}`.trim(), { shouldValidate: true })
                }}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand-400"
              >
                <option value="">Select month</option>
                {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Year *</label>
              <select 
                value={(watch('month') || '').split(' ')[1] || ''}
                onChange={e => {
                  const m = (watch('month') || '').split(' ')[0] || ''
                  setValue('month', m ? `${m} ${e.target.value}` : e.target.value, { shouldValidate: true })
                }}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand-400"
              >
                <option value="">Select year</option>
                {Array.from({ length: 5 }, (_, i) => String(baseYear + i)).map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <input type="hidden" {...register('month')} />
          </div>
          {errors.month && <p className="mt-1 text-xs text-rose-500">{errors.month.message}</p>}

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
