import PDFDocument from 'pdfkit'
import { db } from '../../db'
import { orders, orderLines, accounts, products, addresses, agents } from '../../db/schema'
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

    // Fetch seller with primary billing address
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

    // Fetch buyer with primary billing address
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

    // Fetch pickup address (seller pickup address)
    let pickupAddress: any = null
    if (order.sellerPickupAddressId) {
      [pickupAddress] = await db
        .select()
        .from(addresses)
        .where(eq(addresses.id, order.sellerPickupAddressId))
    }

    // Fetch shipping address (buyer shipping address)
    let shippingAddress: any = null
    if (order.buyerShippingAddressId) {
      [shippingAddress] = await db
        .select()
        .from(addresses)
        .where(eq(addresses.id, order.buyerShippingAddressId))
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
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(buffers)
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
              doc.image(logoPath, margin, 40, { width: 150 })
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
        doc.font('Helvetica')
        if (seller?.addressLine1) {
          doc.text(`Address:`, leftBoxX + 10, boxY)
          boxY += 12
          doc.text(seller.addressLine1, leftBoxX + 10, boxY, { width: boxWidth - 20 })
          boxY += 12
        }
        if (seller?.addressLine2) {
          doc.text(seller.addressLine2, leftBoxX + 10, boxY, { width: boxWidth - 20 })
          boxY += 12
        }
        if (seller?.city || seller?.state || seller?.postalCode) {
          doc.text(
            `${seller?.city || ''}, ${seller?.state || ''} ${seller?.postalCode || ''}`.trim(),
            leftBoxX + 10,
            boxY,
            { width: boxWidth - 20 }
          )
          boxY += 15
        }

        // Pickup Location - use either dedicated pickup address or seller primary address
        const pickupAddr = pickupAddress || seller
        if (pickupAddr) {
          doc.font('Helvetica-Bold').text(`Pickup Location:`, leftBoxX + 10, boxY)
          boxY += 12
          doc.font('Helvetica')
          if (pickupAddr.line1 || pickupAddr.addressLine1) {
            doc.text(pickupAddr.line1 || pickupAddr.addressLine1, leftBoxX + 10, boxY, { width: boxWidth - 20 })
            boxY += 12
          }
          if (pickupAddr.line2 || pickupAddr.addressLine2) {
            doc.text(pickupAddr.line2 || pickupAddr.addressLine2, leftBoxX + 10, boxY, { width: boxWidth - 20 })
            boxY += 12
          }
          if (pickupAddr.city || pickupAddr.state || pickupAddr.postalCode) {
            doc.text(
              `${pickupAddr.city || ''}, ${pickupAddr.state || ''} ${pickupAddr.postalCode || ''}`.trim(),
              leftBoxX + 10,
              boxY,
              { width: boxWidth - 20 }
            )
          }
        }

        // Sales Confirmation No. at bottom of box
        doc.fontSize(9).text(`Sales Confirmation No.: TBA`, leftBoxX + 10, currentY + 125)

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
        doc.font('Helvetica')
        if (buyer?.addressLine1) {
          doc.text(`Address:`, rightBoxX + 10, boxY)
          boxY += 12
          doc.text(buyer.addressLine1, rightBoxX + 10, boxY, { width: boxWidth - 20 })
          boxY += 12
        }
        if (buyer?.addressLine2) {
          doc.text(buyer.addressLine2, rightBoxX + 10, boxY, { width: boxWidth - 20 })
          boxY += 12
        }
        if (buyer?.city || buyer?.state || buyer?.postalCode) {
          doc.text(
            `${buyer?.city || ''}, ${buyer?.state || ''} ${buyer?.postalCode || ''}`.trim(),
            rightBoxX + 10,
            boxY,
            { width: boxWidth - 20 }
          )
          boxY += 15
        }

        // Shipping Address - use either dedicated shipping address or buyer primary address
        const shipAddr = shippingAddress || buyer
        if (shipAddr) {
          doc.font('Helvetica-Bold').text(`Shipping Address:`, rightBoxX + 10, boxY)
          boxY += 12
          doc.font('Helvetica')
          if (shipAddr.line1 || shipAddr.addressLine1) {
            doc.text(shipAddr.line1 || shipAddr.addressLine1, rightBoxX + 10, boxY, { width: boxWidth - 20 })
            boxY += 12
          }
          if (shipAddr.line2 || shipAddr.addressLine2) {
            doc.text(shipAddr.line2 || shipAddr.addressLine2, rightBoxX + 10, boxY, { width: boxWidth - 20 })
            boxY += 12
          }
          if (shipAddr.city || shipAddr.state || shipAddr.postalCode) {
            doc.text(
              `${shipAddr.city || ''}, ${shipAddr.state || ''} ${shipAddr.postalCode || ''}`.trim(),
              rightBoxX + 10,
              boxY,
              { width: boxWidth - 20 }
            )
          }
        }

        // Purchase Order No. at bottom of box
        doc.fontSize(9).text(`Purchase Order No.: ${order.poNumber || 'TBA'}`, rightBoxX + 10, currentY + 125)

        // Product Details section
        currentY = 290
        doc
          .fontSize(12)
          .font('Helvetica-Bold')
          .fillColor('#000000')
          .text('Product Details', margin, currentY)

        currentY += 25

        // Table setup - matching orders page format
        const tableWidth = pageWidth - (margin * 2)
        let colWidths: number[]

        if (isSeller) {
          // Seller: #, Product, Variant, Qty, $/lb, Total, %, Comm
          colWidths = [30, 150, 120, 60, 60, 80, 50, 70]
        } else {
          // Buyer: #, Product, Variant, Qty, $/lb, Total (NO commission columns)
          colWidths = [40, 180, 140, 70, 70, 100]
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
            doc.text(commissionPct.toFixed(1), colX, currentY + 10, { width: colWidths[6] - 10, align: 'right' })
            colX += colWidths[6]
            // Commission amount
            doc.fillColor('#10B981').text(`$${commissionAmt.toFixed(2)}`, colX, currentY + 10, { width: colWidths[7] - 10, align: 'right' })
          }

          currentY += rowHeight
        })

        // Pallets and Payment Terms
        currentY += 20
        const palletCount = order.palletCount || 0
        const paymentTerms = order.terms || 'NET 30 DAYS'
        doc
          .fontSize(10)
          .font('Helvetica')
          .fillColor('#000000')
          .text(`# of Pallets: ${palletCount}    Payment Terms: - ${paymentTerms}`, margin, currentY)

        // Remarks and Order Summary boxes
        currentY += 25
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

        // Order Summary box (right)
        doc
          .strokeColor('#CCCCCC')
          .rect(rightBoxX, currentY, summaryBoxWidth, 80)
          .stroke()

        doc
          .fontSize(11)
          .font('Helvetica-Bold')
          .text('Order Summary', rightBoxX + 10, currentY + 10)

        let summaryY = currentY + 35

        // Total (value of transaction)
        doc
          .fontSize(10)
          .font('Helvetica')
          .text('Total:', rightBoxX + 10, summaryY)
          .text(`$${grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, rightBoxX + summaryBoxWidth - 110, summaryY, { align: 'right', width: 100 })

        // Amount Due (commission - what the brokerage gets paid) - SELLER ONLY
        if (isSeller) {
          summaryY += 20
          doc
            .font('Helvetica-Bold')
            .fillColor('#000000')
            .text('Amount Due:', rightBoxX + 10, summaryY)
            .fillColor('#10B981')
            .text(`$${totalCommission.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, rightBoxX + summaryBoxWidth - 110, summaryY, { align: 'right', width: 100 })
        }

        // Footer disclaimer - adjusted spacing to prevent overlap
        currentY += 115
        doc
          .strokeColor('#CCCCCC')
          .lineWidth(1)
          .dash(5, { space: 3 })
          .rect(margin, currentY, tableWidth, 80)
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
