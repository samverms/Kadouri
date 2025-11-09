import puppeteer from 'puppeteer'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

interface OrderData {
  orderNo: string
  date: string
  seller: {
    code: string
    name: string
    address?: string
    contact?: string
  }
  buyer: {
    code: string
    name: string
    address?: string
    contact?: string
  }
  product: {
    code: string
    name: string
    variety?: string
    grade?: string
  }
  quantity: number
  unit: string
  price: number
  total: number
  agent: {
    code: string
    name: string
  }
  commission?: {
    rate: number
    amount: number
  }
  notes?: string
}

export class PDFGenerator {
  private s3Client: S3Client

  constructor() {
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    })
  }

  /**
   * Generate Seller PDF Buffer
   */
  async generateSellerPDFBuffer(orderData: OrderData): Promise<Buffer> {
    const html = this.getSellerTemplate(orderData)
    const pdfBuffer = await this.generatePDF(html)
    return pdfBuffer
  }

  /**
   * Generate Buyer PDF Buffer
   */
  async generateBuyerPDFBuffer(orderData: OrderData): Promise<Buffer> {
    const html = this.getBuyerTemplate(orderData)
    const pdfBuffer = await this.generatePDF(html)
    return pdfBuffer
  }

  /**
   * Generate Seller PDF (with S3 upload if configured)
   */
  async generateSellerPDF(orderData: OrderData): Promise<string> {
    const html = this.getSellerTemplate(orderData)
    const pdfBuffer = await this.generatePDF(html)
    const url = await this.uploadToS3(
      pdfBuffer,
      `orders/${orderData.orderNo}/seller-${orderData.orderNo}.pdf`
    )
    return url
  }

  /**
   * Generate Buyer PDF (with S3 upload if configured)
   */
  async generateBuyerPDF(orderData: OrderData): Promise<string> {
    const html = this.getBuyerTemplate(orderData)
    const pdfBuffer = await this.generatePDF(html)
    const url = await this.uploadToS3(
      pdfBuffer,
      `orders/${orderData.orderNo}/buyer-${orderData.orderNo}.pdf`
    )
    return url
  }

  /**
   * Generate PDF from HTML using Puppeteer
   */
  private async generatePDF(html: string): Promise<Buffer> {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })

    try {
      const page = await browser.newPage()
      await page.setContent(html, { waitUntil: 'networkidle0' })
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm',
        },
      })

      return Buffer.from(pdfBuffer)
    } finally {
      await browser.close()
    }
  }

  /**
   * Upload PDF to S3 and return signed URL
   * If AWS is not configured, return base64 data URL
   */
  private async uploadToS3(buffer: Buffer, key: string): Promise<string> {
    // Check if AWS credentials are configured
    const hasAwsConfig = process.env.AWS_ACCESS_KEY_ID &&
                         process.env.AWS_SECRET_ACCESS_KEY &&
                         process.env.AWS_S3_BUCKET

    if (!hasAwsConfig) {
      // Return base64 data URL for local testing
      const base64 = buffer.toString('base64')
      return `data:application/pdf;base64,${base64}`
    }

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET || 'pace-crm-pdfs',
      Key: key,
      Body: buffer,
      ContentType: 'application/pdf',
    })

    await this.s3Client.send(command)

    // Generate a signed URL valid for 7 days
    const signedUrl = await getSignedUrl(this.s3Client, command, {
      expiresIn: 604800,
    })

    return signedUrl
  }

  /**
   * Seller PDF Template
   */
  private getSellerTemplate(data: OrderData): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Seller Order - ${data.orderNo}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: 'Helvetica', 'Arial', sans-serif;
              color: #333;
              line-height: 1.3;
              font-size: 11px;
            }
            .header {
              background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
              color: white;
              padding: 15px 20px;
              margin-bottom: 15px;
            }
            .header h1 {
              font-size: 20px;
              margin-bottom: 5px;
            }
            .header p {
              font-size: 11px;
              opacity: 0.9;
            }
            .order-info {
              background: #f3f4f6;
              padding: 12px;
              border-radius: 4px;
              margin-bottom: 15px;
            }
            .order-info h2 {
              font-size: 14px;
              color: #1e40af;
              margin-bottom: 8px;
            }
            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 8px;
            }
            .info-item {
              display: flex;
              flex-direction: column;
            }
            .info-label {
              font-size: 9px;
              color: #6b7280;
              text-transform: uppercase;
              letter-spacing: 0.3px;
              margin-bottom: 2px;
            }
            .info-value {
              font-size: 11px;
              font-weight: 600;
              color: #111827;
            }
            .section {
              margin-bottom: 15px;
            }
            .section-title {
              font-size: 13px;
              color: #1e40af;
              margin-bottom: 8px;
              padding-bottom: 4px;
              border-bottom: 1px solid #e5e7eb;
            }
            .details-box {
              background: white;
              border: 1px solid #e5e7eb;
              border-radius: 4px;
              padding: 12px;
            }
            .product-row {
              display: grid;
              grid-template-columns: 2fr 1fr 1fr 1fr;
              gap: 10px;
              padding: 8px 0;
              border-bottom: 1px solid #e5e7eb;
            }
            .product-row:last-child {
              border-bottom: none;
            }
            .total-section {
              background: #f9fafb;
              padding: 12px;
              border-radius: 4px;
              margin-top: 12px;
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 6px;
              font-size: 11px;
            }
            .total-row.final {
              font-size: 16px;
              font-weight: bold;
              color: #1e40af;
              border-top: 1px solid #e5e7eb;
              padding-top: 8px;
              margin-top: 8px;
            }
            .footer {
              margin-top: 20px;
              padding-top: 12px;
              border-top: 1px solid #e5e7eb;
              text-align: center;
              color: #6b7280;
              font-size: 9px;
            }
            .badge {
              display: inline-block;
              padding: 3px 8px;
              background: #dbeafe;
              color: #1e40af;
              border-radius: 8px;
              font-size: 10px;
              font-weight: 600;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>SELLER ORDER CONFIRMATION</h1>
            <p>Order Number: ${data.orderNo}</p>
            <p>Date: ${new Date(data.date).toLocaleDateString()}</p>
          </div>

          <div class="order-info">
            <h2>Order Information</h2>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Order Number</span>
                <span class="info-value">${data.orderNo}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Order Date</span>
                <span class="info-value">${new Date(data.date).toLocaleDateString()}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Agent</span>
                <span class="info-value">${data.agent.name} (${data.agent.code})</span>
              </div>
            </div>
          </div>

          <div class="section">
            <h3 class="section-title">Seller Information (You)</h3>
            <div class="details-box">
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">Account Code</span>
                  <span class="info-value">${data.seller.code}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Account Name</span>
                  <span class="info-value">${data.seller.name}</span>
                </div>
                ${data.seller.address ? `
                <div class="info-item">
                  <span class="info-label">Address</span>
                  <span class="info-value">${data.seller.address}</span>
                </div>
                ` : ''}
                ${data.seller.contact ? `
                <div class="info-item">
                  <span class="info-label">Contact</span>
                  <span class="info-value">${data.seller.contact}</span>
                </div>
                ` : ''}
              </div>
            </div>
          </div>

          <div class="section">
            <h3 class="section-title">Buyer Information</h3>
            <div class="details-box">
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">Account Code</span>
                  <span class="info-value">${data.buyer.code}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Account Name</span>
                  <span class="info-value">${data.buyer.name}</span>
                </div>
                ${data.buyer.address ? `
                <div class="info-item">
                  <span class="info-label">Address</span>
                  <span class="info-value">${data.buyer.address}</span>
                </div>
                ` : ''}
                ${data.buyer.contact ? `
                <div class="info-item">
                  <span class="info-label">Contact</span>
                  <span class="info-value">${data.buyer.contact}</span>
                </div>
                ` : ''}
              </div>
            </div>
          </div>

          <div class="section">
            <h3 class="section-title">Product Details</h3>
            <div class="details-box">
              <div class="product-row" style="font-weight: 600; color: #6b7280; font-size: 12px; text-transform: uppercase;">
                <div>Product</div>
                <div>Quantity</div>
                <div>Price/Unit</div>
                <div>Total</div>
              </div>
              <div class="product-row">
                <div>
                  <div style="font-weight: 600;">${data.product.name}</div>
                  ${data.product.variety ? `<div style="font-size: 12px; color: #6b7280;">Variety: ${data.product.variety}</div>` : ''}
                  ${data.product.grade ? `<div style="font-size: 12px; color: #6b7280;">Grade: ${data.product.grade}</div>` : ''}
                  <div style="font-size: 12px; color: #6b7280;">Code: ${data.product.code}</div>
                </div>
                <div>${data.quantity.toLocaleString()} ${data.unit}</div>
                <div>$${data.price.toFixed(2)}/${data.unit}</div>
                <div style="font-weight: 600;">$${data.total.toLocaleString()}</div>
              </div>
            </div>

            <div class="total-section">
              <div class="total-row final">
                <span>TOTAL AMOUNT:</span>
                <span>$${data.total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          ${data.notes ? `
          <div class="section">
            <h3 class="section-title">Notes</h3>
            <div class="details-box">
              <p>${data.notes}</p>
            </div>
          </div>
          ` : ''}

          <div class="footer">
            <p>This is a computer-generated document. No signature is required.</p>
            <p>Generated on ${new Date().toLocaleString()}</p>
          </div>
        </body>
      </html>
    `
  }

  /**
   * Buyer PDF Template
   */
  private getBuyerTemplate(data: OrderData): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Buyer Order - ${data.orderNo}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: 'Helvetica', 'Arial', sans-serif;
              color: #333;
              line-height: 1.3;
              font-size: 11px;
            }
            .header {
              background: linear-gradient(135deg, #059669 0%, #10b981 100%);
              color: white;
              padding: 15px 20px;
              margin-bottom: 15px;
            }
            .header h1 {
              font-size: 20px;
              margin-bottom: 5px;
            }
            .header p {
              font-size: 11px;
              opacity: 0.9;
            }
            .order-info {
              background: #f3f4f6;
              padding: 12px;
              border-radius: 4px;
              margin-bottom: 15px;
            }
            .order-info h2 {
              font-size: 14px;
              color: #059669;
              margin-bottom: 8px;
            }
            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 8px;
            }
            .info-item {
              display: flex;
              flex-direction: column;
            }
            .info-label {
              font-size: 9px;
              color: #6b7280;
              text-transform: uppercase;
              letter-spacing: 0.3px;
              margin-bottom: 2px;
            }
            .info-value {
              font-size: 11px;
              font-weight: 600;
              color: #111827;
            }
            .section {
              margin-bottom: 15px;
            }
            .section-title {
              font-size: 13px;
              color: #059669;
              margin-bottom: 8px;
              padding-bottom: 4px;
              border-bottom: 1px solid #e5e7eb;
            }
            .details-box {
              background: white;
              border: 1px solid #e5e7eb;
              border-radius: 4px;
              padding: 12px;
            }
            .product-row {
              display: grid;
              grid-template-columns: 2fr 1fr 1fr 1fr;
              gap: 10px;
              padding: 8px 0;
              border-bottom: 1px solid #e5e7eb;
            }
            .product-row:last-child {
              border-bottom: none;
            }
            .total-section {
              background: #f9fafb;
              padding: 12px;
              border-radius: 4px;
              margin-top: 12px;
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 6px;
              font-size: 11px;
            }
            .total-row.final {
              font-size: 16px;
              font-weight: bold;
              color: #059669;
              border-top: 1px solid #e5e7eb;
              padding-top: 8px;
              margin-top: 8px;
            }
            .footer {
              margin-top: 20px;
              padding-top: 12px;
              border-top: 1px solid #e5e7eb;
              text-align: center;
              color: #6b7280;
              font-size: 9px;
            }
            .badge {
              display: inline-block;
              padding: 3px 8px;
              background: #d1fae5;
              color: #059669;
              border-radius: 8px;
              font-size: 10px;
              font-weight: 600;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>BUYER ORDER CONFIRMATION</h1>
            <p>Order Number: ${data.orderNo}</p>
            <p>Date: ${new Date(data.date).toLocaleDateString()}</p>
          </div>

          <div class="order-info">
            <h2>Order Information</h2>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Order Number</span>
                <span class="info-value">${data.orderNo}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Order Date</span>
                <span class="info-value">${new Date(data.date).toLocaleDateString()}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Agent</span>
                <span class="info-value">${data.agent.name} (${data.agent.code})</span>
              </div>
            </div>
          </div>

          <div class="section">
            <h3 class="section-title">Buyer Information (You)</h3>
            <div class="details-box">
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">Account Code</span>
                  <span class="info-value">${data.buyer.code}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Account Name</span>
                  <span class="info-value">${data.buyer.name}</span>
                </div>
                ${data.buyer.address ? `
                <div class="info-item">
                  <span class="info-label">Address</span>
                  <span class="info-value">${data.buyer.address}</span>
                </div>
                ` : ''}
                ${data.buyer.contact ? `
                <div class="info-item">
                  <span class="info-label">Contact</span>
                  <span class="info-value">${data.buyer.contact}</span>
                </div>
                ` : ''}
              </div>
            </div>
          </div>

          <div class="section">
            <h3 class="section-title">Seller Information</h3>
            <div class="details-box">
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">Account Code</span>
                  <span class="info-value">${data.seller.code}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Account Name</span>
                  <span class="info-value">${data.seller.name}</span>
                </div>
                ${data.seller.address ? `
                <div class="info-item">
                  <span class="info-label">Address</span>
                  <span class="info-value">${data.seller.address}</span>
                </div>
                ` : ''}
                ${data.seller.contact ? `
                <div class="info-item">
                  <span class="info-label">Contact</span>
                  <span class="info-value">${data.seller.contact}</span>
                </div>
                ` : ''}
              </div>
            </div>
          </div>

          <div class="section">
            <h3 class="section-title">Product Details</h3>
            <div class="details-box">
              <div class="product-row" style="font-weight: 600; color: #6b7280; font-size: 12px; text-transform: uppercase;">
                <div>Product</div>
                <div>Quantity</div>
                <div>Price/Unit</div>
                <div>Total</div>
              </div>
              <div class="product-row">
                <div>
                  <div style="font-weight: 600;">${data.product.name}</div>
                  ${data.product.variety ? `<div style="font-size: 12px; color: #6b7280;">Variety: ${data.product.variety}</div>` : ''}
                  ${data.product.grade ? `<div style="font-size: 12px; color: #6b7280;">Grade: ${data.product.grade}</div>` : ''}
                  <div style="font-size: 12px; color: #6b7280;">Code: ${data.product.code}</div>
                </div>
                <div>${data.quantity.toLocaleString()} ${data.unit}</div>
                <div>$${data.price.toFixed(2)}/${data.unit}</div>
                <div style="font-weight: 600;">$${data.total.toLocaleString()}</div>
              </div>
            </div>

            <div class="total-section">
              <div class="total-row final">
                <span>TOTAL AMOUNT:</span>
                <span>$${data.total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          ${data.notes ? `
          <div class="section">
            <h3 class="section-title">Notes</h3>
            <div class="details-box">
              <p>${data.notes}</p>
            </div>
          </div>
          ` : ''}

          <div class="footer">
            <p>This is a computer-generated document. No signature is required.</p>
            <p>Generated on ${new Date().toLocaleString()}</p>
          </div>
        </body>
      </html>
    `
  }
}
