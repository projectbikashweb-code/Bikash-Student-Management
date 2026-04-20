'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { paymentSchema, PaymentFormData } from '@/lib/validations'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { X, Loader2 } from 'lucide-react'
import { format } from 'date-fns'

interface PaymentModalProps {
  open: boolean
  onClose: () => void
  feeRecordId: string
  onSuccess?: () => void
}

export function PaymentModal({ open, onClose, feeRecordId, onSuccess }: PaymentModalProps) {
  const qc = useQueryClient()

  const { register, handleSubmit, reset, formState: { errors } } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      paymentDate: format(new Date(), 'yyyy-MM-dd'),
      paymentMode: 'CASH',
    },
  })

  useEffect(() => {
    if (open) reset({ paymentDate: format(new Date(), 'yyyy-MM-dd'), paymentMode: 'CASH' })
  }, [open])

  const mutation = useMutation({
    mutationFn: async (d: PaymentFormData) => {
      const res = await fetch(`/api/fees/${feeRecordId}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(d),
      })
      if (!res.ok) throw new Error('Failed to record payment')
      return res.json()
    },
    onSuccess: () => {
      toast.success('Payment recorded successfully')
      qc.invalidateQueries({ queryKey: ['fees'] })
      qc.invalidateQueries({ queryKey: ['payments'] })
      onSuccess?.()
      onClose()
    },
    onError: () => toast.error('Failed to record payment'),
  })

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-800">Record Payment</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit(d => mutation.mutateAsync(d))} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Amount Paid (₹) *</label>
            <input {...register('amountPaid')} type="number" min="0" step="0.01" placeholder="1500" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-[#ECFC3A]/10" />
            {errors.amountPaid && <p className="mt-1 text-xs text-rose-500">{errors.amountPaid.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Payment Date *</label>
            <input {...register('paymentDate')} type="date" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand-400" />
            {errors.paymentDate && <p className="mt-1 text-xs text-rose-500">{errors.paymentDate.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Payment Mode *</label>
            <div className="grid grid-cols-4 gap-2">
              {['CASH', 'UPI', 'ONLINE', 'CHEQUE'].map(mode => (
                <label key={mode} className="relative cursor-pointer">
                  <input {...register('paymentMode')} type="radio" value={mode} className="sr-only peer" />
                  <div className="text-center py-2 rounded-xl border border-gray-200 text-xs font-medium text-gray-500 peer-checked:border-brand-300 peer-checked:bg-brand-50 peer-checked:text-brand-700 transition-all">
                    {mode}
                  </div>
                </label>
              ))}
            </div>
            {errors.paymentMode && <p className="mt-1 text-xs text-rose-500">{errors.paymentMode.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Received By</label>
            <input {...register('receivedBy')} placeholder="Admin" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand-400" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
            <input {...register('notes')} placeholder="Optional notes" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand-400" />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={mutation.isPending} className="flex-1 px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-60 flex items-center justify-center gap-2">
              {mutation.isPending && <Loader2 size={14} className="animate-spin" />}
              Record Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
