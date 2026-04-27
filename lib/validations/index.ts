import { z } from 'zod'

export const studentSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().regex(/^\d{10}$/, 'Phone must be exactly 10 digits'),
  guardianPhone: z.string().regex(/^\d{10}$/, 'Guardian phone must be 10 digits').optional().or(z.literal('')).or(z.null().transform(() => '')),
  school: z.string().min(2, 'School name is required'),
  class: z.string().min(1, 'Class is required'),
  subjects: z.string().optional().or(z.null().transform(() => undefined)),
  address: z.string().optional().or(z.null().transform(() => undefined)),
  profilePhoto: z.string().url().optional().or(z.literal('')).or(z.null().transform(() => '')),
  monthlyFee: z.coerce.number().positive('Must be positive').optional().or(z.literal('').transform(() => undefined)).or(z.null().transform(() => undefined)),
  isActive: z.boolean().optional().default(true),
})

export const feeRecordSchema = z.object({
  studentId: z.string().min(1, 'Student is required'),
  amount: z.coerce.number().positive('Amount must be positive'),
  dueDate: z.string().min(1, 'Due date is required'),
  month: z.string().min(1, 'Month is required'),
  notes: z.string().optional(),
})

export const paymentSchema = z.object({
  amountPaid: z.coerce.number().positive('Amount must be positive'),
  paymentDate: z.string().min(1, 'Payment date is required'),
  paymentMode: z.enum(['CASH', 'ONLINE', 'UPI', 'CHEQUE']),
  receivedBy: z.string().optional(),
  notes: z.string().optional(),
})

export const invoiceSchema = z.object({
  studentId: z.string().min(1, 'Student is required'),
  feeRecordId: z.string().min(1, 'Fee record is required'),
  remarks: z.string().optional(),
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Must contain at least one number'),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

export const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
})

export const staffSchema = z.object({
  name: z.string().min(2, 'Name required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export type StudentFormData = z.infer<typeof studentSchema>
export type FeeRecordFormData = z.infer<typeof feeRecordSchema>
export type PaymentFormData = z.infer<typeof paymentSchema>
export type InvoiceFormData = z.infer<typeof invoiceSchema>
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>
export type LoginFormData = z.infer<typeof loginSchema>
export type StaffFormData = z.infer<typeof staffSchema>
