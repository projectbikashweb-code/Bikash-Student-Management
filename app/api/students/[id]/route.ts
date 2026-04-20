import { NextRequest, NextResponse } from 'next/server'
import { RouteContext } from '@/types/route-context'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { studentSchema } from '@/lib/validations'

export async function GET(req: NextRequest, context: RouteContext<{ id: string }>) {
  const { id } = await context.params
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const student = await prisma.student.findUnique({
    where: { id },
    include: {
      feeRecords: { orderBy: { createdAt: 'desc' } },
      paymentHistory: { orderBy: { paymentDate: 'desc' } },
      invoices: { orderBy: { issuedAt: 'desc' } },
      reminders: { orderBy: { sentAt: 'desc' } },
    },
  })

  if (!student) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(student)
}

export async function PUT(req: NextRequest, context: RouteContext<{ id: string }>) {
  const { id } = await context.params
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = studentSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { subjects, ...data } = parsed.data
  const subjectsArr = subjects ? subjects.split(',').map(s => s.trim()).filter(Boolean) : []

  const student = await prisma.student.update({
    where: { id },
    data: { ...data, subjects: subjectsArr },
  })

  return NextResponse.json(student)
}

export async function DELETE(req: NextRequest, context: RouteContext<{ id: string }>) {
  const { id } = await context.params
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await prisma.student.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
