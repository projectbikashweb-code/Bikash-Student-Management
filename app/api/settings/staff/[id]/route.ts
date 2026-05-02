import { NextRequest, NextResponse } from 'next/server'
import { RouteContext } from '@/types/route-context'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(req: NextRequest, context: RouteContext<{ id: string }>) {
  const { id } = await context.params
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (user.role === 'ADMIN') return NextResponse.json({ error: 'Cannot delete admin' }, { status: 403 })

  await prisma.user.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
