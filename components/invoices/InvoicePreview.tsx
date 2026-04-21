'use client'

import { InvoiceView } from './InvoiceView'

interface InvoicePreviewProps {
  invoice: any
  onClose: () => void
}

export function InvoicePreview({ invoice, onClose }: InvoicePreviewProps) {
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <InvoiceView invoice={invoice} onClose={onClose} />
    </div>
  )
}
