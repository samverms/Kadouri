import PDFDocument from 'pdfkit'
import { db } from '../../db'
import { orders, orderLines, accounts, products, addresses, agents, pdfs, orderAttachments } from '../../db/schema'
import { eq, and } from 'drizzle-orm'
import path from 'path'
import fs from 'fs'
import { S3Service } from '../storage/s3-service'

export class InvoicePDFService {
  private s3Service: S3Service

  constructor() {
    this.s3Service = new S3Service()
  }

  async generateInvoicePDF(orderId: string, type: 'seller' | 'buyer', userId?: string): Promise<Buffer> {
    // Fetch order with all details
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))

    if (!order) {
      throw new Error('Order not found')
    }

    // Fetch order lines with products and package type info
    const lines = await db
      .select({
        id: orderLines.id,
        productId: orderLines.productId,
        quantity: orderLines.quantity,
        unitPrice: orderLines.unitPrice,
        unitSize: orderLines.unitSize,
        uom: orderLines.uom,
        totalWeight: orderLines.totalWeight,
        lineTotal: orderLines.lineTotal,
        productName: products.name,
        sizeGrade: orderLines.sizeGrade,
        packageType: orderLines.packageType,
        commissionPct: orderLines.commissionPct,
        commissionAmt: orderLines.commissionAmt,
      })
      .from(orderLines)
      .leftJoin(products, eq(orderLines.productId, products.id))
      .where(eq(orderLines.orderId, orderId))

    // Fetch seller account with primary address
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

    // Fetch buyer account with primary address
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

    // Fetch agent name
    let agentName = 'N/A'
    if (order.agentId) {
      const [agent] = await db
        .select()
        .from(agents)
        .where(eq(agents.id, order.agentId))
      if (agent) {
        agentName = agent.name
      }
    }

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          margin: 50,
          size: 'LETTER',
        })
        const buffers: Buffer[] = []

        doc.on('data', buffers.push.bind(buffers))
        doc.on('end', async () => {
          const pdfBuffer = Buffer.concat(buffers)

          // Upload to S3 and save to database
          try {
            const fileName = `${type}-invoice-${order.orderNo}.pdf`
            const s3Key = `invoices/${order.orderNo}/${fileName}`
            const s3Url = await this.s3Service.uploadFile(s3Key, pdfBuffer, 'application/pdf')

            // Save to pdfs table
            await db.insert(pdfs).values({
              orderId: order.id,
              type,
              url: s3Url,
              version: 1,
            })

            // Save to orderAttachments table
            if (userId) {
              await db.insert(orderAttachments).values({
                orderId: order.id,
                fileName,
                fileUrl: s3Url,
                fileSize: pdfBuffer.length,
                fileType: 'application/pdf',
                uploadedBy: userId,
              })
            }
          } catch (error) {
            console.error('Failed to save PDF to S3/database:', error)
            // Don't reject - still return the PDF buffer to user
          }

          resolve(pdfBuffer)
        })
        doc.on('error', reject)

        const pageWidth = doc.page.width
        const margin = 50
        const isSeller = type === 'seller'

        // Logo at top-left - try multiple paths for Heroku compatibility
        const logoPaths = [
          path.join(__dirname, '../../assets/logo.png'),
          path.join(process.cwd(), 'apps/api/src/assets/logo.png'),
          path.join(process.cwd(), 'dist/assets/logo.png'),
          '/app/dist/assets/logo.png', // Heroku absolute path
        ]

        let logoLoaded = false
        for (const logoPath of logoPaths) {
          if (fs.existsSync(logoPath)) {
            try {
              doc.image(logoPath, margin, 40, { width: 80 })
              logoLoaded = true
              break
            } catch (err) {
              // Try next path
            }
          }
        }

        // Order details - right side
        const rightX = pageWidth - margin - 200
        let currentY = 50
        const paymentTerms = order.terms || 'NET 30 DAYS'

        doc
          .fontSize(14)
          .font('Helvetica-Bold')
          .fillColor('#000000')
          .text(`Order #${order.orderNo}`, rightX, currentY, { align: 'right', width: 200 })

        currentY += 20
        doc
          .fontSize(10)
          .font('Helvetica')
          .text(`Date: ${new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}`, rightX, currentY, { align: 'right', width: 200 })

        currentY += 15
        doc
          .text(`Agent: ${agentName}`, rightX, currentY, { align: 'right', width: 200 })

        currentY += 15
        doc
          .text(`Payment Terms: ${paymentTerms}`, rightX, currentY, { align: 'right', width: 200 })

        // "Confirmation of Sale" subtitle
        doc
          .fontSize(11)
          .font('Helvetica')
          .fillColor('#999999')
          .text('Confirmation of Sale', margin, 100)

        // Seller and Buyer Information boxes - side by side
        currentY = 130
        const boxWidth = (pageWidth - margin * 2 - 20) / 2
        const leftBoxX = margin
        const rightBoxX = margin + boxWidth + 20

        // Draw boxes
        doc
          .strokeColor('#CCCCCC')
          .lineWidth(1)
          .rect(leftBoxX, currentY, boxWidth, 140)
          .stroke()

        doc
          .rect(rightBoxX, currentY, boxWidth, 140)
          .stroke()

        // Seller Information
        let boxY = currentY + 10
        doc
          .fontSize(11)
          .font('Helvetica-Bold')
          .fillColor('#000000')
          .text('Seller Information', leftBoxX + 10, boxY)

        boxY += 20
        doc
          .fontSize(10)
          .font('Helvetica-Bold')
          .text(seller?.name || 'N/A', leftBoxX + 10, boxY, { width: boxWidth - 20 })

        boxY += 15

        // Address
        if (seller) {
          doc.font('Helvetica')
          if (seller.addressLine1) {
            doc.text(seller.addressLine1, leftBoxX + 10, boxY, { width: boxWidth - 20 })
            boxY += 12
          }
          if (seller.addressLine2) {
            doc.text(seller.addressLine2, leftBoxX + 10, boxY, { width: boxWidth - 20 })
            boxY += 12
          }
          const cityStateZip = [seller.city, seller.state, seller.postalCode].filter(Boolean).join(', ')
          if (cityStateZip) {
            doc.text(cityStateZip, leftBoxX + 10, boxY, { width: boxWidth - 20 })
            boxY += 15
          }
        }

        // PO# at bottom of box (seller gets PO)
        doc.fontSize(9).text(`PO#: ${order.poNumber || 'TBA'}`, leftBoxX + 10, currentY + 125)

        // Buyer Information
        boxY = currentY + 10
        doc
          .fontSize(11)
          .font('Helvetica-Bold')
          .text('Buyer Information', rightBoxX + 10, boxY)

        boxY += 20
        doc
          .fontSize(10)
          .font('Helvetica-Bold')
          .text(buyer?.name || 'N/A', rightBoxX + 10, boxY, { width: boxWidth - 20 })

        boxY += 15

        // Address
        if (buyer) {
          doc.font('Helvetica')
          if (buyer.addressLine1) {
            doc.text(buyer.addressLine1, rightBoxX + 10, boxY, { width: boxWidth - 20 })
            boxY += 12
          }
          if (buyer.addressLine2) {
            doc.text(buyer.addressLine2, rightBoxX + 10, boxY, { width: boxWidth - 20 })
            boxY += 12
          }
          const cityStateZip = [buyer.city, buyer.state, buyer.postalCode].filter(Boolean).join(', ')
          if (cityStateZip) {
            doc.text(cityStateZip, rightBoxX + 10, boxY, { width: boxWidth - 20 })
            boxY += 15
          }
        }

        // Sales Confirmation No. at bottom of box (buyer gets sales conf)
        doc.fontSize(9).text(`Sales Confirmation No.: ${order.contractNo || 'TBA'}`, rightBoxX + 10, currentY + 125)

        // Product Details section
        currentY = 290
        doc
          .fontSize(12)
          .font('Helvetica-Bold')
          .fillColor('#000000')
          .text('Product Details', margin, currentY)

        currentY += 25

        // Table setup - matching orders page format
        const tableWidth = pageWidth - (margin * 2) // 512px for LETTER size
        let colWidths: number[]

        if (isSeller) {
          // Seller: #, Product, Variant, Qty, $/lb, Total, %, Comm (total = 512px)
          colWidths = [25, 120, 100, 50, 50, 70, 40, 57]
        } else {
          // Buyer: #, Product, Variant, Qty, $/lb, Total (NO commission columns) (total = 512px)
          colWidths = [30, 150, 120, 60, 60, 92]
        }

        // Table header
        doc
          .fontSize(9)
          .font('Helvetica-Bold')
          .fillColor('#FFFFFF')
          .rect(margin, currentY, tableWidth, 20)
          .fill('#4F46E5') // Indigo color matching orders page

        let colX = margin + 5
        doc.fillColor('#FFFFFF').text('#', colX, currentY + 6, { width: colWidths[0] - 10 })
        colX += colWidths[0]
        doc.text('Product', colX, currentY + 6, { width: colWidths[1] - 10 })
        colX += colWidths[1]
        doc.text('Variant', colX, currentY + 6, { width: colWidths[2] - 10 })
        colX += colWidths[2]
        doc.text('Qty', colX, currentY + 6, { width: colWidths[3] - 10, align: 'right' })
        colX += colWidths[3]
        doc.text('$/lb', colX, currentY + 6, { width: colWidths[4] - 10, align: 'right' })
        colX += colWidths[4]
        doc.text('Total', colX, currentY + 6, { width: colWidths[5] - 10, align: 'right' })

        // Only show commission columns for seller
        if (isSeller) {
          colX += colWidths[5]
          doc.text('%', colX, currentY + 6, { width: colWidths[6] - 10, align: 'right' })
          colX += colWidths[6]
          doc.text('Comm', colX, currentY + 6, { width: colWidths[7] - 10, align: 'right' })
        }

        currentY += 20

        // Table rows - iterate through order lines
        let grandTotal = 0
        let totalCommission = 0

        lines.forEach((line, index) => {
          const quantity = parseFloat(line.quantity)
          const price = parseFloat(line.unitPrice)
          const total = parseFloat(line.lineTotal)
          const commissionPct = parseFloat(line.commissionPct || '0')
          const commissionAmt = parseFloat(line.commissionAmt || '0')
          grandTotal += total
          totalCommission += commissionAmt

          const rowHeight = 30
          doc
            .strokeColor('#CCCCCC')
            .rect(margin, currentY, tableWidth, rowHeight)
            .stroke()

          doc
            .fontSize(9)
            .font('Helvetica')
            .fillColor('#000000')

          colX = margin + 5

          // Line number
          doc.text((index + 1).toString(), colX, currentY + 10, { width: colWidths[0] - 10 })
          colX += colWidths[0]

          // Product name
          doc.text(line.productName || 'Product', colX, currentY + 10, { width: colWidths[1] - 10 })
          colX += colWidths[1]

          // Variant (size + unit + package type)
          const variantLabel = line.unitSize && line.uom && line.packageType
            ? `${parseFloat(line.unitSize).toLocaleString()} ${line.uom} ${line.packageType}`
            : (line.sizeGrade || '-')
          doc.text(variantLabel, colX, currentY + 10, { width: colWidths[2] - 10 })
          colX += colWidths[2]

          // Quantity
          doc.text(quantity.toLocaleString(), colX, currentY + 10, { width: colWidths[3] - 10, align: 'right' })
          colX += colWidths[3]

          // Price per unit
          doc.text(`$${price.toFixed(2)}`, colX, currentY + 10, { width: colWidths[4] - 10, align: 'right' })
          colX += colWidths[4]

          // Total
          doc.text(`$${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, colX, currentY + 10, { width: colWidths[5] - 10, align: 'right' })

          // Commission columns (seller only)
          if (isSeller) {
            colX += colWidths[5]
            // Commission %
            doc.fillColor('#000000').text(commissionPct.toFixed(1), colX, currentY + 10, { width: colWidths[6] - 10, align: 'right' })
            colX += colWidths[6]
            // Commission amount (NO GREEN COLOR)
            doc.fillColor('#000000').text(`$${commissionAmt.toFixed(2)}`, colX, currentY + 10, { width: colWidths[7] - 10, align: 'right' })
          }

          currentY += rowHeight
        })

        // Remarks and Order Summary boxes
        currentY += 30
        const palletCount = order.palletCount || 0
        const remarksBoxWidth = boxWidth
        const summaryBoxWidth = boxWidth

        // Remarks box (left)
        doc
          .strokeColor('#CCCCCC')
          .rect(margin, currentY, remarksBoxWidth, 80)
          .stroke()

        doc
          .fontSize(11)
          .font('Helvetica-Bold')
          .text('Remarks', margin + 10, currentY + 10)

        if (order.notes) {
          doc
            .fontSize(9)
            .font('Helvetica')
            .text(order.notes, margin + 10, currentY + 30, { width: remarksBoxWidth - 20 })
        }

        // # of Pallets (above Order Summary) - RIGHT ALIGNED
        doc
          .fontSize(10)
          .font('Helvetica')
          .fillColor('#000000')
          .text(`# of Pallets: ${palletCount}`, rightBoxX, currentY - 10, { align: 'right', width: summaryBoxWidth })

        // Order Summary box (right)
        doc
          .strokeColor('#CCCCCC')
          .rect(rightBoxX, currentY, summaryBoxWidth, 80)
          .stroke()

        doc
          .fontSize(11)
          .font('Helvetica-Bold')
          .text('Order Summary', rightBoxX + 10, currentY + 10)

        let summaryY = currentY + 30

        if (isSeller) {
          // SELLER: Item Total, Commission Total, Total Due
          doc
            .fontSize(10)
            .font('Helvetica')
            .fillColor('#000000')
            .text('Item Total:', rightBoxX + 10, summaryY)
            .text(`$${grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, rightBoxX + summaryBoxWidth - 110, summaryY, { align: 'right', width: 100 })

          summaryY += 15
          doc
            .text('Commission Total:', rightBoxX + 10, summaryY)
            .text(`$${totalCommission.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, rightBoxX + summaryBoxWidth - 110, summaryY, { align: 'right', width: 100 })

          summaryY += 15
          doc
            .font('Helvetica-Bold')
            .fillColor('#000000')
            .text('Total Due:', rightBoxX + 10, summaryY)
            .font('Helvetica-Bold') // BOLD THE AMOUNT
            .text(`$${totalCommission.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, rightBoxX + summaryBoxWidth - 110, summaryY, { align: 'right', width: 100 })
        } else {
          // BUYER: Just Total
          doc
            .fontSize(10)
            .font('Helvetica')
            .fillColor('#000000')
            .text('Total:', rightBoxX + 10, summaryY)
            .text(`$${grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, rightBoxX + summaryBoxWidth - 110, summaryY, { align: 'right', width: 100 })
        }

        // Footer disclaimer - MORE spacing to prevent overlap
        currentY += 150
        doc
          .strokeColor('#CCCCCC')
          .lineWidth(1)
          .dash(5, { space: 3 })
          .rect(margin, currentY, tableWidth, 95)
          .stroke()
          .undash()

        doc
          .fontSize(8)
          .font('Helvetica')
          .fillColor('#000000')
          .text(
            'The parties acknowledge and agree that Global Crop Exchange is acting as a broker in this transaction and cannot control and shall have no liability for delivery goods, quality, or timeliness of shipments. All obligations under this agreement are between buyer and seller as principal.',
            margin + 10,
            currentY + 8,
            { width: tableWidth - 20, align: 'justify', lineGap: 2 }
          )

        doc
          .font('Helvetica-Bold')
          .text(
            'PALLETS MUST BE PURCHASED OR EXCHANGED BY BUYER-BROKER WILL NOT BE RESPONSIBLE FOR ANY PALLET DEDUCTIONS.',
            margin + 10,
            currentY + 35,
            { width: tableWidth - 20, lineGap: 2 }
          )

        doc
          .font('Helvetica')
          .text(
            'This is the copy you will receive from Global Crop Exchange.',
            margin + 10,
            currentY + 52,
            { width: tableWidth - 20, lineGap: 1 }
          )

        doc.text(
          'If you require an original by mail please call or FAX your request to our office',
          margin + 10,
          currentY + 65,
          { width: tableWidth - 20, lineGap: 1 }
        )

        doc.end()
      } catch (error) {
        reject(error)
      }
    })
  }
}
