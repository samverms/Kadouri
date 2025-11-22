import { v2 as cloudinary } from 'cloudinary'
import { logger } from '../../utils/logger'

export class CloudinaryService {
  constructor() {
    // Cloudinary auto-configures from CLOUDINARY_URL environment variable
    if (!process.env.CLOUDINARY_URL) {
      logger.warn('CLOUDINARY_URL not set, file uploads may fail')
    }
  }

  async uploadFile(key: string, fileBuffer: Buffer, contentType: string): Promise<string> {
    try {
      // Upload file as base64
      const base64File = `data:${contentType};base64,${fileBuffer.toString('base64')}`

      const result = await cloudinary.uploader.upload(base64File, {
        folder: 'kadouri-crm',
        public_id: key,
        resource_type: 'auto', // Automatically detect file type
      })

      logger.info(`File uploaded to Cloudinary: ${key}`)
      return result.secure_url
    } catch (error: any) {
      logger.error('Failed to upload file to Cloudinary:', error)
      throw new Error(`Cloudinary upload failed: ${error.message}`)
    }
  }

  async deleteFile(key: string): Promise<void> {
    try {
      const publicId = `kadouri-crm/${key}`
      await cloudinary.uploader.destroy(publicId)
      logger.info(`File deleted from Cloudinary: ${key}`)
    } catch (error: any) {
      logger.error('Failed to delete file from Cloudinary:', error)
      throw new Error(`Cloudinary delete failed: ${error.message}`)
    }
  }

  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      const publicId = `kadouri-crm/${key}`

      // Generate a signed URL that expires
      const timestamp = Math.floor(Date.now() / 1000) + expiresIn
      const url = cloudinary.url(publicId, {
        sign_url: true,
        type: 'authenticated',
        expires_at: timestamp,
      })

      return url
    } catch (error: any) {
      logger.error('Failed to generate signed URL:', error)
      throw new Error(`Failed to generate signed URL: ${error.message}`)
    }
  }
}
