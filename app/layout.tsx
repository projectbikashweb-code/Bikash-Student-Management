import type { Metadata } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { Toaster } from 'sonner'

/**
 * Load Plus Jakarta Sans via next/font/google.
 *
 * Why this approach:
 * - Eliminates the @import CSS error (PostCSS rejects @import after @tailwind)
 * - next/font self-hosts the font → zero external network requests at runtime
 * - Generates a CSS variable (--font-plus-jakarta-sans) consumed by Tailwind
 * - subsets: ['latin'] keeps the bundle small
 * - display: 'swap' preserves CLS-safe font loading (same as display=swap in the old URL)
 */
const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-plus-jakarta-sans',
})

export const metadata: Metadata = {
  title: 'Bikash Educational Institution - Management System',
  description: 'Student management system for Bikash Educational Institution',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning className={plusJakartaSans.variable}>
      {/*
        className on <body>:
        - `overflow-x-hidden` — unchanged from original
        - `font-sans` — resolved by Tailwind to var(--font-sans), which is configured
          in tailwind.config.ts as "'Plus Jakarta Sans', system-ui, sans-serif"
          The CSS variable above makes the font available to that declaration.
        The inline fontFamily style is removed — it's now handled cleanly via
        the Tailwind font-sans class + CSS variable, avoiding duplication.
      */}
      <body className={`overflow-x-hidden font-sans ${plusJakartaSans.className}`}>
        <Providers>
          {children}
          <Toaster richColors position="top-right" />
        </Providers>
      </body>
    </html>
  )
}
