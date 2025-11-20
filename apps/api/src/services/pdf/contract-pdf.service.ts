import PDFDocument from 'pdfkit'
import { db } from '../../db'
import { contracts, accounts, products, addresses } from '../../db/schema'
import { eq, and } from 'drizzle-orm'
import path from 'path'
import fs from 'fs'

export class ContractPDFService {
  async generateContractPDF(contractId: string): Promise<Buffer> {
    // Fetch contract with relations
    const [contract] = await db
      .select({
        id: contracts.id,
        contractNumber: contracts.contractNumber,
        sellerId: contracts.sellerId,
        buyerId: contracts.buyerId,
        productId: contracts.productId,
        totalQuantity: contracts.totalQuantity,
        remainingQuantity: contracts.remainingQuantity,
        unit: contracts.unit,
        pricePerUnit: contracts.pricePerUnit,
        totalValue: contracts.totalValue,
        currency: contracts.currency,
        validFrom: contracts.validFrom,
        validUntil: contracts.validUntil,
        status: contracts.status,
        terms: contracts.terms,
        notes: contracts.notes,
        createdAt: contracts.createdAt,
      })
      .from(contracts)
      .where(eq(contracts.id, contractId))

    if (!contract) {
      throw new Error('Contract not found')
    }

    // Fetch seller with primary address
    const [seller] = await db
      .select({
        id: accounts.id,
        name: accounts.name,
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
      .where(eq(accounts.id, contract.sellerId))

    // Fetch buyer with primary address
    const [buyer] = await db
      .select({
        id: accounts.id,
        name: accounts.name,
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
      .where(eq(accounts.id, contract.buyerId))

    // Fetch product
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, contract.productId))

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

        // PAGE 1
        const pageWidth = doc.page.width
        const margin = 50

        // Logo at top-left (small)
        const logoPath = path.join(__dirname, '../../assets/logo.png')
        if (fs.existsSync(logoPath)) {
          doc.image(logoPath, margin, 40, { width: 150 })
        }

        // Add watermark behind content
        doc.save()
        doc
          .fontSize(100)
          .font('Helvetica-Bold')
          .fillColor('#f0f0f0')
          .opacity(0.3)
          .rotate(-45, { origin: [pageWidth / 2, doc.page.height / 2] })
          .text('CONTRACT', 50, doc.page.height / 2 - 50, {
            width: pageWidth,
            align: 'center',
          })
        doc.restore()

        // CONTRACT # centered at top
        doc
          .fontSize(18)
          .font('Helvetica-Bold')
          .fillColor('#000000')
          .opacity(1)
          .text(`CONTRACT # ${contract.contractNumber}`, 0, 50, {
            align: 'center',
            width: pageWidth,
          })

        // Date centered
        doc
          .fontSize(12)
          .font('Helvetica')
          .text(new Date(contract.createdAt).toLocaleDateString('en-US'), 0, 75, {
            align: 'center',
            width: pageWidth,
          })

        doc.moveDown(2)

        // Seller and Buyer side by side
        const topY = 120
        const leftColX = margin
        const rightColX = pageWidth / 2 + 20

        // SELLER (Left side)
        doc.fontSize(11).font('Helvetica-Bold').text('Seller:', leftColX, topY)
        doc
          .font('Helvetica')
          .text(seller?.name || 'N/A', leftColX, topY + 15, { width: 200 })

        // Seller address
        let sellerY = doc.y + 5
        if (seller?.addressLine1) {
          doc
            .fontSize(9)
            .text(seller.addressLine1, leftColX, sellerY, { width: 200 })
          sellerY = doc.y
        }
        if (seller?.addressLine2) {
          doc.text(seller.addressLine2, leftColX, sellerY, { width: 200 })
          sellerY = doc.y
        }
        if (seller?.city || seller?.state || seller?.postalCode) {
          doc.text(
            `${seller?.city || ''}, ${seller?.state || ''} ${seller?.postalCode || ''}`.trim(),
            leftColX,
            sellerY,
            { width: 200 }
          )
        }

        // BUYER (Right side)
        doc.fontSize(11).font('Helvetica-Bold').text('Purchaser:', rightColX, topY)
        doc
          .font('Helvetica')
          .text(buyer?.name || 'N/A', rightColX, topY + 15, { width: 200 })

        // Buyer address
        let buyerY = topY + 30
        if (buyer?.addressLine1) {
          doc
            .fontSize(9)
            .text(buyer.addressLine1, rightColX, buyerY, { width: 200 })
          buyerY = doc.y
        }
        if (buyer?.addressLine2) {
          doc.text(buyer.addressLine2, rightColX, buyerY, { width: 200 })
          buyerY = doc.y
        }
        if (buyer?.city || buyer?.state || buyer?.postalCode) {
          doc.text(
            `${buyer?.city || ''}, ${buyer?.state || ''} ${buyer?.postalCode || ''}`.trim(),
            rightColX,
            buyerY,
            { width: 200 }
          )
        }

        // Contract Valid (below seller/buyer)
        const validY = topY + 85
        doc
          .fontSize(11)
          .font('Helvetica-Bold')
          .text('Contract Valid:', leftColX, validY)
        doc
          .font('Helvetica')
          .text(
            `${new Date(contract.validFrom).toLocaleDateString('en-US', {
              month: 'long',
              day: '2-digit',
              year: 'numeric',
            })}, to ${new Date(contract.validUntil).toLocaleDateString('en-US', {
              month: 'long',
              day: '2-digit',
              year: 'numeric',
            })}`,
            leftColX + 100,
            validY,
            { width: 350 }
          )

        // Product Table
        const tableTop = validY + 40
        const tableWidth = pageWidth - 100

        // Adjusted column widths to fit within page
        const colWidths = [120, 65, 70, 75, 65, 85]
        const headers = [
          'Commodity\nDescription',
          'Number of\nPackages',
          'Package\nWeight\nPer Unit',
          'Total\nWeight lbs',
          'Unit Price\nIn $ US',
          'Total Contract\nAmount in $ US',
        ]

        // Draw table header
        doc.fontSize(8).font('Helvetica-Bold')
        let currentX = margin

        // Draw header row with borders
        doc.rect(margin, tableTop, tableWidth, 35).stroke()

        headers.forEach((header, i) => {
          if (i > 0) {
            doc.moveTo(currentX, tableTop).lineTo(currentX, tableTop + 35).stroke()
          }
          doc.text(header, currentX + 3, tableTop + 3, {
            width: colWidths[i] - 6,
            align: 'center',
            lineGap: 1,
          })
          currentX += colWidths[i]
        })

        // Table row
        const rowTop = tableTop + 35
        const rowHeight = 22
        doc.fontSize(9).font('Helvetica')

        // Calculate values
        const packageWeight = parseFloat(contract.unit.replace(/[^\d.]/g, '')) || 30
        const totalPackages = Math.round(parseFloat(contract.totalQuantity) / packageWeight)
        const totalWeight = parseFloat(contract.totalQuantity)
        const unitPrice = parseFloat(contract.pricePerUnit)
        const totalAmount = parseFloat(contract.totalValue)

        const rowData = [
          product?.name || 'Product',
          totalPackages.toLocaleString(),
          `${packageWeight} lbs`,
          totalWeight.toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }),
          unitPrice.toFixed(2),
          totalAmount.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }),
        ]

        // Draw row border
        doc.rect(margin, rowTop, tableWidth, rowHeight).stroke()

        currentX = margin
        rowData.forEach((data, i) => {
          if (i > 0) {
            doc.moveTo(currentX, rowTop).lineTo(currentX, rowTop + rowHeight).stroke()
          }
          const align = i === 0 ? 'left' : 'right'
          const padding = i === 0 ? 3 : 5
          doc.text(data, currentX + padding, rowTop + 6, {
            width: colWidths[i] - padding * 2,
            align,
          })
          currentX += colWidths[i]
        })

        // Commission
        const detailsTop = rowTop + rowHeight + 20
        const commissionAmount = totalAmount * 0.005

        doc
          .fontSize(11)
          .font('Helvetica-Bold')
          .text(`Commission: 0.5%`, margin, detailsTop)

        doc.text(
          `Total Commission: $${commissionAmount.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`,
          margin,
          detailsTop + 18
        )

        // Product details
        let detailY = detailsTop + 50
        const detailsData = [
          { label: 'Product', value: product?.name || 'N/A' },
          { label: 'Quantity:', value: `${totalPackages.toLocaleString()} cases` },
          { label: 'Packaging:', value: `${packageWeight} lbs` },
          { label: 'Price:', value: 'see above, pick up' },
        ]

        detailsData.forEach((item) => {
          doc
            .fontSize(10)
            .font('Helvetica-Bold')
            .text(item.label, margin, detailY, { continued: true })
            .font('Helvetica')
            .text(`  ${item.value}`)
          detailY += 18
        })

        // Notes
        doc.fontSize(10).font('Helvetica-Bold').text(`Notes:`, margin, detailY)
        if (contract.notes) {
          doc
            .font('Helvetica')
            .text(contract.notes, margin + 50, detailY, { width: tableWidth - 50 })
        }
        detailY += 25

        // Broker info
        doc
          .fontSize(10)
          .font('Helvetica-Bold')
          .text(`Broker:`, margin, detailY, { continued: true })
          .font('Helvetica')
          .text(
            `  Danny Kadouri, The Kadouri Connection: 525 Northern Blvd, Suite 205; Great Neck, NY 11021; USA`,
            { width: tableWidth }
          )

        // Page footer
        doc
          .fontSize(9)
          .text('Page 1 of 2', margin, doc.page.height - 50, {
            align: 'center',
            width: tableWidth,
          })

        // PAGE 2
        doc.addPage()

        // Add watermark to page 2
        doc.save()
        doc
          .fontSize(100)
          .font('Helvetica-Bold')
          .fillColor('#f0f0f0')
          .opacity(0.3)
          .rotate(-45, { origin: [pageWidth / 2, doc.page.height / 2] })
          .text('CONTRACT', 50, doc.page.height / 2 - 50, {
            width: pageWidth,
            align: 'center',
          })
        doc.restore()

        // Arbitration section
        const page2Top = 100
        doc
          .fontSize(11)
          .font('Helvetica-Bold')
          .fillColor('#000000')
          .opacity(1)
          .text('Arbitration:', margin, page2Top)

        doc
          .fontSize(10)
          .font('Helvetica')
          .text(
            'All disputes arising from the execution of or in connection with the Contract of Sale shall be settled through negotiation in good faith. In case no settlement can be reached through negotiation, the case shall then be submitted to the Association of Food Industries, Inc. for arbitration in accordance with the Provisional Rules of Procedure. The arbitration award is final and binding upon both parties.',
            margin + 90,
            page2Top,
            {
              width: tableWidth - 90,
              align: 'justify',
            }
          )

        // Signature lines
        const sigTop = page2Top + 120
        const sigLineY = sigTop + 20

        // Seller signature
        doc.fontSize(10).font('Helvetica').text('Seller', margin, sigTop)
        doc
          .moveTo(margin + 50, sigLineY)
          .lineTo(margin + 240, sigLineY)
          .stroke()

        // Buyer signature
        const buyerX = margin + 280
        doc.text('Buyer', buyerX, sigTop)
        doc
          .moveTo(buyerX + 50, sigLineY)
          .lineTo(buyerX + 240, sigLineY)
          .stroke()

        // Date lines
        const dateTop = sigTop + 45
        const dateLineY = dateTop + 20

        doc.text('Date', margin, dateTop)
        doc
          .moveTo(margin + 50, dateLineY)
          .lineTo(margin + 240, dateLineY)
          .stroke()

        doc.text('Date', buyerX, dateTop)
        doc
          .moveTo(buyerX + 50, dateLineY)
          .lineTo(buyerX + 240, dateLineY)
          .stroke()

        // Page footer
        doc
          .fontSize(9)
          .text('Page 2 of 2', margin, doc.page.height - 50, {
            align: 'center',
            width: tableWidth,
          })

        doc.end()
      } catch (error) {
        reject(error)
      }
    })
  }
}
