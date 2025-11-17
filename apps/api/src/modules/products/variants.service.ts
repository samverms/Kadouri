import { db } from '../../db'
import { productVariants } from '../../db/schema'
import { eq, and, not } from 'drizzle-orm'
import { AppError } from '../../middleware/error-handler'
import { logger } from '../../utils/logger'

export class VariantsService {
  // Get all variants for a product
  async getVariantsByProduct(productId: string) {
    try {
      const variants = await db
        .select()
        .from(productVariants)
        .where(eq(productVariants.productId, productId))
        .orderBy(productVariants.size)

      return variants
    } catch (error) {
      logger.error('Error fetching product variants:', error)
      throw new AppError('Failed to fetch product variants', 500)
    }
  }

  // Get a single variant by ID
  async getVariantById(id: string) {
    try {
      const [variant] = await db
        .select()
        .from(productVariants)
        .where(eq(productVariants.id, id))

      if (!variant) {
        throw new AppError('Product variant not found', 404)
      }

      return variant
    } catch (error) {
      if (error instanceof AppError) throw error
      logger.error('Error fetching product variant:', error)
      throw new AppError('Failed to fetch product variant', 500)
    }
  }

  // Create a new variant
  async createVariant(data: {
    productId: string
    sku?: string
    size: number
    sizeUnit: string
    packageType: string
    isDefault?: boolean
    active?: boolean
    createdBy?: string
  }) {
    try {
      // If this variant is being set as default, unset other defaults for this product
      if (data.isDefault) {
        await db
          .update(productVariants)
          .set({ isDefault: false })
          .where(eq(productVariants.productId, data.productId))
      }

      const [variant] = await db
        .insert(productVariants)
        .values({
          productId: data.productId,
          sku: data.sku,
          size: data.size.toString(),
          sizeUnit: data.sizeUnit,
          packageType: data.packageType,
          isDefault: data.isDefault ?? false,
          active: data.active ?? true,
          createdBy: data.createdBy,
          updatedBy: data.createdBy,
        })
        .returning()

      logger.info(`Created product variant: ${variant.id} for product: ${data.productId}`)
      return variant
    } catch (error) {
      logger.error('Error creating product variant:', error)
      throw new AppError('Failed to create product variant', 500)
    }
  }

  // Update a variant
  async updateVariant(
    id: string,
    data: {
      sku?: string
      size?: number
      sizeUnit?: string
      packageType?: string
      isDefault?: boolean
      active?: boolean
      updatedBy?: string
    }
  ) {
    try {
      // Get the variant to check productId for default handling
      const [existing] = await db
        .select()
        .from(productVariants)
        .where(eq(productVariants.id, id))

      if (!existing) {
        throw new AppError('Product variant not found', 404)
      }

      // If setting this variant as default, unset other defaults for the same product
      if (data.isDefault) {
        await db
          .update(productVariants)
          .set({ isDefault: false })
          .where(
            and(
              eq(productVariants.productId, existing.productId),
              not(eq(productVariants.id, id))
            )
          )
      }

      const updateData: any = {
        updatedAt: new Date(),
      }

      if (data.sku !== undefined) updateData.sku = data.sku
      if (data.size !== undefined) updateData.size = data.size.toString()
      if (data.sizeUnit !== undefined) updateData.sizeUnit = data.sizeUnit
      if (data.packageType !== undefined) updateData.packageType = data.packageType
      if (data.isDefault !== undefined) updateData.isDefault = data.isDefault
      if (data.active !== undefined) updateData.active = data.active
      if (data.updatedBy) updateData.updatedBy = data.updatedBy

      const [updated] = await db
        .update(productVariants)
        .set(updateData)
        .where(eq(productVariants.id, id))
        .returning()

      if (!updated) {
        throw new AppError('Product variant not found', 404)
      }

      logger.info(`Updated product variant: ${updated.id} by user: ${data.updatedBy || 'unknown'}`)
      return updated
    } catch (error) {
      if (error instanceof AppError) throw error
      logger.error('Error updating product variant:', error)
      throw new AppError('Failed to update product variant', 500)
    }
  }

  // Delete a variant
  async deleteVariant(id: string) {
    try {
      const [deleted] = await db
        .delete(productVariants)
        .where(eq(productVariants.id, id))
        .returning()

      if (!deleted) {
        throw new AppError('Product variant not found', 404)
      }

      logger.info(`Deleted product variant: ${id}`)
      return { success: true, message: 'Product variant deleted successfully' }
    } catch (error) {
      if (error instanceof AppError) throw error
      logger.error('Error deleting product variant:', error)
      throw new AppError('Failed to delete product variant', 500)
    }
  }

  // Set default variant for a product
  async setDefaultVariant(productId: string, variantId: string) {
    try {
      // Unset all defaults for this product
      await db
        .update(productVariants)
        .set({ isDefault: false })
        .where(eq(productVariants.productId, productId))

      // Set the specified variant as default
      const [updated] = await db
        .update(productVariants)
        .set({ isDefault: true, updatedAt: new Date() })
        .where(
          and(
            eq(productVariants.id, variantId),
            eq(productVariants.productId, productId)
          )
        )
        .returning()

      if (!updated) {
        throw new AppError('Product variant not found', 404)
      }

      logger.info(`Set default variant: ${variantId} for product: ${productId}`)
      return updated
    } catch (error) {
      if (error instanceof AppError) throw error
      logger.error('Error setting default variant:', error)
      throw new AppError('Failed to set default variant', 500)
    }
  }
}

export const variantsService = new VariantsService()
