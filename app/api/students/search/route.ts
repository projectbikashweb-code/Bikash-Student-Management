import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const q = new URL(req.url).searchParams.get('q') ?? ''
  if (q.length < 2) return NextResponse.json([])

  const students = await prisma.student.findMany({
    where: {
      isActive: true,
      OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q } },
      ],
    },
    select: { id: true, name: true, class: true, phone: true },
    take: 8,
  })

  return NextResponse.json(students)
}
