import { db } from '../../db'
import { users } from '../../db/schema'
import { eq } from 'drizzle-orm'
import { User, UserRole } from '@pace/shared'

/**
 * Get all users
 */
export async function getAllUsers(): Promise<User[]> {
  return (await db.select().from(users)) as User[]
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string): Promise<User | null> {
  const [user] = await db.select().from(users).where(eq(users.id, userId))
  return (user as User) || null
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  const [user] = await db.select().from(users).where(eq(users.email, email))
  return (user as User) || null
}

/**
 * Create or update user from Clerk
 */
export async function upsertUserFromClerk(clerkUser: {
  id: string
  email: string
  firstName?: string
  lastName?: string
}): Promise<User> {
  const existingUser = await getUserById(clerkUser.id)

  if (existingUser) {
    // Update existing user
    const [updatedUser] = await db
      .update(users)
      .set({
        email: clerkUser.email,
        firstName: clerkUser.firstName || existingUser.firstName,
        lastName: clerkUser.lastName || existingUser.lastName,
        lastLoginAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, clerkUser.id))
      .returning()

    return updatedUser as User
  }

  // Create new user with default role
  const [newUser] = await db
    .insert(users)
    .values({
      id: clerkUser.id,
      email: clerkUser.email,
      firstName: clerkUser.firstName || null,
      lastName: clerkUser.lastName || null,
      role: 'agent', // Default role - will be updated if they have an invitation
      lastLoginAt: new Date(),
    })
    .returning()

  return newUser as User
}

/**
 * Update user role (admin only)
 */
export async function updateUserRole(userId: string, role: UserRole): Promise<User> {
  const [updatedUser] = await db
    .update(users)
    .set({
      role,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning()

  if (!updatedUser) {
    throw new Error('User not found')
  }

  return updatedUser as User
}

/**
 * Update user status (active/inactive)
 */
export async function updateUserStatus(userId: string, active: boolean): Promise<User> {
  const [updatedUser] = await db
    .update(users)
    .set({
      active,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning()

  if (!updatedUser) {
    throw new Error('User not found')
  }

  return updatedUser as User
}

/**
 * Delete user (soft delete by setting inactive)
 */
export async function deleteUser(userId: string): Promise<void> {
  await updateUserStatus(userId, false)
}

/**
 * Get active users count
 */
export async function getActiveUsersCount(): Promise<number> {
  const result = await db.select().from(users).where(eq(users.active, true))
  return result.length
}

/**
 * Get users by role
 */
export async function getUsersByRole(role: UserRole): Promise<User[]> {
  return (await db.select().from(users).where(eq(users.role, role))) as User[]
}

/**
 * Get all active users (for agent/broker dropdowns)
 */
export async function getActiveUsers(): Promise<Array<{ id: string; name: string; email: string }>> {
  const activeUsers = await db.select().from(users).where(eq(users.active, true))

  return activeUsers.map(user => ({
    id: user.id,
    name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
    email: user.email,
  }))
}
