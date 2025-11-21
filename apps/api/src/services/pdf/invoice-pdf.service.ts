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

    // Fetch order lines with products
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
      })
      .from(orderLines)
      .leftJoin(products, eq(orderLines.productId, products.id))
      .where(eq(orderLines.orderId, orderId))

    // Fetch seller with addresses
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

    // Fetch buyer with addresses
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

        // Logo at top-left
        const logoPath = path.join(__dirname, '../../assets/logo.png')
        if (fs.existsSync(logoPath)) {
          doc.image(logoPath, margin, 40, { width: 150 })
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
          .rect(leftBoxX, currentY, boxWidth, 120)
          .stroke()

        doc
          .rect(rightBoxX, currentY, boxWidth, 120)
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
          .text(seller?.name || 'N/A', leftBoxX + 10, boxY)

        boxY += 15
        doc.font('Helvetica')
        if (seller?.addressLine1) {
          doc.text(`Address:`, leftBoxX + 10, boxY)
          boxY += 12
          doc.text(seller.addressLine1, leftBoxX + 10, boxY)
          boxY += 12
        }
        if (seller?.addressLine2) {
          doc.text(seller.addressLine2, leftBoxX + 10, boxY)
          boxY += 12
        }
        if (seller?.city || seller?.state || seller?.postalCode) {
          doc.text(
            `${seller?.city || ''}, ${seller?.state || ''} ${seller?.postalCode || ''}`.trim(),
            leftBoxX + 10,
            boxY
          )
          boxY += 12
        }

        // Pickup Location
        if (pickupAddress) {
          boxY += 3
          doc.text(`Pickup Location:`, leftBoxX + 10, boxY)
          boxY += 12
          doc.text(pickupAddress.line1 || '', leftBoxX + 10, boxY)
          boxY += 12
          if (pickupAddress.line2) {
            doc.text(pickupAddress.line2, leftBoxX + 10, boxY)
            boxY += 12
          }
          doc.text(
            `${pickupAddress.city || ''}, ${pickupAddress.state || ''} ${pickupAddress.postalCode || ''}`.trim(),
            leftBoxX + 10,
            boxY
          )
        }

        // Sales Confirmation No. at bottom of box
        doc.text(`Sales Confirmation No.: TBA`, leftBoxX + 10, currentY + 105)

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
          .text(buyer?.name || 'N/A', rightBoxX + 10, boxY)

        boxY += 15
        doc.font('Helvetica')
        if (buyer?.addressLine1) {
          doc.text(`Address:`, rightBoxX + 10, boxY)
          boxY += 12
          doc.text(buyer.addressLine1, rightBoxX + 10, boxY)
          boxY += 12
        }
        if (buyer?.addressLine2) {
          doc.text(buyer.addressLine2, rightBoxX + 10, boxY)
          boxY += 12
        }
        if (buyer?.city || buyer?.state || buyer?.postalCode) {
          doc.text(
            `${buyer?.city || ''}, ${buyer?.state || ''} ${buyer?.postalCode || ''}`.trim(),
            rightBoxX + 10,
            boxY
          )
          boxY += 12
        }

        // Shipping Address
        if (shippingAddress) {
          boxY += 3
          doc.text(`Shipping Address:`, rightBoxX + 10, boxY)
          boxY += 12
          doc.text(shippingAddress.line1 || '', rightBoxX + 10, boxY)
          boxY += 12
          if (shippingAddress.line2) {
            doc.text(shippingAddress.line2, rightBoxX + 10, boxY)
            boxY += 12
          }
          doc.text(
            `${shippingAddress.city || ''}, ${shippingAddress.state || ''} ${shippingAddress.postalCode || ''}`.trim(),
            rightBoxX + 10,
            boxY
          )
        }

        // Purchase Order No. at bottom of box
        doc.text(`Purchase Order No.: ${order.poNumber || 'TBA'}`, rightBoxX + 10, currentY + 105)

        // Product Details section
        currentY = 270
        doc
          .fontSize(12)
          .font('Helvetica-Bold')
          .text('Product Details', margin, currentY)

        currentY += 25

        // Table setup - different columns for buyer and seller
        const tableWidth = pageWidth - (margin * 2)
        let colWidths: number[]

        if (isSeller) {
          // Seller: 6 columns - Product, Quantity, Unit Size, Total Weight, Unit Price, Total
          colWidths = [180, 70, 70, 90, 80, 90]
        } else {
          // Buyer: 5 columns - Product, Quantity, Unit Size, Total Weight, Unit Price
          colWidths = [200, 80, 80, 100, 100]
        }

        // Table header
        doc
          .fontSize(9)
          .font('Helvetica-Bold')
          .fillColor('#000000')
          .strokeColor('#CCCCCC')
          .lineWidth(1)
          .rect(margin, currentY, tableWidth, 20)
          .stroke()

        let colX = margin + 5
        doc.text('Product / Variety', colX, currentY + 6, { width: colWidths[0] - 10 })
        colX += colWidths[0]
        doc.text('Quantity', colX, currentY + 6, { width: colWidths[1] - 10 })
        colX += colWidths[1]
        doc.text('Unit Size', colX, currentY + 6, { width: colWidths[2] - 10 })
        colX += colWidths[2]
        doc.text('Total Weight', colX, currentY + 6, { width: colWidths[3] - 10 })
        colX += colWidths[3]
        doc.text('Unit Price', colX, currentY + 6, { width: colWidths[4] - 10 })
        if (isSeller) {
          colX += colWidths[4]
          doc.text('Total', colX, currentY + 6, { width: colWidths[5] - 10 })
        }

        currentY += 20

        // Table rows - iterate through order lines
        let grandTotal = 0
        lines.forEach((line) => {
          const quantity = parseFloat(line.quantity)
          const price = parseFloat(line.unitPrice)
          const total = parseFloat(line.lineTotal)
          const unitSize = parseFloat(line.unitSize)
          const totalWeight = parseFloat(line.totalWeight)
          grandTotal += total

          const rowHeight = 25
          doc
            .strokeColor('#CCCCCC')
            .rect(margin, currentY, tableWidth, rowHeight)
            .stroke()

          doc
            .fontSize(9)
            .font('Helvetica')
            .fillColor('#000000')

          colX = margin + 5

          // Product / Variety
          const productVariety = line.sizeGrade
            ? `${line.productName || 'Product'}\n${line.sizeGrade}`
            : line.productName || 'Product'
          doc.text(productVariety, colX, currentY + 6, { width: colWidths[0] - 10 })
          colX += colWidths[0]

          // Quantity
          doc.text(quantity.toLocaleString(), colX, currentY + 6, { width: colWidths[1] - 10 })
          colX += colWidths[1]

          // Unit Size
          doc.text(`${unitSize.toLocaleString()} ${line.uom}`, colX, currentY + 6, { width: colWidths[2] - 10 })
          colX += colWidths[2]

          // Total Weight
          doc.text(`${totalWeight.toLocaleString()} ${line.uom}`, colX, currentY + 6, { width: colWidths[3] - 10 })
          colX += colWidths[3]

          // Unit Price
          doc.text(`$${price.toFixed(2)}`, colX, currentY + 6, { width: colWidths[4] - 10 })

          // Total (seller only)
          if (isSeller) {
            colX += colWidths[4]
            doc.text(`$${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, colX, currentY + 6, { width: colWidths[5] - 10 })
          }

          currentY += rowHeight
        })

        // Pallets and Payment Terms
        currentY += 15
        const palletCount = order.palletCount || 0
        const paymentTerms = order.terms || 'NET 30 DAYS'
        doc
          .fontSize(10)
          .font('Helvetica')
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
        doc
          .fontSize(10)
          .font('Helvetica')
          .text('Total:', rightBoxX + 10, summaryY)
          .text(`$${grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, rightBoxX + summaryBoxWidth - 110, summaryY, { align: 'right', width: 100 })

        // Commission (seller only)
        if (isSeller) {
          summaryY += 15
          const commissionTotal = parseFloat(order.commissionTotal || '0')
          const commissionPct = grandTotal > 0 ? (commissionTotal / grandTotal * 100).toFixed(1) : '0.0'
          doc
            .text('Commission:', rightBoxX + 10, summaryY)
            .text(`$${commissionTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${commissionPct}%)`, rightBoxX + summaryBoxWidth - 110, summaryY, { align: 'right', width: 100 })
        }

        // Footer disclaimer
        currentY += 100
        doc
          .strokeColor('#CCCCCC')
          .lineWidth(1)
          .dash(5, { space: 3 })
          .rect(margin, currentY, tableWidth, 60)
          .stroke()
          .undash()

        doc
          .fontSize(8)
          .font('Helvetica')
          .fillColor('#000000')
          .text(
            'The parties acknowledge and agree that Global Crop Exchange is acting as a broker in this transaction and cannot control and shall have no liability for delivery goods, quality, or timeliness of shipments. All obligations under this agreement are between buyer and seller as principal.',
            margin + 10,
            currentY + 10,
            { width: tableWidth - 20, align: 'justify' }
          )

        currentY += 25
        doc
          .font('Helvetica-Bold')
          .text(
            'PALLETS MUST BE PURCHASED OR EXCHANGED BY BUYER-BROKER WILL NOT BE RESPONSIBLE FOR ANY PALLET DEDUCTIONS.',
            margin + 10,
            currentY,
            { width: tableWidth - 20 }
          )

        currentY += 12
        doc
          .font('Helvetica')
          .text(
            'This is the copy you will receive from Global Crop Exchange.',
            margin + 10,
            currentY,
            { width: tableWidth - 20 }
          )

        currentY += 10
        doc.text(
          'If you require an original by mail please call or FAX your request to our office',
          margin + 10,
          currentY,
          { width: tableWidth - 20 }
        )

        doc.end()
      } catch (error) {
        reject(error)
      }
    })
  }
}
