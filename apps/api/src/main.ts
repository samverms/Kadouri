import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import { clerkMiddleware } from '@clerk/express'
import { config } from './config'
import { logger } from './utils/logger'
import { errorHandler } from './middleware/error-handler'
import { routes } from './routes'

const app = express()

// Middleware
app.use(cors({
  origin: config.cors.origins, // Allow both dashboards
  credentials: true
}))
app.use(helmet({
  crossOriginResourcePolicy: false,
  contentSecurityPolicy: false
}))
app.use(compression())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Clerk authentication middleware
app.use(clerkMiddleware())

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// API routes
app.use('/api', routes)

// Error handler
app.use(errorHandler)

// Start server
const PORT = config.port
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`)
  logger.info(`Environment: ${config.nodeEnv}`)
})

export default app

