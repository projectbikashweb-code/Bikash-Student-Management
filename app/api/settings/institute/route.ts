import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET — fetch current institute settings (creates defaults if first time)
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const settings = await prisma.instituteSettings.upsert({
    where: { id: 'singleton' },
    update: {},
    create: { id: 'singleton' },
  })

  return NextResponse.json(settings)
}

// PUT — save updated institute settings
export async function PUT(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { name, address, phone, email, defaultFee, defaultDueDate, classFees } = body

  const settings = await prisma.instituteSettings.upsert({
    where: { id: 'singleton' },
    update: {
      ...(address !== undefined && { address }),
      ...(phone !== undefined && { phone }),
      ...(email !== undefined && { email }),
      ...(defaultFee !== undefined && { defaultFee: Number(defaultFee) }),
      ...(defaultDueDate !== undefined && { defaultDueDate: Number(defaultDueDate) }),
      ...(classFees !== undefined && { classFees }),
    },
    create: { 
      id: 'singleton', 
      name, 
      address, 
      phone, 
      email, 
      defaultFee: Number(defaultFee), 
      defaultDueDate: Number(defaultDueDate),
      classFees: classFees || {}
    },
  })

  return NextResponse.json(settings)
}
