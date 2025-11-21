import PDFDocument from 'pdfkit'
import { db } from '../../db'
import { orders, accounts, products, addresses } from '../../db/schema'
import { eq, and } from 'drizzle-orm'
import path from 'path'
import fs from 'fs'

export class InvoicePDFService {
  async generateInvoicePDF(orderId: string, type: 'seller' | 'buyer'): Promise<Buffer> {
    // Fetch order with all details
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))

    if (!order) {
      throw new Error('Order not found')
    }

    // Fetch seller with address
    const [seller] = await db
      .select({
        id: accounts.id,
        name: accounts.name,
        code: accounts.code,
        addressLine1: addresses.line1,
        addressLine2: addresses.line2,
        city: addresses.city,
        state: addresses.state,
        postalCode: addresses.postalCode,
      })
      .from(accounts)
      .leftJoin(addresses, and(
        eq(addresses.accountId, accounts.id),
        eq(addresses.isPrimary, true)
      ))
      .where(eq(accounts.id, order.sellerId))

    // Fetch buyer with address
    const [buyer] = await db
      .select({
        id: accounts.id,
        name: accounts.name,
        code: accounts.code,
        addressLine1: addresses.line1,
        addressLine2: addresses.line2,
        city: addresses.city,
        state: addresses.state,
        postalCode: addresses.postalCode,
      })
      .from(accounts)
      .leftJoin(addresses, and(
        eq(addresses.accountId, accounts.id),
        eq(addresses.isPrimary, true)
      ))
      .where(eq(accounts.id, order.buyerId))

    // Fetch product
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, order.productId))

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          margin: 50,
          size: 'LETTER',
        })
        const buffers: Buffer[] = []

        doc.on('data', buffers.push.bind(buffers))
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(buffers)
          resolve(pdfBuffer)
        })
        doc.on('error', reject)

        const pageWidth = doc.page.width
        const margin = 50
        const isSeller = type === 'seller'

        // Logo at top-left
        const logoPath = path.join(__dirname, '../../assets/logo.png')
        if (fs.existsSync(logoPath)) {
          doc.image(logoPath, margin, 40, { width: 120 })
        }

        // INVOICE header - centered
        doc
          .fontSize(24)
          .font('Helvetica-Bold')
          .fillColor('#000000')
          .text('INVOICE', 0, 50, {
            align: 'center',
            width: pageWidth,
          })

        // Invoice details - right side
        const rightX = pageWidth - margin - 200
        let currentY = 100

        doc
          .fontSize(10)
          .font('Helvetica-Bold')
          .text('Invoice #:', rightX, currentY)
          .font('Helvetica')
          .text(order.orderNo, rightX + 70, currentY)

        currentY += 15
        doc
          .font('Helvetica-Bold')
          .text('Date:', rightX, currentY)
          .font('Helvetica')
          .text(new Date(order.createdAt).toLocaleDateString('en-US'), rightX + 70, currentY)

        currentY += 15
        doc
          .font('Helvetica-Bold')
          .text('Due Date:', rightX, currentY)
          .font('Helvetica')
          .text(new Date(order.shipDate || order.createdAt).toLocaleDateString('en-US'), rightX + 70, currentY)

        // From/To section
        currentY = 100
        doc
          .fontSize(11)
          .font('Helvetica-Bold')
          .text(isSeller ? 'BILL FROM:' : 'BILL TO:', margin, currentY)

        currentY += 20
        const fromAccount = isSeller ? seller : buyer
        doc
          .fontSize(10)
          .font('Helvetica-Bold')
          .text(fromAccount?.name || 'N/A', margin, currentY)

        currentY += 15
        if (fromAccount?.addressLine1) {
          doc.font('Helvetica').text(fromAccount.addressLine1, margin, currentY)
          currentY += 12
        }
        if (fromAccount?.addressLine2) {
          doc.text(fromAccount.addressLine2, margin, currentY)
          currentY += 12
        }
        if (fromAccount?.city || fromAccount?.state || fromAccount?.postalCode) {
          doc.text(
            `${fromAccount?.city || ''}, ${fromAccount?.state || ''} ${fromAccount?.postalCode || ''}`.trim(),
            margin,
            currentY
          )
          currentY += 12
        }

        // Bill To section
        currentY += 20
        doc
          .fontSize(11)
          .font('Helvetica-Bold')
          .text(isSeller ? 'BILL TO:' : 'PAYMENT TO:', margin, currentY)

        currentY += 20
        const toAccount = isSeller ? buyer : seller
        doc
          .fontSize(10)
          .font('Helvetica-Bold')
          .text(toAccount?.name || 'N/A', margin, currentY)

        currentY += 15
        if (toAccount?.addressLine1) {
          doc.font('Helvetica').text(toAccount.addressLine1, margin, currentY)
          currentY += 12
        }
        if (toAccount?.addressLine2) {
          doc.text(toAccount.addressLine2, margin, currentY)
          currentY += 12
        }
        if (toAccount?.city || toAccount?.state || toAccount?.postalCode) {
          doc.text(
            `${toAccount?.city || ''}, ${toAccount?.state || ''} ${toAccount?.postalCode || ''}`.trim(),
            margin,
            currentY
          )
        }

        // Items table
        currentY = 300
        const tableWidth = pageWidth - (margin * 2)
        const colWidths = [250, 80, 80, 100]

        // Table header
        doc
          .fontSize(10)
          .font('Helvetica-Bold')
          .fillColor('#FFFFFF')
          .rect(margin, currentY, tableWidth, 25)
          .fill('#2563eb')

        doc
          .fillColor('#FFFFFF')
          .text('Description', margin + 5, currentY + 8, { width: colWidths[0] })
          .text('Quantity', margin + colWidths[0] + 5, currentY + 8, { width: colWidths[1], align: 'right' })
          .text('Price', margin + colWidths[0] + colWidths[1] + 5, currentY + 8, { width: colWidths[2], align: 'right' })
          .text('Total', margin + colWidths[0] + colWidths[1] + colWidths[2] + 5, currentY + 8, { width: colWidths[3], align: 'right' })

        currentY += 25

        // Table row
        doc
          .fontSize(10)
          .font('Helvetica')
          .fillColor('#000000')
          .rect(margin, currentY, tableWidth, 30)
          .stroke()

        const quantity = parseFloat(order.quantity)
        const price = parseFloat(order.pricePerUnit)
        const total = parseFloat(order.totalValue)

        doc
          .text(product?.name || 'Product', margin + 5, currentY + 10, { width: colWidths[0] })
          .text(quantity.toLocaleString(), margin + colWidths[0] + 5, currentY + 10, { width: colWidths[1], align: 'right' })
          .text(`$${price.toFixed(2)}`, margin + colWidths[0] + colWidths[1] + 5, currentY + 10, { width: colWidths[2], align: 'right' })
          .text(`$${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, margin + colWidths[0] + colWidths[1] + colWidths[2] + 5, currentY + 10, { width: colWidths[3], align: 'right' })

        currentY += 30

        // Totals section
        currentY += 20
        const totalsX = pageWidth - margin - 200

        doc
          .fontSize(10)
          .font('Helvetica-Bold')
          .text('Subtotal:', totalsX, currentY)
          .text(`$${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, totalsX + 100, currentY, { align: 'right', width: 100 })

        currentY += 20
        doc
          .fontSize(12)
          .text('TOTAL:', totalsX, currentY)
          .text(`$${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, totalsX + 100, currentY, { align: 'right', width: 100 })

        // Notes
        if (order.notes) {
          currentY += 40
          doc
            .fontSize(10)
            .font('Helvetica-Bold')
            .text('Notes:', margin, currentY)

          currentY += 15
          doc
            .font('Helvetica')
            .text(order.notes, margin, currentY, { width: tableWidth })
        }

        // Footer
        doc
          .fontSize(9)
          .font('Helvetica')
          .fillColor('#666666')
          .text(
            'The Kadouri Connection | 525 Northern Blvd, Suite 205 | Great Neck, NY 11021 | USA',
            margin,
            doc.page.height - 50,
            { align: 'center', width: tableWidth }
          )

        doc.end()
      } catch (error) {
        reject(error)
      }
    })
  }
}
