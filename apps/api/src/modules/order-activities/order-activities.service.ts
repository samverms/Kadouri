import { db } from '../../db'
import { orderActivities, type NewOrderActivity, type OrderActivity } from '../../db/schema'
import { eq, desc } from 'drizzle-orm'

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
    const [activity] = await db
      .insert(orderActivities)
      .values({
        orderId: data.orderId,
        clerkUserId: data.clerkUserId || null,
        userName: data.userName || 'System',
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
    return await db
      .select()
      .from(orderActivities)
      .where(eq(orderActivities.orderId, orderId))
      .orderBy(desc(orderActivities.createdAt))
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
