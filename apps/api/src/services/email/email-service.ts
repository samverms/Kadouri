import { db } from '../../db'
import { emailTemplates, emailLogs, outlookTokens } from '../../db/schema'
import { eq } from 'drizzle-orm'
import { OutlookClient } from './outlook-client'
import { logger } from '../../utils/logger'
import { AppError } from '../../middleware/error-handler'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'

export class EmailService {
  // Template variable replacement
  private replaceVariables(template: string, variables: Record<string, string>): string {
    let result = template
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g')
      result = result.replace(regex, value)
    })
    return result
  }

  // Send email using user's Outlook account
  async sendEmail(params: {
    userId: string
    to: string[]
    cc?: string[]
    bcc?: string[]
    subject: string
    body: string
    templateId?: string
    relatedEntityType?: string
    relatedEntityId?: string
  }) {
    // Get user's Outlook token
    const [tokenRecord] = await db
      .select()
      .from(outlookTokens)
      .where(eq(outlookTokens.userId, params.userId))

    if (!tokenRecord) {
      throw new AppError('Outlook account not connected. Please connect your Outlook account first.', 400)
    }

    // Check if token is expired
    const now = new Date()
    if (tokenRecord.expiresAt < now) {
      // Refresh token
      const clientId = process.env.MICROSOFT_CLIENT_ID!
      const clientSecret = process.env.MICROSOFT_CLIENT_SECRET!

      const refreshed = await OutlookClient.refreshAccessToken(
        tokenRecord.refreshToken,
        clientId,
        clientSecret
      )

      // Update token in database
      const expiresAt = new Date(now.getTime() + refreshed.expiresIn * 1000)
      await db
        .update(outlookTokens)
        .set({
          accessToken: refreshed.accessToken,
          refreshToken: refreshed.refreshToken,
          expiresAt,
          updatedAt: new Date(),
        })
        .where(eq(outlookTokens.userId, params.userId))

      tokenRecord.accessToken = refreshed.accessToken
    }

    // Send email
    const outlookClient = new OutlookClient(tokenRecord.accessToken)

    try {
      await outlookClient.sendEmail({
        to: params.to,
        cc: params.cc,
        bcc: params.bcc,
        subject: params.subject,
        body: params.body,
        isHtml: true,
      })

      // Log email
      await db.insert(emailLogs).values({
        templateId: params.templateId,
        to: params.to.join(','),
        cc: params.cc?.join(','),
        bcc: params.bcc?.join(','),
        subject: params.subject,
        body: params.body,
        status: 'sent',
        sentBy: params.userId,
        relatedEntityType: params.relatedEntityType,
        relatedEntityId: params.relatedEntityId,
      })

      logger.info(`Email sent successfully by user ${params.userId}`)

      return { success: true }
    } catch (error: any) {
      // Log failed email
      await db.insert(emailLogs).values({
        templateId: params.templateId,
        to: params.to.join(','),
        cc: params.cc?.join(','),
        bcc: params.bcc?.join(','),
        subject: params.subject,
        body: params.body,
        status: 'failed',
        error: error.message,
        sentBy: params.userId,
        relatedEntityType: params.relatedEntityType,
        relatedEntityId: params.relatedEntityId,
      })

      throw error
    }
  }

  // Send email from template
  async sendFromTemplate(params: {
    userId: string
    templateId: string
    to: string[]
    cc?: string[]
    bcc?: string[]
    variables: Record<string, string>
    relatedEntityType?: string
    relatedEntityId?: string
  }) {
    const [template] = await db
      .select()
      .from(emailTemplates)
      .where(eq(emailTemplates.id, params.templateId))

    if (!template) {
      throw new AppError('Email template not found', 404)
    }

    if (!template.isActive) {
      throw new AppError('Email template is inactive', 400)
    }

    const subject = this.replaceVariables(template.subject, params.variables)
    const body = this.replaceVariables(template.body, params.variables)

    return this.sendEmail({
      userId: params.userId,
      to: params.to,
      cc: params.cc,
      bcc: params.bcc,
      subject,
      body,
      templateId: params.templateId,
      relatedEntityType: params.relatedEntityType,
      relatedEntityId: params.relatedEntityId,
    })
  }

  // Get all templates
  async getTemplates(userId: string) {
    return db.select().from(emailTemplates)
  }

  // Create template
  async createTemplate(data: {
    name: string
    subject: string
    body: string
    category?: string
    variables?: string[]
    userId: string
  }) {
    const [template] = await db
      .insert(emailTemplates)
      .values({
        name: data.name,
        subject: data.subject,
        body: data.body,
        category: data.category,
        variables: data.variables ? JSON.stringify(data.variables) : null,
        createdBy: data.userId,
      })
      .returning()

    logger.info(`Email template created: ${template.id}`)
    return template
  }

  // Update template
  async updateTemplate(
    templateId: string,
    data: {
      name?: string
      subject?: string
      body?: string
      category?: string
      variables?: string[]
      isActive?: boolean
    }
  ) {
    const updateData: any = {
      ...data,
      updatedAt: new Date(),
    }

    if (data.variables) {
      updateData.variables = JSON.stringify(data.variables)
    }

    const [updated] = await db
      .update(emailTemplates)
      .set(updateData)
      .where(eq(emailTemplates.id, templateId))
      .returning()

    if (!updated) {
      throw new AppError('Email template not found', 404)
    }

    logger.info(`Email template updated: ${templateId}`)
    return updated
  }

  // Delete template
  async deleteTemplate(templateId: string) {
    const [deleted] = await db
      .delete(emailTemplates)
      .where(eq(emailTemplates.id, templateId))
      .returning()

    if (!deleted) {
      throw new AppError('Email template not found', 404)
    }

    logger.info(`Email template deleted: ${templateId}`)
    return deleted
  }

  // Get email logs
  async getEmailLogs(filters?: {
    userId?: string
    relatedEntityType?: string
    relatedEntityId?: string
    limit?: number
  }) {
    let query = db.select().from(emailLogs)

    if (filters?.userId) {
      query = query.where(eq(emailLogs.sentBy, filters.userId)) as any
    }

    const logs = await query.limit(filters?.limit || 100)
    return logs
  }

  /**
   * Send contract email with buyer/seller themed templates
   */
  async sendContractEmail(params: {
    userId: string
    contract: any
    sendToSeller: boolean
    sendToBuyer: boolean
    message?: string
  }) {
    const { userId, contract, sendToSeller, sendToBuyer, message } = params

    // Validate email addresses
    if (sendToSeller && !contract.seller.email) {
      throw new AppError('Seller has no email address', 400)
    }
    if (sendToBuyer && !contract.buyer.email) {
      throw new AppError('Buyer has no email address', 400)
    }

    // Get document to attach (prefer executed, fallback to draft)
    const documentUrl = contract.executedDocumentUrl || contract.draftDocumentUrl
    const documentType = contract.executedDocumentUrl
      ? contract.executedDocumentType
      : contract.draftDocumentType

    if (!documentUrl) {
      throw new AppError('No contract document available to send', 400)
    }

    // Download document from S3
    const s3Client = new S3Client({ region: process.env.AWS_REGION })
    const documentBuffer = await this.downloadFromS3(s3Client, documentUrl)
    const fileName = `Contract-${contract.contractNumber}.${documentType}`

    const attachment = {
      filename: fileName,
      content: documentBuffer,
      contentType: this.getContentType(documentType)
    }

    const results = []

    // Send to seller with BLUE theme
    if (sendToSeller && contract.seller.email) {
      const sellerBody = this.renderSellerContractEmail(contract, message)

      await this.sendEmail({
        userId,
        to: [contract.seller.email],
        subject: `Contract #${contract.contractNumber} - ${contract.buyer.companyName}`,
        body: sellerBody,
        relatedEntityType: 'contract',
        relatedEntityId: contract.id,
      })

      // Send attachment separately using OutlookClient with attachment support
      const [tokenRecord] = await db.select().from(outlookTokens).where(eq(outlookTokens.userId, userId))
      if (tokenRecord) {
        const outlookClient = new OutlookClient(tokenRecord.accessToken)
        await outlookClient.sendEmail({
          to: [contract.seller.email],
          subject: `Contract #${contract.contractNumber} - ${contract.buyer.companyName}`,
          body: sellerBody,
          isHtml: true,
          attachments: [attachment]
        })
      }

      results.push({ recipient: 'seller', email: contract.seller.email })
    }

    // Send to buyer with GREEN theme
    if (sendToBuyer && contract.buyer.email) {
      const buyerBody = this.renderBuyerContractEmail(contract, message)

      const [tokenRecord] = await db.select().from(outlookTokens).where(eq(outlookTokens.userId, userId))
      if (tokenRecord) {
        const outlookClient = new OutlookClient(tokenRecord.accessToken)
        await outlookClient.sendEmail({
          to: [contract.buyer.email],
          subject: `Contract #${contract.contractNumber} - ${contract.seller.companyName}`,
          body: buyerBody,
          isHtml: true,
          attachments: [attachment]
        })
      }

      results.push({ recipient: 'buyer', email: contract.buyer.email })
    }

    logger.info(`Contract email sent for contract ${contract.id}`, { results })

    return results
  }

  /**
   * Download file from S3
   */
  private async downloadFromS3(s3Client: S3Client, s3Key: string): Promise<Buffer> {
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: s3Key
    })

    const response = await s3Client.send(command)
    const stream = response.Body as NodeJS.ReadableStream

    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = []
      stream.on('data', (chunk) => chunks.push(chunk))
      stream.on('error', reject)
      stream.on('end', () => resolve(Buffer.concat(chunks)))
    })
  }

  /**
   * Get content type for file extension
   */
  private getContentType(fileType: string): string {
    const types: Record<string, string> = {
      'pdf': 'application/pdf',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'doc': 'application/msword'
    }
    return types[fileType] || 'application/octet-stream'
  }

  /**
   * Render seller email template with BLUE theme
   */
  private renderSellerContractEmail(contract: any, customMessage?: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
            }
            .header {
              background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
              color: white;
              padding: 30px 20px;
              text-align: center;
              border-radius: 8px 8px 0 0;
            }
            .content {
              padding: 30px 20px;
              background: #f8fafc;
            }
            .contract-details {
              background: white;
              border: 2px solid #3b82f6;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
            }
            .detail-row {
              display: flex;
              justify-content: space-between;
              padding: 12px 0;
              border-bottom: 1px solid #e2e8f0;
            }
            .detail-row:last-child { border-bottom: none; }
            .label {
              font-weight: 600;
              color: #475569;
            }
            .value {
              color: #1e293b;
              font-weight: 500;
            }
            .message-box {
              background: #dbeafe;
              border-left: 4px solid #3b82f6;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .footer {
              text-align: center;
              padding: 20px;
              color: #64748b;
              font-size: 12px;
              background: #f1f5f9;
              border-radius: 0 0 8px 8px;
            }
            .badge {
              background: #3b82f6;
              color: white;
              padding: 4px 12px;
              border-radius: 12px;
              font-size: 12px;
              font-weight: 600;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 style="margin: 0;">SELLER CONTRACT</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Contract #${contract.contractNumber}</p>
            <span class="badge">SELLER COPY</span>
          </div>

          <div class="content">
            ${customMessage ? `
              <div class="message-box">
                <strong>Message:</strong><br/>
                ${customMessage}
              </div>
            ` : ''}

            <p>Please find your contract details below:</p>

            <div class="contract-details">
              <div class="detail-row">
                <span class="label">You (Seller):</span>
                <span class="value">${contract.seller.companyName}</span>
              </div>
              <div class="detail-row">
                <span class="label">Buyer:</span>
                <span class="value">${contract.buyer.companyName}</span>
              </div>
              <div class="detail-row">
                <span class="label">Product:</span>
                <span class="value">${contract.product.name}</span>
              </div>
              <div class="detail-row">
                <span class="label">Total Quantity:</span>
                <span class="value">${contract.totalQuantity} ${contract.unit}</span>
              </div>
              <div class="detail-row">
                <span class="label">Remaining:</span>
                <span class="value">${contract.remainingQuantity} ${contract.unit}</span>
              </div>
              <div class="detail-row">
                <span class="label">Price:</span>
                <span class="value">$${contract.pricePerUnit} per ${contract.unit}</span>
              </div>
              <div class="detail-row">
                <span class="label">Total Value:</span>
                <span class="value"><strong>$${parseFloat(contract.totalValue).toLocaleString()}</strong></span>
              </div>
              <div class="detail-row">
                <span class="label">Valid Period:</span>
                <span class="value">${new Date(contract.validFrom).toLocaleDateString()} to ${new Date(contract.validUntil).toLocaleDateString()}</span>
              </div>
              <div class="detail-row">
                <span class="label">Status:</span>
                <span class="value">${contract.status.toUpperCase()}</span>
              </div>
            </div>

            <p style="margin-top: 20px;">
              The contract document is attached to this email for your records.
            </p>
          </div>

          <div class="footer">
            <p style="margin: 0;">This is an automated message from PACE CRM</p>
            <p style="margin: 5px 0 0 0;">For questions, please contact your sales representative</p>
          </div>
        </body>
      </html>
    `
  }

  /**
   * Render buyer email template with GREEN theme
   */
  private renderBuyerContractEmail(contract: any, customMessage?: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
            }
            .header {
              background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
              color: white;
              padding: 30px 20px;
              text-align: center;
              border-radius: 8px 8px 0 0;
            }
            .content {
              padding: 30px 20px;
              background: #f8fafc;
            }
            .contract-details {
              background: white;
              border: 2px solid #22c55e;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
            }
            .detail-row {
              display: flex;
              justify-content: space-between;
              padding: 12px 0;
              border-bottom: 1px solid #e2e8f0;
            }
            .detail-row:last-child { border-bottom: none; }
            .label {
              font-weight: 600;
              color: #475569;
            }
            .value {
              color: #1e293b;
              font-weight: 500;
            }
            .message-box {
              background: #dcfce7;
              border-left: 4px solid #22c55e;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .footer {
              text-align: center;
              padding: 20px;
              color: #64748b;
              font-size: 12px;
              background: #f1f5f9;
              border-radius: 0 0 8px 8px;
            }
            .badge {
              background: #22c55e;
              color: white;
              padding: 4px 12px;
              border-radius: 12px;
              font-size: 12px;
              font-weight: 600;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 style="margin: 0;">BUYER CONTRACT</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Contract #${contract.contractNumber}</p>
            <span class="badge">BUYER COPY</span>
          </div>

          <div class="content">
            ${customMessage ? `
              <div class="message-box">
                <strong>Message:</strong><br/>
                ${customMessage}
              </div>
            ` : ''}

            <p>Please find your contract details below:</p>

            <div class="contract-details">
              <div class="detail-row">
                <span class="label">Seller:</span>
                <span class="value">${contract.seller.companyName}</span>
              </div>
              <div class="detail-row">
                <span class="label">You (Buyer):</span>
                <span class="value">${contract.buyer.companyName}</span>
              </div>
              <div class="detail-row">
                <span class="label">Product:</span>
                <span class="value">${contract.product.name}</span>
              </div>
              <div class="detail-row">
                <span class="label">Total Quantity:</span>
                <span class="value">${contract.totalQuantity} ${contract.unit}</span>
              </div>
              <div class="detail-row">
                <span class="label">Remaining:</span>
                <span class="value">${contract.remainingQuantity} ${contract.unit}</span>
              </div>
              <div class="detail-row">
                <span class="label">Price:</span>
                <span class="value">$${contract.pricePerUnit} per ${contract.unit}</span>
              </div>
              <div class="detail-row">
                <span class="label">Total Value:</span>
                <span class="value"><strong>$${parseFloat(contract.totalValue).toLocaleString()}</strong></span>
              </div>
              <div class="detail-row">
                <span class="label">Valid Period:</span>
                <span class="value">${new Date(contract.validFrom).toLocaleDateString()} to ${new Date(contract.validUntil).toLocaleDateString()}</span>
              </div>
              <div class="detail-row">
                <span class="label">Status:</span>
                <span class="value">${contract.status.toUpperCase()}</span>
              </div>
            </div>

            <p style="margin-top: 20px;">
              The contract document is attached to this email for your records.
            </p>
          </div>

          <div class="footer">
            <p style="margin: 0;">This is an automated message from PACE CRM</p>
            <p style="margin: 5px 0 0 0;">For questions, please contact your sales representative</p>
          </div>
        </body>
      </html>
    `
  }
}

export default new EmailService()
