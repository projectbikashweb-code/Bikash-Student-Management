'use client'

import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { X, Loader2, AlertTriangle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface EditFeeModalProps {
  open: boolean
  onClose: () => void
  feeRecord: {
    id: string
    amount: number | string
    paidAmount: number | string
    status: string
    paidDate?: string | null
    dueDate: string
    month: string
    notes?: string | null
    student?: { name?: string; class?: string }
  } | null
}

export function EditFeeModal({ open, onClose, feeRecord }: EditFeeModalProps) {
  const qc = useQueryClient()

  const [paidAmount, setPaidAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [amount, setAmount] = useState('')

  useEffect(() => {
    if (open && feeRecord) {
      setPaidAmount(String(Number(feeRecord.paidAmount)))
      setNotes(feeRecord.notes || '')
      setAmount(String(Number(feeRecord.amount)))
      setDueDate(feeRecord.dueDate ? new Date(feeRecord.dueDate).toISOString().split('T')[0] : '')
    }
  }, [open, feeRecord])

  const mutation = useMutation({
    mutationFn: async () => {
      if (!feeRecord) throw new Error('No fee record')
      const res = await fetch(`/api/fees/${feeRecord.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          editFeeRecord: true,
          paidAmount: Number(paidAmount),
          amount: Number(amount),
          notes,
          dueDate,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to update fee record')
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success('Fee record updated successfully')
      qc.invalidateQueries({ queryKey: ['fees'] })
      qc.invalidateQueries({ queryKey: ['payments'] })
      onClose()
    },
    onError: (err: any) => toast.error(err.message || 'Failed to update'),
  })

  const resetToUnpaid = useMutation({
    mutationFn: async () => {
      if (!feeRecord) throw new Error('No fee record')
      const res = await fetch(`/api/fees/${feeRecord.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          editFeeRecord: true,
          paidAmount: 0,
          status: 'PENDING',
          paidDate: null,
          notes: `Payment reverted${notes ? ` — ${notes}` : ''}`,
        }),
      })
      if (!res.ok) throw new Error('Failed to reset')
      return res.json()
    },
    onSuccess: () => {
      toast.success('Fee record reset to Pending')
      qc.invalidateQueries({ queryKey: ['fees'] })
      qc.invalidateQueries({ queryKey: ['payments'] })
      onClose()
    },
    onError: () => toast.error('Failed to reset fee record'),
  })

  if (!open || !feeRecord) return null

  const totalAmount = Number(amount || feeRecord.amount)
  const currentPaid = Number(paidAmount)
  const balance = totalAmount - currentPaid
  const autoStatus = currentPaid >= totalAmount ? 'PAID' : currentPaid > 0 ? 'PARTIAL' : 'PENDING'

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-800">Edit Fee Record</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X size={16} /></button>
        </div>

        <div className="p-6 space-y-4">
          {/* Student info */}
          <div className="bg-gray-50 rounded-xl p-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Student</span>
              <span className="font-medium text-gray-800">{feeRecord.student?.name || '—'}</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-gray-500">Month</span>
              <span className="font-medium text-gray-700">{feeRecord.month}</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-gray-500">Current Status</span>
              <span className={`font-semibold text-xs px-2 py-0.5 rounded-full ${
                feeRecord.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' :
                feeRecord.status === 'PARTIAL' ? 'bg-amber-100 text-amber-700' :
                'bg-rose-100 text-rose-700'
              }`}>{feeRecord.status}</span>
            </div>
          </div>

          {/* Editable Fields */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Total Amount (₹)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-[#ECFC3A]/10"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Paid Amount (₹)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={paidAmount}
              onChange={e => setPaidAmount(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-[#ECFC3A]/10"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand-400"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
            <input
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Optional notes about this edit"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand-400"
            />
          </div>

          {/* Preview */}
          <div className="bg-blue-50 rounded-xl p-3 text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-blue-600">New Balance</span>
              <span className={`font-semibold ${balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{formatCurrency(Math.max(0, balance))}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-600">Status will be</span>
              <span className={`font-semibold text-xs px-2 py-0.5 rounded-full ${
                autoStatus === 'PAID' ? 'bg-emerald-100 text-emerald-700' :
                autoStatus === 'PARTIAL' ? 'bg-amber-100 text-amber-700' :
                'bg-rose-100 text-rose-700'
              }`}>{autoStatus}</span>
            </div>
          </div>

          {/* Revert to Pending shortcut */}
          {feeRecord.status === 'PAID' && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm('This will reset the paid amount to ₹0 and set the status to PENDING. Are you sure?')) {
                  resetToUnpaid.mutate()
                }
              }}
              disabled={resetToUnpaid.isPending}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl border-2 border-amber-200 bg-amber-50 text-amber-700 text-sm font-medium hover:bg-amber-100 transition-colors disabled:opacity-60"
            >
              <AlertTriangle size={14} />
              {resetToUnpaid.isPending ? 'Resetting...' : 'Revert to Pending (Reset Payment)'}
            </button>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
            <button
              type="button"
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending}
              className="flex-1 px-4 py-2 rounded-xl bg-brand-300 text-gray-900 text-sm font-medium hover:bg-brand-400 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {mutation.isPending && <Loader2 size={14} className="animate-spin" />}
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
