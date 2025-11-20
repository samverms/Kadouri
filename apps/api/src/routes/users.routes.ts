import { Router } from 'express'
import { clerkClient } from '@clerk/express'
import { getActiveUsers } from '../modules/users/users.service'
import { db } from '../db'
import { userRoles, roles } from '../db/schema'
import { eq } from 'drizzle-orm'

const router = Router()

// Get all users from Clerk with their roles
router.get('/', async (req, res, next) => {
  try {
    // Fetch all users from Clerk
    const clerkUsers = await clerkClient.users.getUserList({
      limit: 500, // Adjust as needed
    })

    // Fetch user roles from database
    const userRolesData = await db
      .select({
        clerkUserId: userRoles.clerkUserId,
        roleId: userRoles.roleId,
        roleName: roles.name,
      })
      .from(userRoles)
      .leftJoin(roles, eq(userRoles.roleId, roles.id))

    // Create a map of userId -> role
    const userRoleMap = new Map()
    userRolesData.forEach((ur) => {
      userRoleMap.set(ur.clerkUserId, ur.roleName)
    })

    // Format users with role information
    const formattedUsers = clerkUsers.data.map((user) => ({
      id: user.id,
      email: user.emailAddresses[0]?.emailAddress || '',
      firstName: user.firstName,
      lastName: user.lastName,
      role: userRoleMap.get(user.id) || (user.publicMetadata?.role as string) || 'agent',
      active: !user.banned && user.emailAddresses[0]?.verification?.status === 'verified',
      lastLoginAt: user.lastSignInAt ? new Date(user.lastSignInAt).toISOString() : null,
      createdAt: new Date(user.createdAt).toISOString(),
      imageUrl: user.imageUrl,
    }))

    res.json(formattedUsers)
  } catch (error) {
    next(error)
  }
})

// Get all active users (for agent/broker dropdowns)
router.get('/active', async (req, res, next) => {
  try {
    const activeUsers = await getActiveUsers()
    res.json(activeUsers)
  } catch (error) {
    next(error)
  }
})

// Get user name by ID
router.get('/:userId/name', async (req, res, next) => {
  try {
    const { userId } = req.params
    const user = await clerkClient.users.getUser(userId)

    const name = `${user.firstName || ''} ${user.lastName || ''}`.trim() ||
                 user.username ||
                 user.emailAddresses[0]?.emailAddress ||
                 userId

    res.json({ name, userId })
  } catch (error) {
    // If user not found, return the ID as the name
    res.json({ name: req.params.userId, userId: req.params.userId })
  }
})

export default router
