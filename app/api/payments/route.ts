import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns'

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

  // Proper Monthly Summary & Aggregations
  const now = new Date()
  const thisMonthStart = startOfMonth(now)
  const thisMonthEnd = endOfMonth(now)

  const [thisMonthAgg, modeAgg] = await Promise.all([
    prisma.paymentHistory.aggregate({
      _sum: { amountPaid: true },
      where: { paymentDate: { gte: thisMonthStart, lte: thisMonthEnd } }
    }),
    prisma.paymentHistory.groupBy({
      by: ['paymentMode'],
      _sum: { amountPaid: true }
    })
  ])

  const totalThisMonth = Number(thisMonthAgg._sum.amountPaid ?? 0)
  const totalUPI = Number(modeAgg.find(m => m.paymentMode === 'UPI')?._sum.amountPaid ?? 0)
  const totalCash = Number(modeAgg.find(m => m.paymentMode === 'CASH')?._sum.amountPaid ?? 0)

  // Monthly chart data (last 6 months)
  const monthlyData = []
  for (let i = 5; i >= 0; i--) {
    const d = subMonths(now, i)
    const start = startOfMonth(d)
    const end = endOfMonth(d)
    const result = await prisma.paymentHistory.aggregate({
      _sum: { amountPaid: true },
      where: { paymentDate: { gte: start, lte: end } },
    })
    monthlyData.push({
      month: format(d, 'MMM yy'),
      amount: Number(result._sum.amountPaid ?? 0),
    })
  }

  return NextResponse.json({ 
    payments, 
    total, 
    pages: Math.ceil(total / limit),
    summary: { totalThisMonth, totalUPI, totalCash, monthlyData }
  })
}
