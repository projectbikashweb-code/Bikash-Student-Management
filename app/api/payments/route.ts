import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const mode = searchParams.get('mode') ?? ''
  const studentId = searchParams.get('studentId') ?? ''
  const from = searchParams.get('from') ?? ''
  const to = searchParams.get('to') ?? ''
  const page = parseInt(searchParams.get('page') ?? '1')
  const limit = parseInt(searchParams.get('limit') ?? '20')
  const exportCsv = searchParams.get('export') === 'csv'

  const where: any = {}
  if (mode) where.paymentMode = mode
  if (studentId) where.studentId = studentId
  if (from || to) {
    where.paymentDate = {}
    if (from) where.paymentDate.gte = new Date(from)
    if (to) where.paymentDate.lte = new Date(to)
  }

  if (exportCsv) {
    const all = await prisma.paymentHistory.findMany({
      where,
      include: { student: { select: { name: true, class: true } } },
      orderBy: { paymentDate: 'desc' },
    })
    const csvRows = [
      'Date,Student,Class,Amount,Mode,Received By,Notes',
      ...all.map(p => {
        const dateStr = new Date(p.paymentDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
        return [
          `=" ${dateStr}"`,
          `"${p.student.name.replace(/"/g, '""')}"`,
          `"${p.student.class.replace(/"/g, '""')}"`,
          `"${p.amountPaid.toString()}"`,
          `"${p.paymentMode}"`,
          `"${(p.receivedBy ?? '').replace(/"/g, '""')}"`,
          `"${(p.notes ?? '').replace(/"/g, '""')}"`,
        ].join(',')
      }),
    ].join('\n')
    const csv = '\uFEFF' + csvRows
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="payments-${Date.now()}.csv"`,
      },
    })
  }

  const [payments, total] = await Promise.all([
    prisma.paymentHistory.findMany({
      where,
      include: {
        student: { select: { id: true, name: true, class: true } },
        feeRecord: { select: { month: true } },
      },
      orderBy: { paymentDate: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.paymentHistory.count({ where }),
  ])

  // Monthly summary
  const monthly = await prisma.paymentHistory.groupBy({
    by: ['paymentDate'],
    _sum: { amountPaid: true },
  })

  return NextResponse.json({ payments, total, pages: Math.ceil(total / limit) })
}
