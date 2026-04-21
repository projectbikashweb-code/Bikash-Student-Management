import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number | string | null | undefined): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : (amount ?? 0)
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(num)
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '-'
  return format(new Date(date), 'dd MMM yyyy')
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return '-'
  return format(new Date(date), 'dd MMM yyyy, HH:mm')
}

export async function generateInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear()
  // This will be handled server-side
  return `BI-${year}-0001`
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function getStatusColor(status: string) {
  switch (status) {
    case 'PAID':
      return 'bg-emerald-100 text-emerald-700 border-emerald-200'
    case 'PENDING':
      return 'bg-rose-100 text-rose-700 border-rose-200'
    case 'PARTIAL':
      return 'bg-amber-100 text-amber-700 border-amber-200'
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200'
  }
}

export function getPaymentModeColor(mode: string) {
  switch (mode) {
    case 'CASH':
      return 'bg-green-100 text-green-700'
    case 'UPI':
      return 'bg-purple-100 text-purple-700'
    case 'ONLINE':
      return 'bg-blue-100 text-blue-700'
    case 'CHEQUE':
      return 'bg-orange-100 text-orange-700'
    default:
      return 'bg-gray-100 text-gray-700'
  }
}

export function buildWhatsAppLink(phone: string, message: string): string {
  const cleanPhone = phone.replace(/\D/g, '')
  const phoneWithCountry = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`
  return `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(message)}`
}

export function buildReminderMessage(
  studentName: string,
  amount: number,
  month: string,
  dueDate: Date | string,
  teacherPhone: string = '8249297170'
): string {
  return `Dear ${studentName}'s parent, your tuition fee of ${formatCurrency(amount)} for ${month} at Bikash Educational Institution is due on ${formatDate(dueDate)}. Please pay at the earliest. Contact: ${teacherPhone}. Thank you.`
}
