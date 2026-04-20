import NextAuth from 'next-auth'

declare module 'next-auth' {
  interface User {
    id: string
    role: 'ADMIN' | 'STAFF'
    mustChangePass: boolean
  }

  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      role: 'ADMIN' | 'STAFF'
      mustChangePass: boolean
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: 'ADMIN' | 'STAFF'
    mustChangePass: boolean
  }
}
