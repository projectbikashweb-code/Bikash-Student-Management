import { prisma } from '@/lib/prisma'
import { InvoiceView } from '@/components/invoices/InvoiceView'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params
  
  if (!resolvedParams.id || resolvedParams.id.length < 10) return { title: 'Invoice Not Found' }
  const invoice = await prisma.invoice.findUnique({
    where: { id: resolvedParams.id },
    include: { student: true }
  })
  
  if (!invoice) return { title: 'Invoice Not Found' }
  
  return {
    title: `Invoice ${invoice.invoiceNumber} - Bikash Educational Institution`,
    description: `Invoice for ${invoice.student?.name || 'Student'}`,
  }
}

export default async function PublicInvoicePage({ params }: PageProps) {
  const resolvedParams = await params
  const { id } = resolvedParams
  
  if (!id) return notFound()

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      student: true,
      feeRecord: {
        include: {
          payments: {
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        }
      }
    },
  })

  if (!invoice) {
    return notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-0 sm:py-8 font-sans">
      <InvoiceView invoice={invoice} isPublic={true} />
    </div>
  )
}
