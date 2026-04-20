'use client'

import { formatCurrency, formatDate } from '@/lib/utils'
import { X, Download, Printer, MessageCircle } from 'lucide-react'
import { StatusBadge } from '@/components/shared/StatusBadge'

interface InvoicePreviewProps {
  invoice: any
  onClose: () => void
}

export function InvoicePreview({ invoice, onClose }: InvoicePreviewProps) {
  /**
   * PDF-safe currency formatter.
   * jsPDF's built-in Helvetica font does NOT include the ₹ (U+20B9) glyph,
   * so Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' })
   * produces a character that renders as "?" or a blank box in the PDF.
   * We use "Rs." prefix instead, with Indian-locale number grouping.
   */
  const pdfCurrency = (amount: number | string | null | undefined): string => {
    const num = typeof amount === 'string' ? parseFloat(amount) : (amount ?? 0)
    const formatted = new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num)
    return `Rs. ${formatted}`
  }

  const downloadPDF = async () => {
    try {
      const jsPDF = (await import('jspdf')).default
      const autoTable = (await import('jspdf-autotable')).default

      const doc = new jsPDF({ unit: 'mm', format: 'a4' })
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      const marginLeft = 15
      const marginRight = 15
      const contentWidth = pageWidth - marginLeft - marginRight

      // ── Header band ──────────────────────────────────────────────
      doc.setFillColor(30, 34, 53)
      doc.rect(0, 0, pageWidth, 42, 'F')

      const imgUrl = '/logo.webp'
      try {
        const img = new Image()
        img.src = imgUrl
        await new Promise((resolve, reject) => {
          img.onload = resolve
          img.onerror = reject
        })
        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(img, 0, 0)
          const dataUrl = canvas.toDataURL('image/png')
          doc.addImage(dataUrl, 'PNG', marginLeft, 11, 20, 20)
        }
      } catch (e) {
        console.error('Failed to load logo for PDF', e)
      }

      doc.setTextColor(255, 255, 255)
      doc.setFontSize(20)
      doc.setFont('helvetica', 'bold')
      doc.text('BIKASH INSTITUTE', marginLeft + 24, 18)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.text('Management System', marginLeft + 24, 24)
      doc.text('Bargarh, Odisha | admin@bikashinstitute.com | +91 9000000000', marginLeft + 24, 30)

      doc.setTextColor(255, 255, 255)
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('INVOICE', pageWidth - marginRight, 18, { align: 'right' })
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text(String(invoice.invoiceNumber ?? ''), pageWidth - marginRight, 26, { align: 'right' })
      doc.text(formatDate(invoice.issuedAt), pageWidth - marginRight, 34, { align: 'right' })

      // ── Billed To section ────────────────────────────────────────
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

      // ── Items table ──────────────────────────────────────────────
      cursorY += 10
      const items = Array.isArray(invoice.items) ? invoice.items : []

      // Column widths: 70% description, 30% amount
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

      // ── Totals section ───────────────────────────────────────────
      const totalsX = pageWidth - 85
      const totalsRight = pageWidth - marginRight

      // Subtotal
      doc.setDrawColor(229, 231, 235)
      doc.line(totalsX, finalY, totalsRight, finalY)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(107, 114, 128)
      doc.text('Subtotal', totalsX, finalY + 8)
      doc.setTextColor(31, 41, 55)
      doc.text(pdfCurrency(invoice.totalAmount), totalsRight, finalY + 8, { align: 'right' })

      // Amount Paid
      doc.setTextColor(107, 114, 128)
      doc.text('Amount Paid', totalsX, finalY + 16)
      doc.setTextColor(16, 185, 129)
      doc.text(pdfCurrency(invoice.paidAmount), totalsRight, finalY + 16, { align: 'right' })

      // Divider
      doc.setDrawColor(229, 231, 235)
      doc.line(totalsX, finalY + 20, totalsRight, finalY + 20)

      // Balance Due
      const balance = Number(invoice.totalAmount) - Number(invoice.paidAmount)
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(31, 41, 55)
      doc.text('Balance Due', totalsX, finalY + 28)

      if (balance > 0) {
        doc.setTextColor(239, 68, 68) // Red for pending balance
      } else {
        doc.setTextColor(16, 185, 129) // Green for fully paid
      }
      doc.text(pdfCurrency(balance), totalsRight, finalY + 28, { align: 'right' })

      // ── Remarks (if any) ────────────────────────────────────────
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

      // ── Stamp ────────────────────────────────────────────────────
      const stampUrl = '/stamp.webp'
      try {
        const stampImg = new Image()
        stampImg.src = stampUrl
        await new Promise((resolve, reject) => {
          stampImg.onload = resolve
          stampImg.onerror = reject
        })
        const canvas = document.createElement('canvas')
        canvas.width = stampImg.width
        canvas.height = stampImg.height
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(stampImg, 0, 0)
          const dataUrl = canvas.toDataURL('image/png')
          const footerY = pageHeight - 27
          doc.addImage(dataUrl, 'PNG', pageWidth - marginRight - 28, footerY - 32, 28, 28)
        }
      } catch (e) {
        console.error('Failed to load stamp for PDF', e)
      }

      // ── Footer ───────────────────────────────────────────────────
      const footerY = pageHeight - 27
      doc.setFillColor(249, 250, 251)
      doc.rect(0, footerY, pageWidth, 27, 'F')
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(107, 114, 128)
      doc.text(
        'Thank you for choosing Bikash Institute! For queries: admin@bikashinstitute.com | +91 9000000000',
        pageWidth / 2, footerY + 11, { align: 'center' }
      )
      doc.text(
        'This is a computer-generated invoice and does not require a physical signature.',
        pageWidth / 2, footerY + 17, { align: 'center' }
      )

      doc.save(`${invoice.invoiceNumber}.pdf`)
    } catch (err) {
      console.error('PDF generation failed:', err)
      const { toast: showToast } = await import('sonner')
      showToast.error('Failed to generate PDF. Please try again.')
    }
  }

  const handleWhatsAppShare = () => {
    if (!invoice?.student?.phone) {
      alert("Phone number not available");
      return;
    }

    const phone = invoice.student.phone.replace(/\D/g, "");

    let message = `Invoice from Bikash Institute\n\n`;
    message += `Name: ${invoice.student.name}\n`;
    message += `Amount: Rs. ${invoice.totalAmount}\n`;
    message += `Status: ${invoice.feeRecord?.status || 'N/A'}\n\n`;
    message += `Thank you!`;

    // Optional: add PDF link if you have an API route
    if (invoice.id) {
      const pdfUrl = `${window.location.origin}/api/invoice/${invoice.id}/pdf`;
      message += `\n\nDownload Invoice: ${pdfUrl}`;
    }

    const encodedMessage = encodeURIComponent(message);
    const url = `https://wa.me/91${phone}?text=${encodedMessage}`;
    window.open(url, "_blank");
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[95vh] overflow-y-auto animate-fade-in">
        {/* Actions bar */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100 sticky top-0 bg-white z-10 no-print">
          <span className="text-sm font-semibold text-gray-700">Invoice Preview</span>
          <div className="flex items-center gap-2">
            <button onClick={() => window.print()} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">
              <Printer size={14} /> Print
            </button>
            <button onClick={downloadPDF} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-300 text-gray-900 text-sm hover:bg-brand-400">
              <Download size={14} /> Download PDF
            </button>
            <button onClick={handleWhatsAppShare} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#25D366] text-white text-sm hover:bg-[#20bd5a] transition">
              <MessageCircle size={14} /> WhatsApp
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X size={16} /></button>
          </div>
        </div>

        {/* Invoice body */}
        <div className="p-8" id="invoice-print">
          {/* Header */}
          <div className="flex items-start justify-between mb-8">
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <img
                src="/logo.webp"
                alt="Logo"
                style={{
                  width: '60px',
                  height: '60px',
                  objectFit: 'contain',
                }}
              />
              <div>
                <h1 className="text-xl font-bold text-gray-900" style={{ margin: 0, letterSpacing: '0.5px' }}>Bikash Institute</h1>
                <p className="text-xs text-gray-400" style={{ margin: 0 }}>Bargarh, Odisha</p>
                <p className="text-xs text-gray-400" style={{ margin: 0 }}>admin@bikashinstitute.com · +91 9000000000</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">INVOICE</div>
              <div className="text-sm font-medium text-gray-600 mt-0.5">{invoice.invoiceNumber}</div>
              <div className="text-xs text-gray-400 mt-0.5">Issued: {formatDate(invoice.issuedAt)}</div>
              <div className="mt-2"><StatusBadge status={invoice.feeRecord?.status ?? 'PENDING'} /></div>
            </div>
          </div>

          {/* Billed To */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Billed To</p>
            <p className="font-semibold text-gray-800 text-base">{invoice.student?.name}</p>
            <p className="text-sm text-gray-500">{invoice.student?.class} · {invoice.student?.school}</p>
            <p className="text-sm text-gray-500">Phone: {invoice.student?.phone}</p>
          </div>

          {/* Items */}
          <table className="w-full text-sm mb-6">
            <thead>
              <tr className="bg-gray-800 text-white">
                <th className="px-4 py-3 text-left rounded-l-lg font-semibold">Description</th>
                <th className="px-4 py-3 text-right rounded-r-lg font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody>
              {(Array.isArray(invoice.items) ? invoice.items : []).map((item: any, i: number) => (
                <tr key={i} className="border-b border-gray-100">
                  <td className="px-4 py-3 text-gray-700">{item.description}</td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-800">{formatCurrency(item.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-sm text-gray-500">
                <span>Subtotal</span>
                <span className="font-medium text-gray-800">{formatCurrency(invoice.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-500">
                <span>Amount Paid</span>
                <span className="font-medium text-emerald-600">{formatCurrency(invoice.paidAmount)}</span>
              </div>
              <div className="border-t border-gray-200 pt-2 flex justify-between text-base font-bold">
                <span>Balance Due</span>
                <span className={Number(invoice.totalAmount) - Number(invoice.paidAmount) > 0 ? 'text-rose-600' : 'text-emerald-600'}>
                  {formatCurrency(Number(invoice.totalAmount) - Number(invoice.paidAmount))}
                </span>
              </div>
            </div>
          </div>

          {invoice.remarks && (
            <div className="mt-6 p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-xs font-medium text-amber-700">Remarks: {invoice.remarks}</p>
            </div>
          )}

          {/* Stamp Alignment */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
            <img
              src="/stamp.webp"
              alt="Authorized Stamp"
              style={{
                width: '120px',
                height: '120px',
                objectFit: 'contain',
                opacity: 0.9,
              }}
            />
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-100 text-center" style={{ opacity: 0.7 }}>
            <p className="text-xs font-medium text-gray-600">Thank you for choosing Bikash Institute!</p>
            <p className="text-xs text-gray-400 mt-1">This is a computer-generated invoice.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
