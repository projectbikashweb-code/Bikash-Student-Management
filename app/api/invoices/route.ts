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
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { studentId, feeRecordId, remarks } = body

    if (!studentId || !feeRecordId) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }

    console.log({ studentId, feeRecordId, remarks })

    const feeRecord = await prisma.feeRecord.findUnique({
      where: { id: feeRecordId },
      include: { student: true },
    })

    if (!feeRecord) {
      throw new Error('Fee record not found')
    }

    const existingInvoice = await prisma.invoice.findFirst({
      where: { feeRecordId },
    })

    if (existingInvoice) {
      throw new Error('Invoice already exists')
    }

    // Generate invoice number — use the highest existing number, not count
    // COUNT breaks when invoices are deleted (gaps cause unique constraint violations)
    const year = new Date().getFullYear()
    const lastInvoice = await prisma.invoice.findFirst({
      where: { invoiceNumber: { startsWith: `BI-${year}-` } },
      orderBy: { invoiceNumber: 'desc' },
      select: { invoiceNumber: true },
    })

    let nextNum = 1
    if (lastInvoice) {
      const parts = lastInvoice.invoiceNumber.split('-')
      const lastNum = parseInt(parts[parts.length - 1], 10)
      if (!isNaN(lastNum)) nextNum = lastNum + 1
    }

    const invoiceNumber = `BI-${year}-${String(nextNum).padStart(4, '0')}`

    // Safely coerce Prisma Decimal fields — Decimal objects fail with Number()
    const totalAmount = parseFloat(feeRecord.amount.toString())
    const paidAmount = parseFloat((feeRecord.paidAmount ?? 0).toString())

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        studentId,
        feeRecordId,
        issuedAt: new Date(),
        items: [{ description: `Tuition Fee - ${feeRecord.month}`, amount: totalAmount }],
        totalAmount,
        paidAmount,
        remarks: remarks ?? null,
      },
      include: {
        student: { select: { id: true, name: true, class: true, phone: true, school: true } },
        feeRecord: { select: { month: true, status: true } },
      },
    })

    return NextResponse.json(invoice, { status: 201 })
  } catch (error: any) {
    const detail = {
      message: error?.message ?? 'Unknown',
      code: error?.code ?? null,
      meta: error?.meta ?? null,
    }
    console.error("INVOICE_ERROR:", JSON.stringify(detail, null, 2))
    return NextResponse.json(
      { error: detail.message, code: detail.code, meta: detail.meta },
      { status: 500 }
    )
  }
}
