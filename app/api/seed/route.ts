import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

// ONE-TIME SEED ENDPOINT — DELETE THIS FILE AFTER USE
// Call: GET https://your-vercel-url.vercel.app/api/seed?secret=bikash-seed-2024

const SEED_SECRET = 'bikash-seed-2024'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const secret = searchParams.get('secret')

  if (secret !== SEED_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const hashedPassword = await bcrypt.hash('Admin@1234', 10)

    const user = await prisma.user.upsert({
      where: { email: 'admin@bikashinstitute.com' },
      update: {
        password: hashedPassword,
        mustChangePass: false,
      },
      create: {
        name: 'Admin',
        email: 'admin@bikashinstitute.com',
        password: hashedPassword,
        role: 'ADMIN',
        mustChangePass: false,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Admin user created/reset successfully',
      email: user.email,
      note: 'Password is Admin@1234 — DELETE this /api/seed endpoint now!',
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
