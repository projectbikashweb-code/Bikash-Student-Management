import { NextRequest, NextResponse } from 'next/server'
import { RouteContext } from '@/types/route-context'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(req: NextRequest, context: RouteContext<{ id: string }>) {
  const { id } = await context.params
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()

  const feeRecord = await prisma.feeRecord.findUnique({ where: { id } })
  if (!feeRecord) return NextResponse.json({ error: 'Fee record not found' }, { status: 404 })

  // Handle "Mark as Paid" action
  if (body.status === 'PAID' && body.markAsPaid) {
    const totalAmount = Number(feeRecord.amount)
    const alreadyPaid = Number(feeRecord.paidAmount)
    const remaining = totalAmount - alreadyPaid

    const result = await prisma.$transaction(async (tx) => {
      // Create a payment history entry for the remaining amount (if any)
      if (remaining > 0) {
        await tx.paymentHistory.create({
          data: {
            feeRecordId: id,
            studentId: feeRecord.studentId,
            amountPaid: remaining,
            paymentDate: body.paidDate ? new Date(body.paidDate) : new Date(),
            paymentMode: body.paymentMode || 'CASH',
            receivedBy: (session.user as any)?.name || 'Admin',
            notes: 'Marked as fully paid',
          },
        })
      }

      // Update the fee record
      const updated = await tx.feeRecord.update({
        where: { id },
        data: {
          status: 'PAID',
          paidAmount: totalAmount,
          paidDate: body.paidDate ? new Date(body.paidDate) : new Date(),
        },
        include: { student: { select: { id: true, name: true, class: true, phone: true } } },
      })

      return updated
    })

    return NextResponse.json(result)
  }

  // Handle "Edit Fee Record" — revert/adjust status and paidAmount
  if (body.editFeeRecord) {
    const newStatus = body.status as string
    const newPaidAmount = body.paidAmount !== undefined ? Number(body.paidAmount) : undefined

    const updateData: any = {}

    if (newStatus) updateData.status = newStatus
    if (newPaidAmount !== undefined) updateData.paidAmount = newPaidAmount
    if (body.paidDate !== undefined) updateData.paidDate = body.paidDate ? new Date(body.paidDate) : null
    if (body.notes !== undefined) updateData.notes = body.notes
    if (body.amount !== undefined) updateData.amount = Number(body.amount)
    if (body.dueDate !== undefined) updateData.dueDate = new Date(body.dueDate)

    // Auto-calculate status if paidAmount is being set
    if (newPaidAmount !== undefined) {
      const total = body.amount !== undefined ? Number(body.amount) : Number(feeRecord.amount)
      if (newPaidAmount >= total) {
        updateData.status = 'PAID'
        updateData.paidDate = updateData.paidDate || new Date()
      } else if (newPaidAmount > 0) {
        updateData.status = 'PARTIAL'
        updateData.paidDate = null
      } else {
        updateData.status = 'PENDING'
        updateData.paidDate = null
      }
    }

    const updated = await prisma.feeRecord.update({
      where: { id },
      data: updateData,
      include: { student: { select: { id: true, name: true, class: true, phone: true } } },
    })

    return NextResponse.json(updated)
  }

  // Fallback: generic update (backward-compatible)
  const record = await prisma.feeRecord.update({
    where: { id },
    data: body,
    include: { student: { select: { id: true, name: true, class: true, phone: true } } },
  })
  return NextResponse.json(record)
}

export async function DELETE(req: NextRequest, context: RouteContext<{ id: string }>) {
  const { id } = await context.params
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const fee = await prisma.feeRecord.findUnique({ where: { id } })
  if (!fee) return NextResponse.json({ error: 'Record not found' }, { status: 404 })
  if (fee.status !== 'PENDING') return NextResponse.json({ error: 'Cannot delete a fee record that has payments' }, { status: 400 })

  await prisma.feeRecord.delete({ where: { id } })
  return NextResponse.json({ success: true, message: 'Fee record deleted gracefully' })
}
