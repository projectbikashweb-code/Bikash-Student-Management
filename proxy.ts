import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

/**
 * proxy.ts — replaces the deprecated middleware.ts convention (Next.js 16).
 *
 * Auth strategy: next-auth v4 compatible via getToken() (edge-safe JWT read).
 * No database access — reads only the encrypted JWT cookie, which is safe on
 * the edge/Node runtime that proxy.ts uses.
 *
 * Protected routes are identical to those in the old middleware.ts matcher.
 */
export async function proxy(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  })

  const { pathname } = request.nextUrl

  // If the user is not authenticated and is trying to access a protected route,
  // redirect them to the login page.
  if (!token) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', request.url)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/students/:path*',
    '/fees/:path*',
    '/invoices/:path*',
    '/payments/:path*',
    '/reminders/:path*',
    '/settings/:path*',
    '/api/students/:path*',
    '/api/fees/:path*',
    '/api/invoices/:path*',
    '/api/payments/:path*',
    '/api/reminders/:path*',
    '/api/dashboard/:path*',
  ],
}
