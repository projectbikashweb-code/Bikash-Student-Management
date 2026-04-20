'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { studentSchema, StudentFormData } from '@/lib/validations'
import { X, Loader2 } from 'lucide-react'

interface StudentFormProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: StudentFormData) => Promise<void>
  defaultValues?: Partial<StudentFormData>
  title?: string
  loading?: boolean
}

import { CLASS_OPTIONS } from '@/lib/constants/classes'

export function StudentForm({ open, onClose, onSubmit, defaultValues, title = 'Add Student', loading }: StudentFormProps) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema),
    defaultValues,
  })

  useEffect(() => {
    if (open) reset(defaultValues ?? {})
  }, [open, defaultValues])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto animate-fade-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
          <h2 className="text-base font-semibold text-gray-800">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Full Name *</label>
              <input {...register('name')} placeholder="e.g. Arjun Sharma" className="input-field" />
              {errors.name && <p className="err">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Phone * (10 digits)</label>
              <input {...register('phone')} placeholder="9876543210" className="input-field" />
              {errors.phone && <p className="err">{errors.phone.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Guardian Phone</label>
              <input {...register('guardianPhone')} placeholder="9876543210" className="input-field" />
              {errors.guardianPhone && <p className="err">{errors.guardianPhone.message}</p>}
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">School / College *</label>
              <input {...register('school')} placeholder="e.g. DAV Public School" className="input-field" />
              {errors.school && <p className="err">{errors.school.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Class *</label>
              <select {...register('class')} className="input-field">
                <option value="">Select class</option>
                {CLASS_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              {errors.class && <p className="err">{errors.class.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Subjects (comma-separated)</label>
              <input {...register('subjects')} placeholder="Mathematics, Physics" className="input-field" />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Address</label>
              <input {...register('address')} placeholder="Full address" className="input-field" />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 rounded-xl bg-brand-300 text-gray-900 text-sm font-medium hover:bg-brand-400 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              Save Student
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        :global(.input-field) {
          width: 100%; padding: 0.5rem 0.75rem; border: 1px solid #e5e7eb; border-radius: 0.625rem;
          font-size: 0.875rem; color: #1f2937; outline: none; transition: all 0.15s;
        }
        :global(.input-field:focus) { border-color: #ECFC3A; box-shadow: 0 0 0 3px rgba(236,252,58,0.15); }
        :global(.err) { margin-top: 0.25rem; font-size: 0.7rem; color: #ef4444; }
      `}</style>
    </div>
  )
}
