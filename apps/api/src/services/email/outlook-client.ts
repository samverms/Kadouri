import axios from 'axios'
import { logger } from '../../utils/logger'

interface OutlookAttachment {
  filename: string
  content: Buffer
  contentType: string
}

interface OutlookEmailParams {
  to: string[]
  cc?: string[]
  bcc?: string[]
  subject: string
  body: string
  isHtml?: boolean
  attachments?: OutlookAttachment[]
}

export class OutlookClient {
  private accessToken: string

  constructor(accessToken: string) {
    this.accessToken = accessToken
  }

  async sendEmail(params: OutlookEmailParams): Promise<void> {
    const message: any = {
      subject: params.subject,
      body: {
        contentType: params.isHtml ? 'HTML' : 'Text',
        content: params.body,
      },
      toRecipients: params.to.map((email) => ({
        emailAddress: { address: email },
      })),
      ccRecipients: params.cc?.map((email) => ({
        emailAddress: { address: email },
      })),
      bccRecipients: params.bcc?.map((email) => ({
        emailAddress: { address: email },
      })),
    }

    // Add attachments if provided
    if (params.attachments && params.attachments.length > 0) {
      message.attachments = params.attachments.map((attachment) => ({
        '@odata.type': '#microsoft.graph.fileAttachment',
        name: attachment.filename,
        contentType: attachment.contentType,
        contentBytes: attachment.content.toString('base64'),
      }))
    }

    try {
      await axios.post(
        'https://graph.microsoft.com/v1.0/me/sendMail',
        {
          message,
          saveToSentItems: true,
        },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      )

      logger.info(`Email sent successfully to ${params.to.join(', ')}`)
    } catch (error: any) {
      logger.error('Failed to send email via Outlook', {
        error: error.response?.data || error.message,
      })
      throw new Error(`Failed to send email: ${error.response?.data?.error?.message || error.message}`)
    }
  }

  async getUserProfile() {
    try {
      const response = await axios.get('https://graph.microsoft.com/v1.0/me', {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      })

      return response.data
    } catch (error: any) {
      logger.error('Failed to get user profile', {
        error: error.response?.data || error.message,
      })
      throw new Error('Failed to get user profile')
    }
  }

  static async refreshAccessToken(refreshToken: string, clientId: string, clientSecret: string): Promise<{
    accessToken: string
    refreshToken: string
    expiresIn: number
  }> {
    try {
      const response = await axios.post(
        'https://login.microsoftonline.com/common/oauth2/v2.0/token',
        new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
          scope: 'https://graph.microsoft.com/Mail.Send https://graph.microsoft.com/User.Read offline_access',
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      )

      return {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        expiresIn: response.data.expires_in,
      }
    } catch (error: any) {
      logger.error('Failed to refresh access token', {
        error: error.response?.data || error.message,
      })
      throw new Error('Failed to refresh access token')
    }
  }
}
