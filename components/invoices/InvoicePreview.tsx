'use client'

import { InvoiceView } from './InvoiceView'

interface InvoicePreviewProps {
  invoice: any
  onClose: () => void
}

export function InvoicePreview({ invoice, onClose }: InvoicePreviewProps) {
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 print:static print:block print:p-0 print:m-0 print:w-full print:h-auto print:bg-transparent">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm print:hidden" onClick={onClose} />
      <InvoiceView invoice={invoice} onClose={onClose} />
    </div>
  )
}
