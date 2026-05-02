import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET — fetch current institute settings (creates defaults if first time)
export async function GET() {
  const settings = await prisma.instituteSettings.findUnique({
    where: { id: 'singleton' },
  })

  if (!settings) {
    return NextResponse.json({
      name: "Bikash Educational Institution",
      address: "Plot No-926/A/1 Sri Vihar Colony,Tulsipur,Cuttack,753008",
      phone: "+918249297170",
      email: "admin@bikashinstitute.com",
      defaultFee: 1500,
      defaultDueDate: 10,
      classFees: {}
    })
  }

  return NextResponse.json(settings)
}

// PUT — save updated institute settings
export async function PUT(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

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
