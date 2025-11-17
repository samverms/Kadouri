import { db } from '../../db'
import { contracts, contractDraws, accounts, products, contacts, addresses } from '../../db/schema'
import { eq, and, desc, gte, lte, sql } from 'drizzle-orm'
import { AppError } from '../../middleware/error-handler'
import { logger } from '../../utils/logger'

export class ContractsService {
  /**
   * Generate next contract number
   */
  private async generateContractNumber(): Promise<string> {
    const year = new Date().getFullYear()
    const prefix = `C${year}-`

    const [lastContract] = await db
      .select({ contractNumber: contracts.contractNumber })
      .from(contracts)
      .where(sql`${contracts.contractNumber} LIKE ${prefix + '%'}`)
      .orderBy(desc(contracts.contractNumber))
      .limit(1)

    if (!lastContract) {
      return `${prefix}001`
    }

    const lastNumber = parseInt(lastContract.contractNumber.split('-')[1])
    const nextNumber = (lastNumber + 1).toString().padStart(3, '0')
    return `${prefix}${nextNumber}`
  }

  /**
   * Create a new contract
   */
  async createContract(data: {
    sellerId: string
    buyerId: string
    productId: string
    totalQuantity: number
    unit: string
    pricePerUnit: number
    validFrom: Date
    validUntil: Date
    brokerName?: string
    brokerAddress?: string
    brokerPhone?: string
    brokerEmail?: string
    terms?: string
    notes?: string
    createdBy: string
  }) {
    // Validate parties
    if (data.sellerId === data.buyerId) {
      throw new AppError('Seller and buyer must be different', 400)
    }

    // Validate dates
    if (data.validFrom >= data.validUntil) {
      throw new AppError('Valid from date must be before valid until date', 400)
    }

    // Calculate total value
    const totalValue = data.totalQuantity * data.pricePerUnit

    // Generate contract number
    const contractNumber = await this.generateContractNumber()

    // Create contract
    const [contract] = await db.insert(contracts).values({
      contractNumber,
      sellerId: data.sellerId,
      buyerId: data.buyerId,
      productId: data.productId,
      totalQuantity: data.totalQuantity.toString(),
      remainingQuantity: data.totalQuantity.toString(), // Initially all quantity available
      unit: data.unit,
      pricePerUnit: data.pricePerUnit.toString(),
      totalValue: totalValue.toString(),
      validFrom: data.validFrom,
      validUntil: data.validUntil,
      brokerName: data.brokerName,
      brokerAddress: data.brokerAddress,
      brokerPhone: data.brokerPhone,
      brokerEmail: data.brokerEmail,
      terms: data.terms,
      notes: data.notes,
      createdBy: data.createdBy,
    }).returning()

    logger.info(`Contract created: ${contract.id}`, { contractNumber })

    return contract
  }

  /**
   * Get contract by ID with related data
   */
  async getContractById(contractId: string) {
    const [contract] = await db
      .select({
        id: contracts.id,
        contractNumber: contracts.contractNumber,
        sellerId: contracts.sellerId,
        buyerId: contracts.buyerId,
        productId: contracts.productId,
        totalQuantity: contracts.totalQuantity,
        remainingQuantity: contracts.remainingQuantity,
        unit: contracts.unit,
        pricePerUnit: contracts.pricePerUnit,
        currency: contracts.currency,
        totalValue: contracts.totalValue,
        validFrom: contracts.validFrom,
        validUntil: contracts.validUntil,
        status: contracts.status,
        brokerName: contracts.brokerName,
        brokerAddress: contracts.brokerAddress,
        brokerPhone: contracts.brokerPhone,
        brokerEmail: contracts.brokerEmail,
        terms: contracts.terms,
        notes: contracts.notes,
        draftDocumentUrl: contracts.draftDocumentUrl,
        draftDocumentType: contracts.draftDocumentType,
        draftGeneratedAt: contracts.draftGeneratedAt,
        executedDocumentUrl: contracts.executedDocumentUrl,
        executedDocumentType: contracts.executedDocumentType,
        executedUploadedAt: contracts.executedUploadedAt,
        executedUploadedBy: contracts.executedUploadedBy,
        documentVersions: contracts.documentVersions,
        createdBy: contracts.createdBy,
        createdAt: contracts.createdAt,
        updatedAt: contracts.updatedAt,
      })
      .from(contracts)
      .where(eq(contracts.id, contractId))

    if (!contract) {
      throw new AppError('Contract not found', 404)
    }

    // Get seller info
    const [sellerAccount] = await db
      .select({
        id: accounts.id,
        name: accounts.name,
      })
      .from(accounts)
      .where(eq(accounts.id, contract.sellerId))

    const [sellerContact] = await db
      .select({
        email: contacts.email,
      })
      .from(contacts)
      .where(and(
        eq(contacts.accountId, contract.sellerId),
        eq(contacts.isPrimary, true)
      ))

    const [sellerAddress] = await db
      .select({
        line1: addresses.line1,
        line2: addresses.line2,
        city: addresses.city,
        state: addresses.state,
        postalCode: addresses.postalCode,
        country: addresses.country,
      })
      .from(addresses)
      .where(and(
        eq(addresses.accountId, contract.sellerId),
        eq(addresses.isPrimary, true)
      ))

    const seller = {
      id: sellerAccount.id,
      companyName: sellerAccount.name,
      email: sellerContact?.email || null,
      address: sellerAddress ? `${sellerAddress.line1}${sellerAddress.line2 ? ', ' + sellerAddress.line2 : ''}, ${sellerAddress.city}, ${sellerAddress.state} ${sellerAddress.postalCode}, ${sellerAddress.country}` : null,
    }

    // Get buyer info
    const [buyerAccount] = await db
      .select({
        id: accounts.id,
        name: accounts.name,
      })
      .from(accounts)
      .where(eq(accounts.id, contract.buyerId))

    const [buyerContact] = await db
      .select({
        email: contacts.email,
      })
      .from(contacts)
      .where(and(
        eq(contacts.accountId, contract.buyerId),
        eq(contacts.isPrimary, true)
      ))

    const [buyerAddress] = await db
      .select({
        line1: addresses.line1,
        line2: addresses.line2,
        city: addresses.city,
        state: addresses.state,
        postalCode: addresses.postalCode,
        country: addresses.country,
      })
      .from(addresses)
      .where(and(
        eq(addresses.accountId, contract.buyerId),
        eq(addresses.isPrimary, true)
      ))

    const buyer = {
      id: buyerAccount.id,
      companyName: buyerAccount.name,
      email: buyerContact?.email || null,
      address: buyerAddress ? `${buyerAddress.line1}${buyerAddress.line2 ? ', ' + buyerAddress.line2 : ''}, ${buyerAddress.city}, ${buyerAddress.state} ${buyerAddress.postalCode}, ${buyerAddress.country}` : null,
    }

    // Get product info
    const [product] = await db
      .select({
        id: products.id,
        name: products.name,
      })
      .from(products)
      .where(eq(products.id, contract.productId))

    return {
      ...contract,
      seller,
      buyer,
      product,
    }
  }

  /**
   * Get all contracts with filters
   */
  async getContracts(filters?: {
    status?: string
    sellerId?: string
    buyerId?: string
    productId?: string
    validFrom?: Date
    validUntil?: Date
  }) {
    let query = db.select().from(contracts)

    const conditions = []

    if (filters?.status) {
      conditions.push(eq(contracts.status, filters.status as any))
    }
    if (filters?.sellerId) {
      conditions.push(eq(contracts.sellerId, filters.sellerId))
    }
    if (filters?.buyerId) {
      conditions.push(eq(contracts.buyerId, filters.buyerId))
    }
    if (filters?.productId) {
      conditions.push(eq(contracts.productId, filters.productId))
    }
    if (filters?.validFrom) {
      conditions.push(gte(contracts.validFrom, filters.validFrom))
    }
    if (filters?.validUntil) {
      conditions.push(lte(contracts.validUntil, filters.validUntil))
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any
    }

    const results = await query.orderBy(desc(contracts.createdAt))

    return results
  }

  /**
   * Update contract
   */
  async updateContract(contractId: string, data: Partial<{
    totalQuantity: number
    unit: string
    pricePerUnit: number
    validFrom: Date
    validUntil: Date
    status: string
    brokerName: string
    brokerAddress: string
    brokerPhone: string
    brokerEmail: string
    terms: string
    notes: string
  }>) {
    const updateData: any = {
      ...data,
      updatedAt: new Date(),
    }

    // Recalculate total value if quantity or price changed
    if (data.totalQuantity || data.pricePerUnit) {
      const contract = await this.getContractById(contractId)
      const quantity = data.totalQuantity || parseFloat(contract.totalQuantity)
      const price = data.pricePerUnit || parseFloat(contract.pricePerUnit)
      updateData.totalValue = (quantity * price).toString()
    }

    const [updated] = await db
      .update(contracts)
      .set(updateData)
      .where(eq(contracts.id, contractId))
      .returning()

    if (!updated) {
      throw new AppError('Contract not found', 404)
    }

    logger.info(`Contract updated: ${contractId}`)

    return updated
  }

  /**
   * Delete contract
   */
  async deleteContract(contractId: string) {
    const [deleted] = await db
      .delete(contracts)
      .where(eq(contracts.id, contractId))
      .returning()

    if (!deleted) {
      throw new AppError('Contract not found', 404)
    }

    logger.info(`Contract deleted: ${contractId}`)

    return deleted
  }

  /**
   * Find matching contracts for order
   */
  async findMatchingContracts(sellerId: string, buyerId: string, productId: string) {
    const today = new Date()

    const matchingContracts = await db
      .select()
      .from(contracts)
      .where(
        and(
          eq(contracts.sellerId, sellerId),
          eq(contracts.buyerId, buyerId),
          eq(contracts.productId, productId),
          eq(contracts.status, 'active'),
          lte(contracts.validFrom, today),
          gte(contracts.validUntil, today),
          sql`${contracts.remainingQuantity}::numeric > 0`
        )
      )
      .orderBy(desc(contracts.createdAt))

    return matchingContracts
  }

  /**
   * Update draft document info
   */
  async updateDraftDocument(contractId: string, documentUrl: string, documentType: string) {
    await db
      .update(contracts)
      .set({
        draftDocumentUrl: documentUrl,
        draftDocumentType: documentType,
        draftGeneratedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(contracts.id, contractId))
  }

  /**
   * Update executed document info
   */
  async updateExecutedDocument(
    contractId: string,
    documentUrl: string,
    documentType: string,
    uploadedBy: string
  ) {
    const contract = await this.getContractById(contractId)

    // Add current executed document to version history
    const versions = (contract.documentVersions as any[]) || []
    if (contract.executedDocumentUrl) {
      versions.push({
        url: contract.executedDocumentUrl,
        type: contract.executedDocumentType,
        uploadedAt: contract.executedUploadedAt?.toISOString(),
        uploadedBy: contract.executedUploadedBy,
      })
    }

    await db
      .update(contracts)
      .set({
        executedDocumentUrl: documentUrl,
        executedDocumentType: documentType,
        executedUploadedAt: new Date(),
        executedUploadedBy: uploadedBy,
        documentVersions: versions as any,
        updatedAt: new Date(),
      })
      .where(eq(contracts.id, contractId))
  }

  /**
   * Record a contract draw and update remaining quantity
   */
  async recordContractDraw(
    contractId: string,
    orderId: string,
    quantityDrawn: number,
    drawnBy: string
  ) {
    // Get current contract
    const contract = await this.getContractById(contractId)

    const currentRemaining = parseFloat(contract.remainingQuantity)

    // Validate quantity
    if (quantityDrawn > currentRemaining) {
      throw new AppError(
        `Cannot draw ${quantityDrawn} ${contract.unit}. Only ${currentRemaining} ${contract.unit} remaining.`,
        400
      )
    }

    const newRemaining = currentRemaining - quantityDrawn

    // Update contract remaining quantity
    await db
      .update(contracts)
      .set({
        remainingQuantity: newRemaining.toString(),
        updatedAt: new Date(),
      })
      .where(eq(contracts.id, contractId))

    // Record the draw in contract_draws table
    const [draw] = await db
      .insert(contractDraws)
      .values({
        contractId,
        orderId,
        quantityDrawn: quantityDrawn.toString(),
        remainingAfterDraw: newRemaining.toString(),
        drawnBy,
      })
      .returning()

    logger.info(`Contract draw recorded: ${draw.id}`, {
      contractId,
      orderId,
      quantityDrawn,
      remainingAfterDraw: newRemaining,
    })

    // Check if contract is now completed
    if (newRemaining === 0) {
      await db
        .update(contracts)
        .set({
          status: 'completed',
          updatedAt: new Date(),
        })
        .where(eq(contracts.id, contractId))

      logger.info(`Contract completed: ${contractId}`)
    }

    return draw
  }

  /**
   * Get contract draws history
   */
  async getContractDraws(contractId: string) {
    const draws = await db
      .select()
      .from(contractDraws)
      .where(eq(contractDraws.contractId, contractId))
      .orderBy(desc(contractDraws.drawnAt))

    return draws
  }
}

export default new ContractsService()

