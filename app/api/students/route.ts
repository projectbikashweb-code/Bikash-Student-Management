import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { studentSchema } from '@/lib/validations'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const exportParam = searchParams.get('export')

    // CSV export
    if (exportParam === 'csv') {
      const students = await prisma.student.findMany({ orderBy: { createdAt: 'desc' } })
      const csvRows = [
        'Name,Phone,Guardian Phone,School,Class,Subjects,Address,Enrolled,Active',
        ...students.map(s => {
          const dateStr = new Date(s.enrolledAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
          return [
            `"${s.name.replace(/"/g, '""')}"`,
            `="${s.phone}"`,
            `="${s.guardianPhone ?? ''}"`,
            `"${s.school.replace(/"/g, '""')}"`,
            `"${s.class.replace(/"/g, '""')}"`,
            `"${Array.isArray(s.subjects) ? (s.subjects as string[]).join('; ').replace(/"/g, '""') : ''}"`,
            `"${(s.address ?? '').replace(/"/g, '""')}"`,
            `=" ${dateStr}"`,
            s.isActive ? '"Yes"' : '"No"',
          ].join(',')
        }),
      ].join('\n')
      const csv = '\uFEFF' + csvRows

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

    const safeStudents = students.map(s => ({
      ...s,
      feeRecords: s.feeRecords.map((f: any) => ({
        ...f,
        amount: Number(f.amount),
        paidAmount: Number(f.paidAmount),
      }))
    }))

    return NextResponse.json({ students: safeStudents, total, page, limit, pages: Math.ceil(total / limit) })
  } catch (error: any) {
    console.error('GET /api/students error:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
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
  } catch (error: any) {
    console.error('POST /api/students error:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

