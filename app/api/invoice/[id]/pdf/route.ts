import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { RouteContext } from '@/types/route-context'
import { formatDate } from '@/lib/utils'

export async function GET(req: NextRequest, context: RouteContext<{ id: string }>) {
  try {
    const { id } = await context.params
    if (!id) return new NextResponse('Bad Request', { status: 400 })

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        student: true,
        feeRecord: true,
      },
    })

    if (!invoice) return new NextResponse('Invoice not found', { status: 404 })

    // Dynamically importing jsPDF and jspdf-autotable since they are large and primarily client-side
    const jsPDF = (await import('jspdf')).default
    const autoTable = (await import('jspdf-autotable')).default

    const doc = new jsPDF({ unit: 'mm', format: 'a4' })
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const marginLeft = 15
    const marginRight = 15
    const contentWidth = pageWidth - marginLeft - marginRight

    const pdfCurrency = (amount: number | string | null | undefined): string => {
      const num = typeof amount === 'string' ? parseFloat(amount) : (amount ?? 0)
      const formatted = new Intl.NumberFormat('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(num)
      return `Rs. ${formatted}`
    }

    // Header band
    doc.setFillColor(30, 34, 53)
    doc.rect(0, 0, pageWidth, 42, 'F')

    // Since Native node Canvas isn't available, we skip the WebP images on the server API endpoint
    // The client-side downloaded PDF will contain the full images.
    
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text('Bikash Educational Institution', marginLeft + 5, 18)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.text('Management System', marginLeft + 5, 24)
    doc.text('Plot No-926/A/1 Sri Vihar Colony,Tulsipur,Cuttack,753008 | admin@bikashinstitute.com | +918249297170', marginLeft + 5, 30)

    doc.setTextColor(255, 255, 255)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('INVOICE', pageWidth - marginRight, 18, { align: 'right' })
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(String(invoice.invoiceNumber ?? ''), pageWidth - marginRight, 26, { align: 'right' })
    doc.text(formatDate(invoice.issuedAt), pageWidth - marginRight, 34, { align: 'right' })

    // Billed To section
    let cursorY = 54
    doc.setTextColor(31, 41, 55)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text('BILLED TO', marginLeft, cursorY)

    cursorY += 7
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(11)
    doc.text(String(invoice.student?.name ?? ''), marginLeft, cursorY)

    cursorY += 6
    doc.setFontSize(9)
    doc.setTextColor(107, 114, 128)
    const classSchool = [invoice.student?.class, invoice.student?.school].filter(Boolean).join(' - ')
    doc.text(classSchool, marginLeft, cursorY)

    cursorY += 6
    doc.text(`Phone: ${String(invoice.student?.phone ?? 'N/A')}`, marginLeft, cursorY)

    // Items table
    cursorY += 10
    const items = Array.isArray(invoice.items) ? invoice.items : []
    const descColWidth = contentWidth * 0.7
    const amtColWidth = contentWidth * 0.3

    autoTable(doc, {
      startY: cursorY,
      head: [['Description', 'Amount (Rs.)']],
      body: items.map((item: any) => [
        String(item.description ?? ''),
        pdfCurrency(item.amount),
      ]),
      headStyles: {
        fillColor: [30, 34, 53],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
        font: 'helvetica',
        cellPadding: 5,
      },
      bodyStyles: {
        fontSize: 10,
        font: 'helvetica',
        textColor: [31, 41, 55],
        cellPadding: 5,
        overflow: 'linebreak',
      },
      columnStyles: {
        0: { cellWidth: descColWidth, halign: 'left' },
        1: { cellWidth: amtColWidth, halign: 'right', fontStyle: 'bold' },
      },
      styles: {
        font: 'helvetica',
        overflow: 'linebreak',
      },
      margin: { left: marginLeft, right: marginRight },
      tableWidth: contentWidth,
    })

    const finalY = (doc as any).lastAutoTable.finalY + 10
    const totalsX = pageWidth - 85
    const totalsRight = pageWidth - marginRight

    // Totals
    doc.setDrawColor(229, 231, 235)
    doc.line(totalsX, finalY, totalsRight, finalY)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(107, 114, 128)
    doc.text('Subtotal', totalsX, finalY + 8)
    doc.setTextColor(31, 41, 55)
    doc.text(pdfCurrency(Number(invoice.totalAmount)), totalsRight, finalY + 8, { align: 'right' })

    doc.setTextColor(107, 114, 128)
    doc.text('Amount Paid', totalsX, finalY + 16)
    doc.setTextColor(16, 185, 129)
    doc.text(pdfCurrency(Number(invoice.paidAmount)), totalsRight, finalY + 16, { align: 'right' })

    doc.setDrawColor(229, 231, 235)
    doc.line(totalsX, finalY + 20, totalsRight, finalY + 20)

    const balance = Number(invoice.totalAmount) - Number(invoice.paidAmount)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(31, 41, 55)
    doc.text('Balance Due', totalsX, finalY + 28)

    if (balance > 0) doc.setTextColor(239, 68, 68)
    else doc.setTextColor(16, 185, 129)
    
    doc.text(pdfCurrency(balance), totalsRight, finalY + 28, { align: 'right' })

    // Remarks
    let remarksEndY = finalY + 36
    if (invoice.remarks) {
      doc.setFillColor(255, 251, 235)
      doc.setDrawColor(252, 211, 77)
      doc.roundedRect(marginLeft, remarksEndY, contentWidth, 14, 2, 2, 'FD')
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(146, 64, 14)
      doc.text(`Remarks: ${String(invoice.remarks)}`, marginLeft + 4, remarksEndY + 9)
      remarksEndY += 20
    }

    // Footer
    const footerY = pageHeight - 27
    doc.setFillColor(249, 250, 251)
    doc.rect(0, footerY, pageWidth, 27, 'F')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(107, 114, 128)
    doc.text(
      'Thank you for choosing Bikash Educational Institution! For queries: admin@bikashinstitute.com | +918249297170',
      pageWidth / 2, footerY + 11, { align: 'center' }
    )
    doc.text(
      'This is a computer-generated invoice and does not require a physical signature.',
      pageWidth / 2, footerY + 17, { align: 'center' }
    )

    // Generate output as an array buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'))

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${invoice.invoiceNumber}.pdf"`,
      },
    })
  } catch (error) {
    console.error('SERVER PDF GENERATION ERROR:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
