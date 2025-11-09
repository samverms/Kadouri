import { z } from 'zod'

// User role enum schema
export const userRoleSchema = z.enum(['admin', 'manager', 'agent', 'readonly'])

// Invitation status schema
export const invitationStatusSchema = z.enum(['pending', 'accepted', 'expired', 'revoked'])

// Invite user schema
export const inviteUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: userRoleSchema,
  firstName: z.string().min(1, 'First name is required').optional(),
  lastName: z.string().min(1, 'Last name is required').optional(),
})

// Resend invitation schema
export const resendInvitationSchema = z.object({
  invitationId: z.string().uuid('Invalid invitation ID'),
})

// Revoke invitation schema
export const revokeInvitationSchema = z.object({
  invitationId: z.string().uuid('Invalid invitation ID'),
})

// Accept invitation schema
export const acceptInvitationSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
})

// Setup MFA schema
export const setupMFASchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
})

// Verify MFA schema
export const verifyMFASchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  token: z.string().length(6, 'MFA token must be 6 digits'),
})

// Disable MFA schema
export const disableMFASchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  password: z.string().min(1, 'Password is required'),
})

// Verify backup code schema
export const verifyBackupCodeSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  backupCode: z.string().min(1, 'Backup code is required'),
})

// Update user role schema
export const updateUserRoleSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  role: userRoleSchema,
})

// Update user status schema
export const updateUserStatusSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  active: z.boolean(),
})

export type InviteUserInput = z.infer<typeof inviteUserSchema>
export type ResendInvitationInput = z.infer<typeof resendInvitationSchema>
export type RevokeInvitationInput = z.infer<typeof revokeInvitationSchema>
export type AcceptInvitationInput = z.infer<typeof acceptInvitationSchema>
export type SetupMFAInput = z.infer<typeof setupMFASchema>
export type VerifyMFAInput = z.infer<typeof verifyMFASchema>
export type DisableMFAInput = z.infer<typeof disableMFASchema>
export type VerifyBackupCodeInput = z.infer<typeof verifyBackupCodeSchema>
export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>
export type UpdateUserStatusInput = z.infer<typeof updateUserStatusSchema>
