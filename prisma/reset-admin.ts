import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
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

  console.log('✅ Admin password reset successfully!')
  console.log('   Email   :', user.email)
  console.log('   Password: Admin@1234')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
