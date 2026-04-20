import { NextRequest, NextResponse } from 'next/server'
import { RouteContext } from '@/types/route-context'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest, context: RouteContext<{ id: string }>) {
  const { id } = await context.params
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      student: true,
      feeRecord: true,
    },
  })
  if (!invoice) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(invoice)
}

export async function DELETE(req: NextRequest, context: RouteContext<{ id: string }>) {
  const { id } = await context.params
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await prisma.invoice.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
