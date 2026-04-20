'use client'

import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'

interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
  title: string
  description: string
  confirmLabel?: string
  variant?: 'danger' | 'warning'
  loading?: boolean
}

export function ConfirmDialog({
  open, onClose, onConfirm, title, description,
  confirmLabel = 'Confirm', variant = 'danger', loading
}: ConfirmDialogProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md animate-fade-in">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 mx-auto ${variant === 'danger' ? 'bg-rose-100' : 'bg-amber-100'}`}>
          <AlertTriangle className={`w-6 h-6 ${variant === 'danger' ? 'text-rose-600' : 'text-amber-600'}`} />
        </div>
        <h3 className="text-base font-semibold text-gray-900 text-center mb-2">{title}</h3>
        <p className="text-sm text-gray-500 text-center mb-6">{description}</p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${variant === 'danger' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-amber-500 hover:bg-amber-600'}`}
          >
            {loading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
