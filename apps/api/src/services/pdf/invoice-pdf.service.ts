import PDFDocument from 'pdfkit'
import { db } from '../../db'
import { orders, orderLines, accounts, products, addresses, agents, pdfs, orderAttachments } from '../../db/schema'
import { eq, and } from 'drizzle-orm'
import path from 'path'
import fs from 'fs'
import { CloudinaryService } from '../storage/cloudinary-service'

export class InvoicePDFService {
  private cloudinaryService: CloudinaryService

  constructor() {
    this.cloudinaryService = new CloudinaryService()
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

    // Fetch seller account
    const [seller] = await db
      .select({
        id: accounts.id,
        name: accounts.name,
        code: accounts.code,
      })
      .from(accounts)
      .where(eq(accounts.id, order.sellerId))

    // Fetch seller billing address from order's address ID
    let sellerAddress: {
      id: string
      line1: string
      line2: string | null
      city: string
      state: string
      postalCode: string
    } | null = null
    if (order.sellerBillingAddressId) {
      const [addr] = await db
        .select({
          id: addresses.id,
          line1: addresses.line1,
          line2: addresses.line2,
          city: addresses.city,
          state: addresses.state,
          postalCode: addresses.postalCode,
        })
        .from(addresses)
        .where(eq(addresses.id, order.sellerBillingAddressId))
      sellerAddress = addr || null
    }

    // Fallback to primary address if order doesn't have address ID
    if (!sellerAddress) {
      const [addr] = await db
        .select({
          id: addresses.id,
          line1: addresses.line1,
          line2: addresses.line2,
          city: addresses.city,
          state: addresses.state,
          postalCode: addresses.postalCode,
        })
        .from(addresses)
        .where(and(
          eq(addresses.accountId, order.sellerId),
          eq(addresses.isPrimary, true)
        ))
      sellerAddress = addr || null
    }

    // Fetch seller pickup address
    let sellerPickupAddress: {
      id: string
      line1: string
      line2: string | null
      city: string
      state: string
      postalCode: string
    } | null = null
    if (order.sellerPickupAddressId) {
      const [addr] = await db
        .select({
          id: addresses.id,
          line1: addresses.line1,
          line2: addresses.line2,
          city: addresses.city,
          state: addresses.state,
          postalCode: addresses.postalCode,
        })
        .from(addresses)
        .where(eq(addresses.id, order.sellerPickupAddressId))
      sellerPickupAddress = addr || null
    }

    // Fetch buyer account
    const [buyer] = await db
      .select({
        id: accounts.id,
        name: accounts.name,
        code: accounts.code,
      })
      .from(accounts)
      .where(eq(accounts.id, order.buyerId))

    // Fetch buyer billing address from order's address ID
    let buyerAddress: {
      id: string
      line1: string
      line2: string | null
      city: string
      state: string
      postalCode: string
    } | null = null
    if (order.buyerBillingAddressId) {
      const [addr] = await db
        .select({
          id: addresses.id,
          line1: addresses.line1,
          line2: addresses.line2,
          city: addresses.city,
          state: addresses.state,
          postalCode: addresses.postalCode,
        })
        .from(addresses)
        .where(eq(addresses.id, order.buyerBillingAddressId))
      buyerAddress = addr || null
    }

    // Fallback to primary address if order doesn't have address ID
    if (!buyerAddress) {
      const [addr] = await db
        .select({
          id: addresses.id,
          line1: addresses.line1,
          line2: addresses.line2,
          city: addresses.city,
          state: addresses.state,
          postalCode: addresses.postalCode,
        })
        .from(addresses)
        .where(and(
          eq(addresses.accountId, order.buyerId),
          eq(addresses.isPrimary, true)
        ))
      buyerAddress = addr || null
    }

    // Fetch buyer shipping address
    let buyerShippingAddress: {
      id: string
      line1: string
      line2: string | null
      city: string
      state: string
      postalCode: string
    } | null = null
    if (order.buyerShippingAddressId) {
      const [addr] = await db
        .select({
          id: addresses.id,
          line1: addresses.line1,
          line2: addresses.line2,
          city: addresses.city,
          state: addresses.state,
          postalCode: addresses.postalCode,
        })
        .from(addresses)
        .where(eq(addresses.id, order.buyerShippingAddressId))
      buyerShippingAddress = addr || null
    }

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

          // Upload to Cloudinary and save to database
          try {
            // Don't include .pdf extension - Cloudinary auto-adds it based on content type
            const fileName = `${type}-invoice-${order.orderNo}`
            const key = `invoices/${order.orderNo}/${fileName}`
            const fileUrl = await this.cloudinaryService.uploadFile(key, pdfBuffer, 'application/pdf')

            // Save to pdfs table
            await db.insert(pdfs).values({
              orderId: order.id,
              type,
              url: fileUrl,
              version: 1,
            })

            // Save to orderAttachments table
            if (userId) {
              await db.insert(orderAttachments).values({
                orderId: order.id,
                fileName,
                fileUrl,
                fileSize: pdfBuffer.length,
                fileType: 'application/pdf',
                uploadedBy: userId,
              })
            }
          } catch (error) {
            console.error('Failed to save PDF to Cloudinary/database:', error)
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

        // "Confirmation of Sale" - CENTERED H1
        doc
          .fontSize(18)
          .font('Helvetica-Bold')
          .fillColor('#000000')
          .text('Confirmation of Sale', 0, 115, { align: 'center', width: pageWidth })

        // Seller and Buyer Information boxes - side by side (DYNAMIC HEIGHT)
        currentY = 140
        const boxWidth = (pageWidth - margin * 2 - 20) / 2
        const leftBoxX = margin
        const rightBoxX = margin + boxWidth + 20
        const boxStartY = currentY

        // Seller Information
        let sellerBoxY = boxStartY + 10
        doc
          .fontSize(9)
          .font('Helvetica-Bold')
          .fillColor('#0066CC')  // BLUE for Seller Information
          .text('Seller Information', leftBoxX + 10, sellerBoxY)

        sellerBoxY += 15
        doc
          .fontSize(12)
          .font('Helvetica-Bold')
          .fillColor('#000000')
          .text(seller?.name || 'N/A', leftBoxX + 10, sellerBoxY, { width: boxWidth - 20 })

        sellerBoxY += 18

        // Billing Address
        doc.fontSize(8).font('Helvetica').text('Billing Address:', leftBoxX + 10, sellerBoxY)
        sellerBoxY += 10
        if (sellerAddress) {
          doc.fontSize(9).font('Helvetica')
          if (sellerAddress.line1) {
            doc.text(sellerAddress.line1, leftBoxX + 10, sellerBoxY, { width: boxWidth - 20 })
            sellerBoxY += 10
          }
          if (sellerAddress.line2) {
            doc.text(sellerAddress.line2, leftBoxX + 10, sellerBoxY, { width: boxWidth - 20 })
            sellerBoxY += 10
          }
          const cityStateZip = [sellerAddress.city, sellerAddress.state, sellerAddress.postalCode].filter(Boolean).join(', ')
          if (cityStateZip) {
            doc.text(cityStateZip, leftBoxX + 10, sellerBoxY, { width: boxWidth - 20 })
            sellerBoxY += 12
          }
        } else {
          doc.fontSize(9).text('N/A', leftBoxX + 10, sellerBoxY)
          sellerBoxY += 12
        }

        // Pickup Address
        sellerBoxY += 5
        doc.fontSize(8).font('Helvetica').text('Pickup Address:', leftBoxX + 10, sellerBoxY)
        sellerBoxY += 10
        if (sellerPickupAddress) {
          doc.fontSize(9).font('Helvetica')
          if (sellerPickupAddress.line1) {
            doc.text(sellerPickupAddress.line1, leftBoxX + 10, sellerBoxY, { width: boxWidth - 20 })
            sellerBoxY += 10
          }
          if (sellerPickupAddress.line2) {
            doc.text(sellerPickupAddress.line2, leftBoxX + 10, sellerBoxY, { width: boxWidth - 20 })
            sellerBoxY += 10
          }
          const cityStateZip = [sellerPickupAddress.city, sellerPickupAddress.state, sellerPickupAddress.postalCode].filter(Boolean).join(', ')
          if (cityStateZip) {
            doc.text(cityStateZip, leftBoxX + 10, sellerBoxY, { width: boxWidth - 20 })
            sellerBoxY += 12
          }
        } else {
          doc.fontSize(9).text('N/A', leftBoxX + 10, sellerBoxY)
          sellerBoxY += 12
        }

        // PO# at bottom
        sellerBoxY += 5
        doc.fontSize(9).font('Helvetica').text(`PO#: ${order.poNumber || 'TBA'}`, leftBoxX + 10, sellerBoxY)
        sellerBoxY += 15

        // Calculate seller box height
        const sellerBoxHeight = sellerBoxY - boxStartY

        // Buyer Information
        let buyerBoxY = boxStartY + 10
        doc
          .fontSize(9)
          .font('Helvetica-Bold')
          .fillColor('#008000')  // GREEN for Buyer Information
          .text('Buyer Information', rightBoxX + 10, buyerBoxY)

        buyerBoxY += 15
        doc
          .fontSize(12)
          .font('Helvetica-Bold')
          .fillColor('#000000')
          .text(buyer?.name || 'N/A', rightBoxX + 10, buyerBoxY, { width: boxWidth - 20 })

        buyerBoxY += 18

        // Billing Address
        doc.fontSize(8).font('Helvetica').text('Billing Address:', rightBoxX + 10, buyerBoxY)
        buyerBoxY += 10
        if (buyerAddress) {
          doc.fontSize(9).font('Helvetica')
          if (buyerAddress.line1) {
            doc.text(buyerAddress.line1, rightBoxX + 10, buyerBoxY, { width: boxWidth - 20 })
            buyerBoxY += 10
          }
          if (buyerAddress.line2) {
            doc.text(buyerAddress.line2, rightBoxX + 10, buyerBoxY, { width: boxWidth - 20 })
            buyerBoxY += 10
          }
          const cityStateZip = [buyerAddress.city, buyerAddress.state, buyerAddress.postalCode].filter(Boolean).join(', ')
          if (cityStateZip) {
            doc.text(cityStateZip, rightBoxX + 10, buyerBoxY, { width: boxWidth - 20 })
            buyerBoxY += 12
          }
        } else {
          doc.fontSize(9).text('N/A', rightBoxX + 10, buyerBoxY)
          buyerBoxY += 12
        }

        // Shipping Address or "Will Pick Up"
        buyerBoxY += 5
        doc.fontSize(8).font('Helvetica').text('Shipping Address:', rightBoxX + 10, buyerBoxY)
        buyerBoxY += 10
        if (buyerShippingAddress) {
          doc.fontSize(9).font('Helvetica')
          if (buyerShippingAddress.line1) {
            doc.text(buyerShippingAddress.line1, rightBoxX + 10, buyerBoxY, { width: boxWidth - 20 })
            buyerBoxY += 10
          }
          if (buyerShippingAddress.line2) {
            doc.text(buyerShippingAddress.line2, rightBoxX + 10, buyerBoxY, { width: boxWidth - 20 })
            buyerBoxY += 10
          }
          const cityStateZip = [buyerShippingAddress.city, buyerShippingAddress.state, buyerShippingAddress.postalCode].filter(Boolean).join(', ')
          if (cityStateZip) {
            doc.text(cityStateZip, rightBoxX + 10, buyerBoxY, { width: boxWidth - 20 })
            buyerBoxY += 12
          }
        } else {
          doc.fontSize(9).font('Helvetica-Bold').text('Will Pick Up', rightBoxX + 10, buyerBoxY)
          buyerBoxY += 12
        }

        // Sales Confirmation No. at bottom
        buyerBoxY += 5
        doc.fontSize(9).font('Helvetica').text(`Sales Confirmation No.: ${order.contractNo || 'TBA'}`, rightBoxX + 10, buyerBoxY)
        buyerBoxY += 15

        // Calculate buyer box height
        const buyerBoxHeight = buyerBoxY - boxStartY

        // Use the max height for both boxes
        const maxBoxHeight = Math.max(sellerBoxHeight, buyerBoxHeight)

        // Now draw the boxes with dynamic height
        doc
          .strokeColor('#CCCCCC')
          .lineWidth(1)
          .rect(leftBoxX, boxStartY, boxWidth, maxBoxHeight)
          .stroke()

        doc
          .rect(rightBoxX, boxStartY, boxWidth, maxBoxHeight)
          .stroke()

        // Update currentY to after the boxes
        currentY = boxStartY + maxBoxHeight + 20

        // Product Details section
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
          .fill('#8B4513') // Brown color matching logo

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

        // PALLETS text - just above notice
        currentY += 120
        doc
          .fontSize(9)
          .font('Helvetica-Bold')
          .fillColor('#000000')
          .text(
            'PALLETS MUST BE PURCHASED OR EXCHANGED BY BUYER - BROKER WILL NOT BE RESPONSIBLE FOR ANY PALLET DEDUCTIONS',
            margin,
            currentY,
            { width: tableWidth, align: 'center', lineGap: 1 }
          )

        // Notice text
        currentY += 25
        doc
          .fontSize(8)
          .font('Helvetica')
          .text(
            'The parties acknowledge and agree that Kadouri Connection is acting as a broker in this transaction and cannot control and shall have no liability for delivery goods, quality, or timeliness of shipments. All obligations under this agreement are between buyer and seller as principal.',
            margin,
            currentY,
            { width: tableWidth, align: 'justify', lineGap: 2 }
          )

        currentY += 35
        doc
          .fontSize(8)
          .font('Helvetica')
          .text(
            'This is the copy you will receive from Kadouri Connection',
            margin,
            currentY,
            { width: tableWidth, lineGap: 1 }
          )

        currentY += 12
        doc.text(
          'If you require an original by mail please call or FAX your request to our office',
          margin,
          currentY,
          { width: tableWidth, lineGap: 1 }
        )

        // Company Footer - 3 column layout (logo left, company center, contact right)
        currentY += 30
        const footerY = currentY

        // Logo on left
        const footerLogoX = margin
        for (const logoPath of logoPaths) {
          if (fs.existsSync(logoPath)) {
            try {
              doc.image(logoPath, footerLogoX, footerY, { width: 60 })
              break
            } catch (err) {
              // Try next path
            }
          }
        }

        // Company info in center
        const centerX = pageWidth / 2
        doc
          .fontSize(8)
          .font('Helvetica-Bold')
          .fillColor('#000000')
          .text('Golden Nuts Inc. | dba The Kadouri Connection', 0, footerY, { align: 'center', width: pageWidth })

        doc
          .fontSize(7)
          .font('Helvetica')
          .text('525 Northern Boulevard Suite 205 | Great Neck, NY 11021', 0, footerY + 12, { align: 'center', width: pageWidth })

        doc.text('United States', 0, footerY + 22, { align: 'center', width: pageWidth })

        // Contact info on right
        const contactX = pageWidth - margin - 100
        doc
          .fontSize(8)
          .font('Helvetica-Bold')
          .text('Contact Information', contactX, footerY, { width: 100 })

        doc
          .fontSize(7)
          .font('Helvetica')
          .text('(516) 399-0155', contactX, footerY + 12, { width: 100 })

        doc.text('www.thekadouriconnection.com', contactX, footerY + 22, { width: 100 })

        doc.end()
      } catch (error) {
        reject(error)
      }
    })
  }
}
