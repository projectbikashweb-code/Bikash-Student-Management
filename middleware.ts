export { default } from 'next-auth/middleware'

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
