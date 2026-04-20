import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { feeRecordSchema } from '@/lib/validations'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const month = searchParams.get('month') ?? ''
  const status = searchParams.get('status') ?? ''
  const cls = searchParams.get('class') ?? ''
  const studentId = searchParams.get('studentId') ?? ''
  const page = parseInt(searchParams.get('page') ?? '1')
  const limit = parseInt(searchParams.get('limit') ?? '20')

  const where: any = {}
  if (month) where.month = month
  if (status) where.status = status
  if (studentId) where.studentId = studentId
  if (cls) where.student = { class: cls }

  const [records, total] = await Promise.all([
    prisma.feeRecord.findMany({
      where,
      include: { student: { select: { id: true, name: true, class: true, phone: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.feeRecord.count({ where }),
  ])

  return NextResponse.json({ records, total, page, pages: Math.ceil(total / limit) })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()

  // Bulk fee assignment
  if (body.bulk && Array.isArray(body.studentIds)) {
    const { studentIds, amount, dueDate, month, notes } = body
    const records = await prisma.feeRecord.createMany({
      data: studentIds.map((sid: string) => ({
        studentId: sid,
        amount,
        paidAmount: 0,
        dueDate: new Date(dueDate),
        month,
        notes,
        status: 'PENDING',
      })),
    })
    return NextResponse.json({ created: records.count }, { status: 201 })
  }

  const parsed = feeRecordSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const record = await prisma.feeRecord.create({
    data: {
      studentId: parsed.data.studentId,
      amount: parsed.data.amount,
      paidAmount: 0,
      dueDate: new Date(parsed.data.dueDate),
      month: parsed.data.month,
      notes: parsed.data.notes,
      status: 'PENDING',
    },
    include: { student: { select: { id: true, name: true, class: true } } },
  })

  return NextResponse.json(record, { status: 201 })
}
