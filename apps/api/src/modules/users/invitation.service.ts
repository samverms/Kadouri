import crypto from 'crypto'
import { db } from '../../db'
import { userInvitations, users } from '../../db/schema'
import { eq, and, gt, lt } from 'drizzle-orm'
import { UserRole, UserInvitation, InvitationStatus } from '../../shared-copy'
import { clerkClient } from '@clerk/express'
// TODO: Import email service when available
// import { sendEmail } from '../../services/email/email-service'

const INVITATION_EXPIRY_DAYS = 7
const MAX_RESEND_COUNT = 3

/**
 * Generate a secure random token for invitation
 */
function generateInvitationToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Calculate expiry date for invitation
 */
function getExpiryDate(): Date {
  const date = new Date()
  date.setDate(date.getDate() + INVITATION_EXPIRY_DAYS)
  return date
}

/**
 * Invite a new user with a specific role
 */
export async function inviteUser(
  email: string,
  role: UserRole,
  invitedBy: string
): Promise<UserInvitation> {
  // Check if user already exists
  const existingUser = await db.select().from(users).where(eq(users.email, email))
  if (existingUser.length > 0) {
    throw new Error('User with this email already exists')
  }

  // Check if there's a pending invitation
  const existingInvitation = await db
    .select()
    .from(userInvitations)
    .where(
      and(
        eq(userInvitations.email, email),
        eq(userInvitations.status, 'pending'),
        gt(userInvitations.expiresAt, new Date())
      )
    )

  if (existingInvitation.length > 0) {
    throw new Error('User already has a pending invitation')
  }

  // Create invitation
  const token = generateInvitationToken()
  const expiresAt = getExpiryDate()

  const [invitation] = await db
    .insert(userInvitations)
    .values({
      email,
      role,
      invitedBy,
      token,
      status: 'pending',
      expiresAt,
      resentCount: '0',
    })
    .returning()

  // TODO: Send invitation email
  const invitationUrl = `${process.env.APP_URL || 'http://localhost:3000'}/accept-invitation?token=${token}`
  console.log(`Invitation URL for ${email}: ${invitationUrl}`)

  // await sendEmail({
  //   to: email,
  //   subject: 'You\'re invited to join Kadouri Connection CRM',
  //   html: `
  //     <h2>You've been invited!</h2>
  //     <p>You've been invited to join Kadouri Connection CRM as a ${role}.</p>
  //     <p>Click the link below to accept your invitation and set up your account:</p>
  //     <a href="${invitationUrl}">Accept Invitation</a>
  //     <p>This invitation will expire in ${INVITATION_EXPIRY_DAYS} days.</p>
  //   `,
  // })

  return { ...invitation, resentCount: parseInt(invitation.resentCount) } as unknown as UserInvitation
}

/**
 * Resend an invitation
 */
export async function resendInvitation(invitationId: string): Promise<UserInvitation> {
  const [invitation] = await db
    .select()
    .from(userInvitations)
    .where(eq(userInvitations.id, invitationId))

  if (!invitation) {
    throw new Error('Invitation not found')
  }

  if (invitation.status !== 'pending') {
    throw new Error(`Cannot resend invitation with status: ${invitation.status}`)
  }

  const resentCount = parseInt(invitation.resentCount)
  if (resentCount >= MAX_RESEND_COUNT) {
    throw new Error(`Maximum resend limit (${MAX_RESEND_COUNT}) reached`)
  }

  // Update invitation with new expiry and resend info
  const newExpiryDate = getExpiryDate()
  const [updatedInvitation] = await db
    .update(userInvitations)
    .set({
      expiresAt: newExpiryDate,
      resentAt: new Date(),
      resentCount: (resentCount + 1).toString(),
      updatedAt: new Date(),
    })
    .where(eq(userInvitations.id, invitationId))
    .returning()

  // TODO: Resend email
  const invitationUrl = `${process.env.APP_URL || 'http://localhost:3000'}/accept-invitation?token=${invitation.token}`
  console.log(`Resent invitation URL for ${invitation.email}: ${invitationUrl}`)

  // await sendEmail({
  //   to: invitation.email,
  //   subject: 'Reminder: You\'re invited to join Kadouri Connection CRM',
  //   html: `
  //     <h2>Reminder: You've been invited!</h2>
  //     <p>This is a reminder that you've been invited to join Kadouri Connection CRM as a ${invitation.role}.</p>
  //     <p>Click the link below to accept your invitation and set up your account:</p>
  //     <a href="${invitationUrl}">Accept Invitation</a>
  //     <p>This invitation will expire in ${INVITATION_EXPIRY_DAYS} days.</p>
  //   `,
  // })

  return { ...updatedInvitation, resentCount: parseInt(updatedInvitation.resentCount) } as UserInvitation
}

/**
 * Revoke an invitation
 */
export async function revokeInvitation(invitationId: string): Promise<void> {
  const [invitation] = await db
    .select()
    .from(userInvitations)
    .where(eq(userInvitations.id, invitationId))

  if (!invitation) {
    throw new Error('Invitation not found')
  }

  if (invitation.status !== 'pending') {
    throw new Error(`Cannot revoke invitation with status: ${invitation.status}`)
  }

  await db
    .update(userInvitations)
    .set({
      status: 'revoked',
      updatedAt: new Date(),
    })
    .where(eq(userInvitations.id, invitationId))
}

/**
 * Get invitation by token
 */
export async function getInvitationByToken(token: string): Promise<UserInvitation | null> {
  const [invitation] = await db
    .select()
    .from(userInvitations)
    .where(eq(userInvitations.token, token))

  if (!invitation) {
    return null
  }

  // Check if expired
  if (new Date() > invitation.expiresAt && invitation.status === 'pending') {
    await db
      .update(userInvitations)
      .set({
        status: 'expired',
        updatedAt: new Date(),
      })
      .where(eq(userInvitations.id, invitation.id))

    return { ...invitation, status: 'expired', resentCount: parseInt(invitation.resentCount) } as unknown as UserInvitation
  }

  return { ...invitation, resentCount: parseInt(invitation.resentCount) } as unknown as UserInvitation
}

/**
 * Accept invitation (called when user completes signup)
 * Updates Clerk metadata with the role
 */
export async function acceptInvitation(token: string, clerkUserId: string): Promise<void> {
  const invitation = await getInvitationByToken(token)

  if (!invitation) {
    throw new Error('Invalid invitation token')
  }

  if (invitation.status !== 'pending') {
    throw new Error(`Invitation is ${invitation.status}`)
  }

  // Update Clerk user with role in public metadata
  await clerkClient.users.updateUser(clerkUserId, {
    publicMetadata: {
      role: invitation.role,
    },
  })

  // Mark invitation as accepted
  await db
    .update(userInvitations)
    .set({
      status: 'accepted',
      acceptedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(userInvitations.id, invitation.id))

  // Create or update user record in local database
  const existingUser = await db.select().from(users).where(eq(users.id, clerkUserId))

  if (existingUser.length === 0) {
    // Get user details from Clerk
    const clerkUser = await clerkClient.users.getUser(clerkUserId)

    await db.insert(users).values({
      id: clerkUserId,
      email: clerkUser.emailAddresses[0]?.emailAddress || invitation.email,
      firstName: clerkUser.firstName || '',
      lastName: clerkUser.lastName || '',
      role: invitation.role,
      active: true,
      mfaEnabled: false,
    })
  } else {
    await db
      .update(users)
      .set({
        role: invitation.role,
        updatedAt: new Date(),
      })
      .where(eq(users.id, clerkUserId))
  }
}

/**
 * Get all invitations (with optional status filter)
 */
export async function getAllInvitations(status?: InvitationStatus): Promise<UserInvitation[]> {
  let results
  if (status) {
    results = await db
      .select()
      .from(userInvitations)
      .where(eq(userInvitations.status, status))
  } else {
    results = await db.select().from(userInvitations)
  }

  return results.map((inv) => ({ ...inv, resentCount: parseInt(inv.resentCount) })) as unknown as UserInvitation[]
}

/**
 * Get invitations sent by a specific user
 */
export async function getInvitationsByInviter(invitedBy: string): Promise<UserInvitation[]> {
  const results = await db
    .select()
    .from(userInvitations)
    .where(eq(userInvitations.invitedBy, invitedBy))

  return results.map((inv) => ({ ...inv, resentCount: parseInt(inv.resentCount) })) as unknown as UserInvitation[]
}

/**
 * Clean up expired invitations (should be run periodically)
 */
export async function cleanupExpiredInvitations(): Promise<number> {
  const result = await db
    .update(userInvitations)
    .set({
      status: 'expired',
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(userInvitations.status, 'pending'),
        lt(userInvitations.expiresAt, new Date())
      )
    )

  return (result as any).rowCount || 0
}
