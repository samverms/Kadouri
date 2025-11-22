import { db } from '../../db'
import { orderActivities, type NewOrderActivity, type OrderActivity } from '../../db/schema'
import { eq, desc } from 'drizzle-orm'
import { clerkClient } from '@clerk/express'

export class OrderActivityService {
  /**
   * Record an activity for an order
   */
  static async recordActivity(data: {
    orderId: string
    clerkUserId?: string
    userName?: string
    activityType: string
    description: string
    changes?: object
    ipAddress?: string
  }): Promise<OrderActivity> {
    // Look up user name from Clerk if clerkUserId is provided but userName is not
    let userName = data.userName || 'System'
    if (data.clerkUserId && !data.userName) {
      try {
        const user = await clerkClient.users.getUser(data.clerkUserId)
        userName = user.firstName && user.lastName
          ? `${user.firstName} ${user.lastName}`
          : user.emailAddresses?.[0]?.emailAddress || 'Unknown User'
      } catch (err) {
        // If Clerk lookup fails, use a fallback
        userName = 'Unknown User'
      }
    }

    const [activity] = await db
      .insert(orderActivities)
      .values({
        orderId: data.orderId,
        clerkUserId: data.clerkUserId || null,
        userName,
        activityType: data.activityType,
        description: data.description,
        changes: data.changes || null,
        ipAddress: data.ipAddress || null,
      })
      .returning()

    return activity
  }

  /**
   * Get all activities for an order
   */
  static async getOrderActivities(orderId: string): Promise<OrderActivity[]> {
    const activities = await db
      .select()
      .from(orderActivities)
      .where(eq(orderActivities.orderId, orderId))
      .orderBy(desc(orderActivities.createdAt))

    // Enrich activities with user names from Clerk if missing
    return await Promise.all(
      activities.map(async (activity) => {
        if (!activity.userName && activity.clerkUserId) {
          try {
            const user = await clerkClient.users.getUser(activity.clerkUserId)
            return {
              ...activity,
              userName: user.firstName && user.lastName
                ? `${user.firstName} ${user.lastName}`
                : user.emailAddresses?.[0]?.emailAddress || 'Unknown User',
            }
          } catch (err) {
            return { ...activity, userName: 'Unknown User' }
          }
        }
        return activity
      })
    )
  }

  /**
   * Get recent activities across all orders
   */
  static async getRecentActivities(limit: number = 50): Promise<OrderActivity[]> {
    return await db
      .select()
      .from(orderActivities)
      .orderBy(desc(orderActivities.createdAt))
      .limit(limit)
  }

  /**
   * Get activities by type
   */
  static async getActivitiesByType(
    activityType: string,
    limit: number = 50
  ): Promise<OrderActivity[]> {
    return await db
      .select()
      .from(orderActivities)
      .where(eq(orderActivities.activityType, activityType))
      .orderBy(desc(orderActivities.createdAt))
      .limit(limit)
  }
}
