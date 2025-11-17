import dotenv from 'dotenv'
import { z } from 'zod'

dotenv.config()

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3001'),
  DATABASE_URL: z.string().optional(),
  REDIS_URL: z.string().optional(),
  CLERK_SECRET_KEY: z.string().optional(),
  QBO_CLIENT_ID: z.string().optional(),
  QBO_CLIENT_SECRET: z.string().optional(),
  QBO_REDIRECT_URI: z.string().optional(),
  QBO_ENVIRONMENT: z.enum(['sandbox', 'production']).default('sandbox'),
  AWS_REGION: z.string().default('us-east-1'),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_S3_BUCKET: z.string().optional(),
  CORS_ORIGINS: z.string().default('http://localhost:2005,http://localhost:2010'),
})

const env = envSchema.parse(process.env)

export const config = {
  nodeEnv: env.NODE_ENV,
  port: parseInt(env.PORT, 10),
  database: {
    url: env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/pace_crm',
  },
  redis: {
    url: env.REDIS_URL || 'redis://localhost:6379',
  },
  clerk: {
    secretKey: env.CLERK_SECRET_KEY || '',
  },
  quickbooks: {
    clientId: env.QBO_CLIENT_ID,
    clientSecret: env.QBO_CLIENT_SECRET,
    redirectUri: env.QBO_REDIRECT_URI,
    environment: env.QBO_ENVIRONMENT,
  },
  aws: {
    region: env.AWS_REGION,
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    s3Bucket: env.AWS_S3_BUCKET,
  },
  cors: {
    origins: env.CORS_ORIGINS.split(','),
  },
}
