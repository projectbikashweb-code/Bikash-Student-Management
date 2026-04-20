import { cn, getStatusColor, getPaymentModeColor } from '@/lib/utils'

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border', getStatusColor(status))}>
      {status}
    </span>
  )
}

export function PaymentModeBadge({ mode }: { mode: string }) {
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium', getPaymentModeColor(mode))}>
      {mode}
    </span>
  )
}
