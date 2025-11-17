import { Router } from 'express'
import { OrderActivityService } from './order-activities.service'
import { authenticate } from '../../middleware/auth'

const router = Router()

// Get all activities for a specific order
router.get('/orders/:orderId/activities', authenticate, async (req, res, next) => {
  try {
    const { orderId } = req.params

    const activities = await OrderActivityService.getOrderActivities(orderId)

    res.json({
      success: true,
      count: activities.length,
      activities,
    })
  } catch (error: any) {
    console.error('Get order activities error:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch activities',
    })
  }
})

// Get recent activities across all orders (admin/reporting)
router.get('/activities/recent', authenticate, async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50

    const activities = await OrderActivityService.getRecentActivities(limit)

    res.json({
      success: true,
      count: activities.length,
      activities,
    })
  } catch (error: any) {
    console.error('Get recent activities error:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch recent activities',
    })
  }
})

// Get activities by type
router.get('/activities/type/:activityType', authenticate, async (req, res, next) => {
  try {
    const { activityType } = req.params
    const limit = parseInt(req.query.limit as string) || 50

    const activities = await OrderActivityService.getActivitiesByType(activityType, limit)

    res.json({
      success: true,
      count: activities.length,
      activities,
    })
  } catch (error: any) {
    console.error('Get activities by type error:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch activities',
    })
  }
})

export default router
