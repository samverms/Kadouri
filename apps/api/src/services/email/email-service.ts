import { db } from '../../db'
import { emailTemplates, emailLogs, outlookTokens } from '../../db/schema'
import { eq } from 'drizzle-orm'
import { OutlookClient } from './outlook-client'
import { logger } from '../../utils/logger'
import { AppError } from '../../middleware/error-handler'

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
}
