import { PrismaClient, FeeStatus, PaymentMode, ReminderStatus } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Admin user
  const hashedPassword = await bcrypt.hash('Admin@1234', 12)
  
  await prisma.user.upsert({
    where: { email: 'admin@bikashinstitute.com' },
    update: {},
    create: {
      name: 'Admin',
      email: 'admin@bikashinstitute.com',
      password: hashedPassword,
      role: 'ADMIN',
      mustChangePass: true,
    },
  })

  // Students
  const studentsData = [
    { name: 'Arjun Sharma', phone: '9876543210', guardianPhone: '9876543211', school: 'DAV Public School', class: 'Class 10', subjects: ['Mathematics', 'Science'], address: 'Bargarh, Odisha' },
    { name: 'Priya Patel', phone: '9876543212', guardianPhone: '9876543213', school: 'Kendriya Vidyalaya', class: 'Class 12 Science', subjects: ['Physics', 'Chemistry', 'Mathematics'], address: 'Bargarh, Odisha' },
    { name: 'Rohit Kumar', phone: '9876543214', guardianPhone: '9876543215', school: 'St. Xavier School', class: 'Class 9', subjects: ['Mathematics', 'Science', 'English'], address: 'Sambalpur, Odisha' },
    { name: 'Sneha Mishra', phone: '9876543216', guardianPhone: '9876543217', school: 'Model School', class: 'Class 11 Commerce', subjects: ['Accountancy', 'Business Studies'], address: 'Bargarh, Odisha' },
    { name: 'Vikram Singh', phone: '9876543218', guardianPhone: '9876543219', school: 'Saraswati Vidyalaya', class: 'Class 10', subjects: ['Mathematics', 'Science'], address: 'Bolangir, Odisha' },
    { name: 'Anita Devi', phone: '9876543220', guardianPhone: '9876543221', school: 'DAV Public School', class: 'Class 12 Arts', subjects: ['History', 'Political Science'], address: 'Bargarh, Odisha' },
    { name: 'Suresh Nayak', phone: '9876543222', guardianPhone: '9876543223', school: 'Kendriya Vidyalaya', class: 'Class 9', subjects: ['Mathematics', 'Science'], address: 'Bargarh, Odisha' },
    { name: 'Meena Behera', phone: '9876543224', guardianPhone: '9876543225', school: 'Christ School', class: 'Class 11 Science', subjects: ['Physics', 'Chemistry', 'Biology'], address: 'Sambalpur, Odisha' },
    { name: 'Deepak Mahapatra', phone: '9876543226', guardianPhone: '9876543227', school: 'St. Xavier School', class: 'Class 10', subjects: ['Mathematics', 'Science', 'English'], address: 'Bargarh, Odisha' },
    { name: 'Kavita Sahu', phone: '9876543228', guardianPhone: '9876543229', school: 'Model School', class: 'Class 12 Science', subjects: ['Physics', 'Mathematics'], address: 'Bargarh, Odisha' },
  ]

  const students = []
  for (const s of studentsData) {
    const student = await prisma.student.create({
      data: { ...s, subjects: s.subjects, enrolledAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000) },
    })
    students.push(student)
  }

  // Fee records for last 3 months
  const months = ['February 2025', 'March 2025', 'April 2025']
  const statuses: FeeStatus[] = ['PAID', 'PENDING', 'PARTIAL']
  const feeRecords = []

  for (const student of students) {
    for (let mi = 0; mi < months.length; mi++) {
      const month = months[mi]
      const amount = [1500, 2000, 2500][Math.floor(Math.random() * 3)]
      const statusIdx = Math.floor(Math.random() * 3)
      const status = statuses[statusIdx]
      const paidAmount = status === 'PAID' ? amount : status === 'PARTIAL' ? amount * 0.5 : 0
      const dueDate = new Date(2025, mi + 1, 10)
      const paidDate = status !== 'PENDING' ? new Date(2025, mi + 1, 5) : null

      const fr = await prisma.feeRecord.create({
        data: {
          studentId: student.id,
          amount,
          paidAmount,
          dueDate,
          paidDate,
          status,
          month,
          notes: `Fee for ${month}`,
        },
      })
      feeRecords.push(fr)
    }
  }

  // Payment history
  let phCount = 0
  for (const fr of feeRecords) {
    if (fr.status !== 'PENDING' && phCount < 10) {
      await prisma.paymentHistory.create({
        data: {
          feeRecordId: fr.id,
          studentId: fr.studentId,
          amountPaid: Number(fr.paidAmount),
          paymentDate: fr.paidDate || new Date(),
          paymentMode: ['CASH', 'UPI', 'ONLINE', 'CHEQUE'][Math.floor(Math.random() * 4)] as PaymentMode,
          receivedBy: 'Admin',
          notes: 'Payment received',
        },
      })
      phCount++
    }
  }

  // Invoices
  let invoiceCounter = 1
  const year = 2025
  const paidFeeRecords = feeRecords.filter(fr => fr.status === 'PAID').slice(0, 5)
  
  for (const fr of paidFeeRecords) {
    const student = students.find(s => s.id === fr.studentId)!
    const invoiceNumber = `BI-${year}-${String(invoiceCounter).padStart(4, '0')}`
    await prisma.invoice.create({
      data: {
        invoiceNumber,
        studentId: fr.studentId,
        feeRecordId: fr.id,
        issuedAt: fr.paidDate || new Date(),
        items: [{ description: `Tuition Fee - ${fr.month}`, amount: Number(fr.amount) }],
        totalAmount: Number(fr.amount),
        paidAmount: Number(fr.paidAmount),
        remarks: 'Payment received in full',
      },
    })
    invoiceCounter++
  }

  console.log('Seed completed successfully!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
