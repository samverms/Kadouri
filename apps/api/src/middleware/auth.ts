import { Request, Response, NextFunction } from 'express'
import { clerkClient, getAuth } from '@clerk/express'
import { AppError } from './error-handler'

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
    console.log('🔐 Auth middleware - Request:', {
      path: req.path,
      method: req.method,
      headers: {
        authorization: req.headers.authorization,
        cookie: req.headers.cookie ? 'present' : 'missing'
      }
    })

    const auth = getAuth(req)

    console.log('🔐 Auth result:', {
      userId: auth.userId,
      sessionId: auth.sessionId
    })

    if (!auth.userId) {
      console.log('❌ No userId found in auth')
      return next(new AppError('Unauthorized', 401))
    }

    // Get user details from Clerk
    const user = await clerkClient.users.getUser(auth.userId)

    if (!user) {
      return next(new AppError('User not found', 401))
    }

    // Extract role from public metadata (set during invitation acceptance)
    const role = (user.publicMetadata?.role as string) || 'agent'

    // Attach user info to request
    req.userId = auth.userId
    req.user = {
      id: auth.userId,
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
