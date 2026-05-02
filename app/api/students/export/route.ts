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
    const csvRows = [
      'Name,Phone,Guardian Phone,School,Class,Subjects,Address,Enrolled,Active',
      ...students.map(s => {
        const dateStr = new Date(s.enrolledAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
        return [
          `"${s.name.replace(/"/g, '""')}"`,
          `"${s.phone.replace(/"/g, '""')}"`,
          `"${(s.guardianPhone ?? '').replace(/"/g, '""')}"`,
          `"${s.school.replace(/"/g, '""')}"`,
          `"${s.class.replace(/"/g, '""')}"`,
          `"${(Array.isArray(s.subjects) ? (s.subjects as string[]).join('; ') : '').replace(/"/g, '""')}"`,
          `"${(s.address ?? '').replace(/"/g, '""')}"`,
          `=" ${dateStr}"`,
          `"${s.isActive ? 'Yes' : 'No'}"`,
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

  return NextResponse.json({ error: 'Use /api/students for student listing' }, { status: 400 })
}
