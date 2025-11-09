import { Router } from 'express'
import { AuthRequest, authenticate, authorize } from '../../middleware/auth'
import { AppError } from '../../middleware/error-handler'
import * as invitationService from './invitation.service'

const router = Router()

/**
 * POST /api/invitations
 * Create a new user invitation (admin only)
 */
router.post('/', authenticate, authorize('admin'), async (req: AuthRequest, res, next) => {
  try {
    const { email, role } = req.body

    if (!email || !role) {
      throw new AppError('Email and role are required', 400)
    }

    const validRoles = ['admin', 'manager', 'agent', 'readonly']
    if (!validRoles.includes(role)) {
      throw new AppError(`Invalid role. Must be one of: ${validRoles.join(', ')}`, 400)
    }

    const invitation = await invitationService.inviteUser(email, role, req.userId!)

    res.status(201).json({
      success: true,
      data: invitation,
    })
  } catch (error: any) {
    next(new AppError(error.message, 400))
  }
})

/**
 * GET /api/invitations
 * Get all invitations (admin/manager only)
 */
router.get('/', authenticate, authorize('admin', 'manager'), async (req: AuthRequest, res, next) => {
  try {
    const { status } = req.query

    const invitations = await invitationService.getAllInvitations(
      status as 'pending' | 'accepted' | 'expired' | 'revoked' | undefined
    )

    res.json({
      success: true,
      data: invitations,
    })
  } catch (error: any) {
    next(new AppError(error.message, 400))
  }
})

/**
 * GET /api/invitations/verify/:token
 * Verify invitation token (public route)
 */
router.get('/verify/:token', async (req, res, next) => {
  try {
    const { token } = req.params

    const invitation = await invitationService.getInvitationByToken(token)

    if (!invitation) {
      throw new AppError('Invalid invitation token', 404)
    }

    if (invitation.status !== 'pending') {
      throw new AppError(`Invitation is ${invitation.status}`, 400)
    }

    res.json({
      success: true,
      data: {
        email: invitation.email,
        role: invitation.role,
        expiresAt: invitation.expiresAt,
      },
    })
  } catch (error: any) {
    next(error instanceof AppError ? error : new AppError(error.message, 400))
  }
})

/**
 * POST /api/invitations/accept
 * Accept invitation (requires Clerk authentication)
 */
router.post('/accept', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { token } = req.body

    if (!token) {
      throw new AppError('Invitation token is required', 400)
    }

    await invitationService.acceptInvitation(token, req.userId!)

    res.json({
      success: true,
      message: 'Invitation accepted successfully',
    })
  } catch (error: any) {
    next(new AppError(error.message, 400))
  }
})

/**
 * POST /api/invitations/:id/resend
 * Resend invitation (admin only)
 */
router.post('/:id/resend', authenticate, authorize('admin'), async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params

    const invitation = await invitationService.resendInvitation(id)

    res.json({
      success: true,
      data: invitation,
    })
  } catch (error: any) {
    next(new AppError(error.message, 400))
  }
})

/**
 * DELETE /api/invitations/:id
 * Revoke invitation (admin only)
 */
router.delete('/:id', authenticate, authorize('admin'), async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params

    await invitationService.revokeInvitation(id)

    res.json({
      success: true,
      message: 'Invitation revoked successfully',
    })
  } catch (error: any) {
    next(new AppError(error.message, 400))
  }
})

export { router as invitationRouter }
