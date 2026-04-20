import { NextRequest, NextResponse } from 'next/server'
import { RouteContext } from '@/types/route-context'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { paymentSchema } from '@/lib/validations'

export async function POST(req: NextRequest, context: RouteContext<{ id: string }>) {
  const { id } = await context.params
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = paymentSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const feeRecord = await prisma.feeRecord.findUnique({ where: { id } })
  if (!feeRecord) return NextResponse.json({ error: 'Fee record not found' }, { status: 404 })

  const newPaidAmount = Number(feeRecord.paidAmount) + parsed.data.amountPaid
  const total = Number(feeRecord.amount)
  const newStatus = newPaidAmount >= total ? 'PAID' : newPaidAmount > 0 ? 'PARTIAL' : 'PENDING'

  const [payment, updatedFee] = await prisma.$transaction([
    prisma.paymentHistory.create({
      data: {
        feeRecordId: id,
        studentId: feeRecord.studentId,
        amountPaid: parsed.data.amountPaid,
        paymentDate: new Date(parsed.data.paymentDate),
        paymentMode: parsed.data.paymentMode as any,
        receivedBy: parsed.data.receivedBy || (session.user as any)?.name || 'Admin',
        notes: parsed.data.notes,
      },
    }),
    prisma.feeRecord.update({
      where: { id },
      data: {
        paidAmount: newPaidAmount,
        status: newStatus as any,
        paidDate: newStatus === 'PAID' ? new Date(parsed.data.paymentDate) : undefined,
      },
    }),
  ])

  return NextResponse.json({ payment, feeRecord: updatedFee }, { status: 201 })
}
