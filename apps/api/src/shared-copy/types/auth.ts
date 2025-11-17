// User roles with hierarchical permissions
export type UserRole = 'admin' | 'manager' | 'agent' | 'readonly'

// Role permissions mapping
export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  admin: ['all'], // Full access to everything
  manager: [
    'users:invite',
    'users:view',
    'users:edit',
    'orders:all',
    'accounts:all',
    'products:all',
    'reports:all',
    'settings:view',
  ],
  agent: [
    'orders:create',
    'orders:edit',
    'orders:view',
    'accounts:view',
    'accounts:create',
    'products:view',
    'reports:view',
  ],
  readonly: [
    'orders:view',
    'accounts:view',
    'products:view',
    'reports:view',
  ],
}

// User invitation status
export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'revoked'

// User with MFA information
export interface User {
  id: string
  email: string
  firstName?: string | null
  lastName?: string | null
  role: UserRole
  active: boolean
  mfaEnabled: boolean
  lastLoginAt?: Date | null
  createdAt: Date
  updatedAt: Date
}

// User invitation
export interface UserInvitation {
  id: string
  email: string
  role: UserRole
  invitedBy: string
  token: string
  status: InvitationStatus
  expiresAt: Date
  acceptedAt?: Date | null
  resentAt?: Date | null
  resentCount: number
  createdAt: Date
  updatedAt: Date
}

// MFA setup response
export interface MFASetup {
  secret: string
  qrCodeUrl: string
  backupCodes: string[]
}

// Permission check helper type
export type Permission = string
