import { Router } from 'express'
import { clerkClient } from '@clerk/express'
import { getActiveUsers } from '../modules/users/users.service'

const router = Router()

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
