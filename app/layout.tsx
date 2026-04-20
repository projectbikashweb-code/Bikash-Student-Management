import type { Metadata } from 'next'
import './globals.css'
import { Providers } from '@/components/providers'
import { Toaster } from 'sonner'

export const metadata: Metadata = {
  title: 'Bikash Institute - Management System',
  description: 'Student management system for Bikash Institute',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="overflow-x-hidden" style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
        <Providers>
          {children}
          <Toaster richColors position="top-right" />
        </Providers>
      </body>
    </html>
  )
}
