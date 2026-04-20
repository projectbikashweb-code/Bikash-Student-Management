import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { studentSchema } from '@/lib/validations'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const exportParam = searchParams.get('export')

  // CSV export
  if (exportParam === 'csv') {
    const students = await prisma.student.findMany({ orderBy: { createdAt: 'desc' } })
    const csv = [
      'Name,Phone,Guardian Phone,School,Class,Subjects,Address,Enrolled,Active',
      ...students.map(s => [
        `"${s.name}"`, s.phone, s.guardianPhone ?? '', `"${s.school}"`, s.class,
        `"${Array.isArray(s.subjects) ? (s.subjects as string[]).join('; ') : ''}"`,
        `"${s.address ?? ''}"`,
        new Date(s.enrolledAt).toLocaleDateString('en-IN'),
        s.isActive ? 'Yes' : 'No',
      ].join(',')),
    ].join('\n')
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="students-${Date.now()}.csv"`,
      },
    })
  }

  const page = parseInt(searchParams.get('page') ?? '1')
  const limit = parseInt(searchParams.get('limit') ?? '10')
  const search = searchParams.get('search') ?? ''
  const cls = searchParams.get('class') ?? ''
  const status = searchParams.get('status') ?? ''
  const school = searchParams.get('school') ?? ''

  const where: any = {}
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search } },
    ]
  }
  if (cls) where.class = cls
  if (school) where.school = { contains: school, mode: 'insensitive' }
  if (status === 'active') where.isActive = true
  if (status === 'inactive') where.isActive = false

  const [students, total] = await Promise.all([
    prisma.student.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        feeRecords: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { status: true, amount: true, paidAmount: true },
        },
      },
    }),
    prisma.student.count({ where }),
  ])

  return NextResponse.json({ students, total, page, limit, pages: Math.ceil(total / limit) })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = studentSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { subjects, ...data } = parsed.data
  const subjectsArr = subjects ? subjects.split(',').map(s => s.trim()).filter(Boolean) : []

  const student = await prisma.student.create({
    data: { ...data, subjects: subjectsArr },
  })

  return NextResponse.json(student, { status: 201 })
}
