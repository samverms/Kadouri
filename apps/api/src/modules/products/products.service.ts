import { db } from '../../db'
import { products, productVariants } from '../../db/schema'
import { eq, ilike, or, and } from 'drizzle-orm'
import { AppError } from '../../middleware/error-handler'
import { logger } from '../../utils/logger'

export class ProductsService {
  async createProduct(data: {
    code?: string
    name: string
    variety?: string
    grade?: string
    category?: string
    defaultUnitSize?: number
    uom?: string
    qboItemId?: string
    active?: boolean
  }) {
    const insertData: any = {
      name: data.name,
      source: 'manual',
    }

    if (data.code !== undefined) insertData.code = data.code
    if (data.variety !== undefined) insertData.variety = data.variety
    if (data.grade !== undefined) insertData.grade = data.grade
    if (data.category !== undefined) insertData.category = data.category
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

    // Fetch variants for this product
    const variants = await db
      .select()
      .from(productVariants)
      .where(eq(productVariants.productId, id))
      .orderBy(productVariants.size)

    return {
      ...product,
      variants,
    }
  }

  async searchProducts(search?: string, limit = 10000, includeInactive = false) {
    let query = db.select().from(products)

    // Build where conditions
    const conditions: any[] = []

    // Filter by active status unless explicitly including inactive
    if (!includeInactive) {
      conditions.push(eq(products.active, true))
    }

    // Add search conditions
    if (search) {
      conditions.push(
        or(
          ilike(products.code, `%${search}%`),
          ilike(products.name, `%${search}%`),
          ilike(products.variety, `%${search}%`),
          ilike(products.grade, `%${search}%`)
        )
      )
    }

    // Apply where clause with AND logic between conditions
    if (conditions.length > 0) {
      query = query.where(
        conditions.length === 1 ? conditions[0] : and(...conditions)
      ) as any
    }

    const results = await query.limit(limit)

    // Fetch variants for each product
    const productsWithVariants = await Promise.all(
      results.map(async (product) => {
        const variants = await db
          .select()
          .from(productVariants)
          .where(eq(productVariants.productId, product.id))
          .orderBy(productVariants.size)

        return {
          ...product,
          variants,
        }
      })
    )

    return productsWithVariants
  }

  async updateProduct(
    id: string,
    data: {
      code?: string
      name?: string
      variety?: string
      grade?: string
      category?: string
      defaultUnitSize?: number
      uom?: string
      active?: boolean
    },
    updatedBy?: string
  ) {
    const updateData: any = {
      updatedAt: new Date(),
    }

    if (data.code !== undefined) updateData.code = data.code
    if (data.name !== undefined) updateData.name = data.name
    if (data.variety !== undefined) updateData.variety = data.variety
    if (data.grade !== undefined) updateData.grade = data.grade
    if (data.category !== undefined) updateData.category = data.category
    if (data.defaultUnitSize !== undefined) updateData.defaultUnitSize = data.defaultUnitSize.toString()
    if (data.uom !== undefined) updateData.uom = data.uom
    if (data.active !== undefined) updateData.active = data.active
    if (updatedBy) updateData.updatedBy = updatedBy

    const [updated] = await db
      .update(products)
      .set(updateData)
      .where(eq(products.id, id))
      .returning()

    if (!updated) {
      throw new AppError('Product not found', 404)
    }

    logger.info(`Updated product: ${updated.id} by user: ${updatedBy || 'unknown'}`)
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
