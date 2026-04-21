import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const now = new Date()
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)

  const [
    totalStudents,
    activeStudents,
    feeStats,
    recentPayments,
    topPendingStudents,
  ] = await Promise.all([
    prisma.student.count(),
    prisma.student.count({ where: { isActive: true } }),
    prisma.feeRecord.aggregate({
      _sum: { amount: true, paidAmount: true },
      where: { dueDate: { gte: monthStart, lte: monthEnd } },
    }),
    prisma.paymentHistory.findMany({
      take: 10,
      orderBy: { paymentDate: 'desc' },
      include: { student: { select: { name: true, class: true } } },
    }),
    prisma.feeRecord.findMany({
      where: { status: { in: ['PENDING', 'PARTIAL'] } },
      include: { student: { select: { name: true, class: true, phone: true } } },
      orderBy: { amount: 'desc' },
      take: 5,
    }),
  ])

  // Status distribution
  const statusCounts = await prisma.feeRecord.groupBy({
    by: ['status'],
    _count: true,
  })

  // Monthly fee collection for last 6 months
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
      month: format(d, 'MMM yyyy'),
      amount: Number(result._sum.amountPaid ?? 0),
    })
  }

  // Partial count
  const partialCount = await prisma.feeRecord.count({ where: { status: 'PARTIAL' } })
  const pendingTotal = await prisma.feeRecord.aggregate({
    _sum: { amount: true, paidAmount: true },
    where: { status: { in: ['PENDING', 'PARTIAL'] } },
  })

  const pendingFees = Number(pendingTotal._sum.amount ?? 0) - Number(pendingTotal._sum.paidAmount ?? 0)

  // Due soon (next 7 days)
  const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const dueSoon = await prisma.feeRecord.findMany({
    where: { status: 'PENDING', dueDate: { gte: now, lte: weekFromNow } },
    include: { student: { select: { name: true, phone: true } } },
    take: 5,
  })

  return NextResponse.json({
    totalStudents,
    activeStudents,
    collectedThisMonth: Number(feeStats._sum.paidAmount ?? 0),
    pendingFees,
    partialCount,
    statusCounts,
    monthlyData,
    recentPayments,
    topPendingStudents,
    dueSoon,
  })
}
