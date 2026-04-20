import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const reminders = await prisma.whatsAppReminder.findMany({
    include: {
      student: { select: { id: true, name: true, phone: true } },
      feeRecord: { select: { month: true, amount: true } },
    },
    orderBy: { sentAt: 'desc' },
    take: 50,
  })
  return NextResponse.json(reminders)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { studentId, feeRecordId, message, status } = body

  const reminder = await prisma.whatsAppReminder.create({
    data: {
      studentId,
      feeRecordId,
      message,
      status: status ?? 'SENT',
      triggeredBy: (session.user as any)?.name || 'Admin',
    },
  })
  return NextResponse.json(reminder, { status: 201 })
}
