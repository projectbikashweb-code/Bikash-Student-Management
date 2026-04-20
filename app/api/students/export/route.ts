import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Handles export=csv for students
// Added to the existing students route via a separate export endpoint check
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const exportParam = new URL(req.url).searchParams.get('export')
  if (exportParam === 'csv') {
    const students = await prisma.student.findMany({
      orderBy: { createdAt: 'desc' },
    })
    const csv = [
      'Name,Phone,Guardian Phone,School,Class,Subjects,Address,Enrolled,Active',
      ...students.map(s => [
        s.name, s.phone, s.guardianPhone ?? '', s.school, s.class,
        Array.isArray(s.subjects) ? (s.subjects as string[]).join('; ') : '',
        s.address ?? '',
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

  return NextResponse.json({ error: 'Use /api/students for student listing' }, { status: 400 })
}
