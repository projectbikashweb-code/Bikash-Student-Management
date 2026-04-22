import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const students = await prisma.student.findMany({ take: 1 })
    return NextResponse.json({ success: true, students })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message, stack: error.stack })
  }
}
