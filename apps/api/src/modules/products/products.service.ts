import { db } from '../../db'
import { products } from '../../db/schema'
import { eq, ilike, or } from 'drizzle-orm'
import { AppError } from '../../middleware/error-handler'
import { logger } from '../../utils/logger'

export class ProductsService {
  async createProduct(data: {
    name: string
    variety?: string
    grade?: string
    defaultUnitSize?: number
    uom: string
    qboItemId?: string
    active?: boolean
  }) {
    const insertData: any = {
      name: data.name,
      uom: data.uom,
    }

    if (data.variety !== undefined) insertData.variety = data.variety
    if (data.grade !== undefined) insertData.grade = data.grade
    if (data.defaultUnitSize !== undefined) insertData.defaultUnitSize = data.defaultUnitSize.toString()
    if (data.qboItemId !== undefined) insertData.qboItemId = data.qboItemId
    if (data.active !== undefined) insertData.active = data.active

    const [product] = await db
      .insert(products)
      .values(insertData)
      .returning()

    logger.info(`Created product: ${product.id}`)
    return product
  }

  async getProduct(id: string) {
    const [product] = await db.select().from(products).where(eq(products.id, id))

    if (!product) {
      throw new AppError('Product not found', 404)
    }

    return product
  }

  async searchProducts(search?: string, limit = 50) {
    let query = db.select().from(products)

    if (search) {
      query = query.where(
        or(
          ilike(products.name, `%${search}%`),
          ilike(products.variety, `%${search}%`),
          ilike(products.grade, `%${search}%`)
        )
      ) as any
    }

    const results = await query.where(eq(products.active, true)).limit(limit)
    return results
  }

  async updateProduct(
    id: string,
    data: {
      name?: string
      variety?: string
      grade?: string
      defaultUnitSize?: number
      uom?: string
      active?: boolean
    }
  ) {
    const updateData: any = {
      updatedAt: new Date(),
    }

    if (data.name !== undefined) updateData.name = data.name
    if (data.variety !== undefined) updateData.variety = data.variety
    if (data.grade !== undefined) updateData.grade = data.grade
    if (data.defaultUnitSize !== undefined) updateData.defaultUnitSize = data.defaultUnitSize.toString()
    if (data.uom !== undefined) updateData.uom = data.uom
    if (data.active !== undefined) updateData.active = data.active

    const [updated] = await db
      .update(products)
      .set(updateData)
      .where(eq(products.id, id))
      .returning()

    if (!updated) {
      throw new AppError('Product not found', 404)
    }

    logger.info(`Updated product: ${updated.id}`)
    return updated
  }

  async linkQboItem(id: string, qboItemId: string) {
    const [updated] = await db
      .update(products)
      .set({
        qboItemId,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id))
      .returning()

    if (!updated) {
      throw new AppError('Product not found', 404)
    }

    logger.info(`Linked product ${id} to QBO item ${qboItemId}`)
    return updated
  }

  async deleteProduct(id: string) {
    // Soft delete by marking as inactive
    const [deleted] = await db
      .update(products)
      .set({
        active: false,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id))
      .returning()

    if (!deleted) {
      throw new AppError('Product not found', 404)
    }

    logger.info(`Deleted product: ${deleted.id}`)
    return deleted
  }
}
