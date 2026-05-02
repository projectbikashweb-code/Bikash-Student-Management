'use client'

import React from 'react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { X, Download, Printer, MessageCircle } from 'lucide-react'
import { StatusBadge } from '@/components/shared/StatusBadge'

import { useQuery } from '@tanstack/react-query'

interface InvoiceViewProps {
  invoice: any
  onClose?: () => void
  isPublic?: boolean
}

export function InvoiceView({ invoice, onClose, isPublic = false }: InvoiceViewProps) {
  const { data: settings } = useQuery({
    queryKey: ['settings-institute'],
    queryFn: async () => {
      const res = await fetch('/api/settings/institute')
      return res.json()
    }
  })

  const instituteName = settings?.name || 'Bikash Educational Institution'
  const instituteAddress = settings?.address || 'Plot No-926/A/1 Sri Vihar Colony,Tulsipur,Cuttack,753008'
  const institutePhone = settings?.phone || '+918249297170'
  const instituteEmail = settings?.email || 'admin@bikashinstitute.com'

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

      // Header band
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
      doc.text(instituteName, marginLeft + 24, 18)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.text('Management System', marginLeft + 24, 24)
      doc.text(`${instituteAddress} | ${instituteEmail} | ${institutePhone}`, marginLeft + 24, 30)

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
      doc.text(pdfCurrency(invoice.totalAmount), totalsRight, finalY + 8, { align: 'right' })

      doc.setTextColor(107, 114, 128)
      doc.text('Amount Paid', totalsX, finalY + 16)
      doc.setTextColor(16, 185, 129)
      doc.text(pdfCurrency(invoice.paidAmount), totalsRight, finalY + 16, { align: 'right' })

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

      // Stamp
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

      // Footer
      const footerY = pageHeight - 27
      doc.setFillColor(249, 250, 251)
      doc.rect(0, footerY, pageWidth, 27, 'F')
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(107, 114, 128)
      doc.text(
        `Thank you for choosing ${instituteName}! For queries: ${instituteEmail} | ${institutePhone}`,
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
      alert("Phone number not available")
      return
    }

    const phone = invoice.student.phone.replace(/\D/g, "")
    
    // Determine payment mode dynamically depending on feeRecord or default to N/A
    // PaymentHistory is attached inside student or feeRecord, but let's see what's directly in invoice.
    // Usually invoice.feeRecord?.status has the status. If needed we can adjust payment mode.
    // In Bikash system, 'payments' might be on feeRecord or student. Let's use a safe fallback.
    const paymentMode = invoice.feeRecord?.payments?.length 
      ? invoice.feeRecord.payments[invoice.feeRecord.payments.length - 1].paymentMode 
      : 'N/A'

    let message = `🎓 ${instituteName}\n\n`
    message += `Invoice for: ${invoice.student.name}\n`
    message += `Amount: ₹${invoice.totalAmount}\n`
    message += `Status: ${invoice.feeRecord?.status || 'N/A'}\n`
    if (paymentMode !== 'N/A') {
      message += `Paid via: ${paymentMode}\n`
    } else {
      message += `Payment due.\n`
    }
    
    message += `\n🔗 View Invoice:\n`
    message += `${window.location.origin}/invoice/${invoice.id}\n\n`
    message += `Thank you!`

    const encodedMessage = encodeURIComponent(message)
    const url = `https://wa.me/91${phone}?text=${encodedMessage}`
    window.open(url, "_blank")
  }

  return (
    <div className={`relative bg-white shadow-2xl w-full max-w-2xl mx-auto overflow-y-auto print:static print:w-full print:max-w-none print:m-0 print:p-0 print:shadow-none print:overflow-visible print:bg-transparent ${isPublic ? 'my-8 sm:rounded-2xl min-h-screen sm:min-h-0' : 'rounded-2xl max-h-[95vh] animate-fade-in'}`}>
      {/* Actions bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100 sticky top-0 bg-white z-10 no-print">
        <span className="text-sm font-semibold text-gray-700">Invoice{isPublic ? '' : ' Preview'}</span>
        <div className="flex items-center gap-2">
          <button onClick={() => window.print()} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition">
            <Printer size={14} /> <span className="hidden sm:inline">Print</span>
          </button>
          <button onClick={downloadPDF} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-300 text-gray-900 text-sm hover:bg-brand-400 transition">
            <Download size={14} /> <span className="hidden sm:inline">Download PDF</span>
          </button>
          {!isPublic && (
            <button onClick={handleWhatsAppShare} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#25D366] text-white text-sm hover:bg-[#20bd5a] transition">
              <MessageCircle size={14} /> <span className="hidden sm:inline">WhatsApp</span>
            </button>
          )}
          {onClose && (
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 ml-2 transition"><X size={16} /></button>
          )}
        </div>
      </div>

      {/* Invoice body */}
      <div className="p-4 sm:p-8" id="invoice-print">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-8 gap-4 sm:gap-0">
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
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 leading-tight" style={{ margin: 0, letterSpacing: '0.5px' }}>{instituteName}</h1>
              <p className="text-xs text-gray-400" style={{ margin: 0 }}>{instituteAddress}</p>
              <p className="text-xs text-gray-400" style={{ margin: 0 }}>{instituteEmail} · {institutePhone}</p>
            </div>
          </div>
          <div className="text-left sm:text-right print:text-right">
            <div className="text-2xl font-bold text-gray-900 print:text-gray-900">INVOICE</div>
            <div className="text-sm font-medium text-gray-600 mt-0.5">{invoice.invoiceNumber}</div>
            <div className="text-xs text-gray-400 mt-0.5">Issued: {formatDate(invoice.issuedAt)}</div>
            <div className="mt-2 text-left sm:text-right print:text-right w-full sm:w-auto flex sm:justify-end print:justify-end">
              <StatusBadge status={invoice.feeRecord?.status ?? 'PENDING'} />
            </div>
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
        <div className="overflow-x-auto w-full">
          <table className="w-full text-sm mb-6 min-w-full">
            <thead>
              <tr className="bg-gray-800 text-white print:bg-gray-800 print:text-white">
                <th className="px-4 py-3 text-left rounded-l-lg font-semibold">Description</th>
                <th className="px-4 py-3 text-right rounded-r-lg font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody>
              {(Array.isArray(invoice.items) ? invoice.items : []).map((item: any, i: number) => (
                <tr key={i} className="border-b border-gray-100 print:border-gray-200">
                  <td className="px-4 py-3 text-gray-700 font-medium">{item.description}</td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-800">{formatCurrency(item.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-full sm:w-64 space-y-2">
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
          <div className="mt-6 p-3 bg-amber-50 border border-amber-200 rounded-xl print:bg-amber-50 print:border-amber-200">
            <p className="text-xs font-medium text-amber-700">Remarks: {invoice.remarks}</p>
          </div>
        )}

        {/* Stamp Alignment */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
          <img
            src="/stamp.webp"
            alt="Authorized Stamp"
            style={{
              width: '100px',
              height: '100px',
              objectFit: 'contain',
              opacity: 0.9,
            }}
          />
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-100 text-center" style={{ opacity: 0.7 }}>
          <p className="text-xs font-medium text-gray-600">Thank you for choosing {instituteName}!</p>
          <p className="text-xs text-gray-400 mt-1">This is a computer-generated invoice.</p>
        </div>
      </div>
    </div>
  )
}
