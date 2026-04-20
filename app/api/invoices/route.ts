import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const studentId = searchParams.get('studentId') ?? ''
  const page = parseInt(searchParams.get('page') ?? '1')
  const limit = parseInt(searchParams.get('limit') ?? '20')

  const where: any = {}
  if (studentId) where.studentId = studentId

  const [invoices, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      include: {
        student: { select: { id: true, name: true, class: true, phone: true, school: true } },
        feeRecord: { select: { month: true, status: true } },
      },
      orderBy: { issuedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.invoice.count({ where }),
  ])

  return NextResponse.json({ invoices, total, pages: Math.ceil(total / limit) })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { studentId, feeRecordId, remarks } = body

  const feeRecord = await prisma.feeRecord.findUnique({
    where: { id: feeRecordId },
    include: { student: true },
  })
  if (!feeRecord) return NextResponse.json({ error: 'Fee record not found' }, { status: 404 })

  // Generate invoice number
  const year = new Date().getFullYear()
  const count = await prisma.invoice.count({
    where: { invoiceNumber: { startsWith: `BI-${year}-` } },
  })
  const invoiceNumber = `BI-${year}-${String(count + 1).padStart(4, '0')}`

  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber,
      studentId,
      feeRecordId,
      issuedAt: new Date(),
      items: [{ description: `Tuition Fee - ${feeRecord.month}`, amount: Number(feeRecord.amount) }],
      totalAmount: Number(feeRecord.amount),
      paidAmount: Number(feeRecord.paidAmount),
      remarks,
    },
    include: {
      student: { select: { id: true, name: true, class: true, phone: true, school: true } },
      feeRecord: { select: { month: true, status: true } },
    },
  })

  return NextResponse.json(invoice, { status: 201 })
}
