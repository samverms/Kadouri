import { Request, Response, NextFunction } from 'express'
import { clerkClient, getAuth } from '@clerk/express'
import { verifyToken } from '@clerk/backend'
import { AppError } from './error-handler'
import { config } from '../config'

export interface AuthRequest extends Request {
  userId?: string
  user?: {
    id: string
    email: string
    role: 'admin' | 'manager' | 'agent' | 'readonly'
  }
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Try to get token from Authorization header first
    const authHeader = req.headers.authorization
    let userId: string | null = null

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      console.log('🔐 Verifying JWT token from Authorization header')

      try {
        const verified = await verifyToken(token, {
          secretKey: config.clerk.secretKey,
        })
        userId = verified.sub
        console.log('✅ Token verified, userId:', userId)
      } catch (err) {
        console.error('❌ Token verification failed:', err)
      }
    }

    // Fallback to cookie-based auth
    if (!userId) {
      const auth = getAuth(req)
      userId = auth.userId || null
      console.log('🔐 Checked cookie auth, userId:', userId)
    }

    if (!userId) {
      console.log('❌ No userId found')
      return next(new AppError('Unauthorized', 401))
    }

    // Get user details from Clerk
    const user = await clerkClient.users.getUser(userId)

    if (!user) {
      return next(new AppError('User not found', 401))
    }

    // Extract role from public metadata
    const role = (user.publicMetadata?.role as string) || 'agent'

    // Attach user info to request
    req.userId = userId
    req.user = {
      id: userId,
      email: user.emailAddresses[0]?.emailAddress || '',
      role: role as 'admin' | 'manager' | 'agent' | 'readonly',
    }

    next()
  } catch (error) {
    console.error('Authentication error:', error)
    next(new AppError('Authentication failed', 401))
  }
}

export const authorize = (...allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return next(new AppError('Insufficient permissions', 403))
    }
    next()
  }
}
