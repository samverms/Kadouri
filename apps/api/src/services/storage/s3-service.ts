import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { logger } from '../../utils/logger'

export class S3Service {
  private s3Client: S3Client
  private bucket: string

  constructor() {
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    })
    this.bucket = process.env.AWS_S3_BUCKET || 'kadouri-crm'
  }

  async uploadFile(key: string, fileBuffer: Buffer, contentType: string): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: fileBuffer,
        ContentType: contentType,
      })

      await this.s3Client.send(command)
      const url = `https://${this.bucket}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`

      logger.info(`File uploaded to S3: ${key}`)
      return url
    } catch (error: any) {
      logger.error('Failed to upload file to S3:', error)
      throw new Error(`S3 upload failed: ${error.message}`)
    }
  }

  async deleteFile(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      })

      await this.s3Client.send(command)
      logger.info(`File deleted from S3: ${key}`)
    } catch (error: any) {
      logger.error('Failed to delete file from S3:', error)
      throw new Error(`S3 delete failed: ${error.message}`)
    }
  }

  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      })

      const url = await getSignedUrl(this.s3Client, command, { expiresIn })
      return url
    } catch (error: any) {
      logger.error('Failed to generate signed URL:', error)
      throw new Error(`Failed to generate signed URL: ${error.message}`)
    }
  }
}
