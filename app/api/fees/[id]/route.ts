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
  const record = await prisma.feeRecord.update({
    where: { id },
    data: body,
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
