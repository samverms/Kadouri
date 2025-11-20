import { QuickBooksClient } from './client'
import { db } from '../../db'
import { accounts, products, orders, syncMaps, addresses } from '../../db/schema'
import { eq } from 'drizzle-orm'
import { logger } from '../../utils/logger'
import { QBOCustomer, QBOItem, QBOInvoice, QBOEstimate, QBOTokens } from './types'

export class QuickBooksSync {
  private qboClient: QuickBooksClient

  constructor(tokens: QBOTokens) {
    this.qboClient = new QuickBooksClient(tokens)
  }

  // Sync account to QBO customer
  async syncAccountToCustomer(accountId: string): Promise<string> {
    // Get account with addresses
    const [account] = await db.select().from(accounts).where(eq(accounts.id, accountId))
    if (!account) {
      throw new Error('Account not found')
    }

    // Check if already synced
    if (account.qboCustomerId) {
      logger.info(`Account ${accountId} already synced to QBO customer ${account.qboCustomerId}`)
      return account.qboCustomerId
    }

    // Get primary billing address
    const [billingAddress] = await db
      .select()
      .from(addresses)
      .where(eq(addresses.accountId, accountId))
      .limit(1)

    // Check if customer exists in QBO
    let qboCustomer = await this.qboClient.findCustomerByName(account.name)

    if (!qboCustomer) {
      // Create new customer
      const customerData: QBOCustomer = {
        DisplayName: account.name,
        CompanyName: account.name,
        BillAddr: billingAddress
          ? {
              Line1: billingAddress.line1,
              Line2: billingAddress.line2 || undefined,
              City: billingAddress.city,
              CountrySubDivisionCode: billingAddress.state,
              PostalCode: billingAddress.postalCode,
              Country: billingAddress.country,
            }
          : undefined,
      }

      qboCustomer = await this.qboClient.createCustomer(customerData)
      logger.info(`Created QBO customer ${qboCustomer.Id} for account ${accountId}`)
    } else {
      logger.info(`Found existing QBO customer ${qboCustomer.Id} for account ${accountId}`)
    }

    // Update account with QBO customer ID
    await db
      .update(accounts)
      .set({ qboCustomerId: qboCustomer.Id })
      .where(eq(accounts.id, accountId))

    // Record sync mapping
    await db.insert(syncMaps).values({
      entityType: 'account',
      entityId: accountId,
      qboType: 'customer',
      qboId: qboCustomer.Id!,
    })

    return qboCustomer.Id!
  }

  // Sync product to QBO item
  async syncProductToItem(productId: string): Promise<string> {
    const [product] = await db.select().from(products).where(eq(products.id, productId))
    if (!product) {
      throw new Error('Product not found')
    }

    // Check if already synced
    if (product.qboItemId) {
      logger.info(`Product ${productId} already synced to QBO item ${product.qboItemId}`)
      return product.qboItemId
    }

    // Build item name with variety and grade
    const itemName = [product.name, product.variety, product.grade]
      .filter(Boolean)
      .join(' - ')

    // Check if item exists
    let qboItem = await this.qboClient.findItemByName(itemName)

    if (!qboItem) {
      // Create new item as Service type (simpler than Inventory)
      const itemData: QBOItem = {
        Name: itemName,
        Type: 'Service',
        IncomeAccountRef: {
          value: '1', // Sales income account - should be configured
          name: 'Sales',
        },
      }

      qboItem = await this.qboClient.createItem(itemData)
      logger.info(`Created QBO item ${qboItem.Id} for product ${productId}`)
    } else {
      logger.info(`Found existing QBO item ${qboItem.Id} for product ${productId}`)
    }

    // Update product with QBO item ID
    await db
      .update(products)
      .set({ qboItemId: qboItem.Id })
      .where(eq(products.id, productId))

    // Record sync mapping
    await db.insert(syncMaps).values({
      entityType: 'product',
      entityId: productId,
      qboType: 'item',
      qboId: qboItem.Id!,
    })

    return qboItem.Id!
  }

  // Push order to QBO as Invoice or Estimate
  async pushOrderToQBO(
    orderId: string,
    docType: 'invoice' | 'estimate'
  ): Promise<{ docId: string; docNumber: string }> {
    // Get order with lines
    const [order] = await db.select().from(orders).where(eq(orders.id, orderId))
    if (!order) {
      throw new Error('Order not found')
    }

    // Check if order is already synced to QB
    const isUpdate = !!(order.qboDocId && order.qboDocType === docType)

    // Ensure buyer is synced
    const buyerQboId = await this.syncAccountToCustomer(order.buyerId)

    // Get order lines with products
    const orderLines = await db.query.orderLines.findMany({
      where: eq(orders.id, orderId),
      with: {
        product: true,
      },
    })

    // Calculate correct total from order lines
    const subtotal = orderLines.reduce((sum, line: any) => sum + parseFloat(line.lineTotal), 0)

    // Ensure all products are synced and build line items
    const qboLines = await Promise.all(
      orderLines.map(async (line: any) => {
        const productQboId = await this.syncProductToItem(line.productId)

        return {
          Description: `${line.product.name} - ${line.sizeGrade || ''} (${line.quantity} ${line.uom})`,
          Amount: parseFloat(line.lineTotal),
          DetailType: 'SalesItemLineDetail' as const,
          SalesItemLineDetail: {
            ItemRef: {
              value: productQboId,
            },
            UnitPrice: parseFloat(line.unitPrice),
            Qty: parseFloat(line.quantity),
          },
        }
      })
    )

    const txnDate = new Date().toISOString().split('T')[0]

    if (docType === 'invoice') {
      const invoiceData: QBOInvoice = {
        TxnDate: txnDate,
        CustomerRef: {
          value: buyerQboId,
        },
        Line: qboLines,
        PrivateNote: `Order #${order.orderNo}${order.contractNo ? ` | Contract: ${order.contractNo}` : ''}${order.commissionTotal ? ` | Commission: $${order.commissionTotal}` : ''}`,
      }

      let qboInvoice

      if (isUpdate) {
        // Update existing invoice
        logger.info(`Updating existing QB invoice ${order.qboDocId} for order ${orderId}`)
        const existingInvoice = await this.qboClient.getInvoice(order.qboDocId!)

        qboInvoice = await this.qboClient.updateInvoice(order.qboDocId!, {
          ...invoiceData,
          Id: order.qboDocId || undefined,
          SyncToken: existingInvoice.SyncToken,
        } as any)
      } else {
        // Create new invoice
        logger.info(`Creating new QB invoice for order ${orderId}`)
        qboInvoice = await this.qboClient.createInvoice(invoiceData)
      }

      // Update order with QBO info
      await db
        .update(orders)
        .set({
          qboDocType: 'invoice',
          qboDocId: qboInvoice.Id,
          qboDocNumber: qboInvoice.DocNumber,
          status: 'posted_to_qb',
        })
        .where(eq(orders.id, orderId))

      return { docId: qboInvoice.Id!, docNumber: qboInvoice.DocNumber! }
    } else {
      const estimateData: QBOEstimate = {
        TxnDate: txnDate,
        CustomerRef: {
          value: buyerQboId,
        },
        Line: qboLines,
        PrivateNote: `Order #${order.orderNo}${order.contractNo ? ` | Contract: ${order.contractNo}` : ''}${order.commissionTotal ? ` | Commission: $${order.commissionTotal}` : ''}`,
      }

      let qboEstimate

      if (isUpdate) {
        // Update existing estimate
        logger.info(`Updating existing QB estimate ${order.qboDocId} for order ${orderId}`)
        const existingEstimate = await this.qboClient.getEstimate(order.qboDocId!)

        qboEstimate = await this.qboClient.updateEstimate(order.qboDocId!, {
          ...estimateData,
          Id: order.qboDocId || undefined,
          SyncToken: existingEstimate.SyncToken,
        } as any)
      } else {
        // Create new estimate
        logger.info(`Creating new QB estimate for order ${orderId}`)
        qboEstimate = await this.qboClient.createEstimate(estimateData)
      }

      // Update order with QBO info
      await db
        .update(orders)
        .set({
          qboDocType: 'estimate',
          qboDocId: qboEstimate.Id,
          qboDocNumber: qboEstimate.DocNumber,
          status: 'posted_to_qb',
        })
        .where(eq(orders.id, orderId))

      return { docId: qboEstimate.Id!, docNumber: qboEstimate.DocNumber! }
    }
  }

  // Sync invoice status from QBO
  async syncInvoiceStatus(orderId: string): Promise<void> {
    const [order] = await db.select().from(orders).where(eq(orders.id, orderId))
    if (!order || !order.qboDocId || order.qboDocType !== 'invoice') {
      return
    }

    const qboInvoice = await this.qboClient.getInvoice(order.qboDocId)

    // Check if paid
    if (qboInvoice.Balance === 0 && parseFloat(qboInvoice.TotalAmt as any) > 0) {
      await db.update(orders).set({ status: 'paid' }).where(eq(orders.id, orderId))
      logger.info(`Order ${orderId} marked as paid`)
    }
  }

  // Void invoice in QuickBooks
  async voidInvoice(orderId: string): Promise<{ success: boolean; message: string }> {
    const [order] = await db.select().from(orders).where(eq(orders.id, orderId))

    if (!order) {
      throw new Error('Order not found')
    }

    if (!order.qboDocId || order.qboDocType !== 'invoice') {
      throw new Error('Order must be synced as an invoice to be voided')
    }

    try {
      // Get the current invoice from QuickBooks
      const qboInvoice = await this.qboClient.getInvoice(order.qboDocId)

      if (!qboInvoice.SyncToken) {
        throw new Error('Invoice SyncToken is required to void invoice')
      }

      // Void the invoice (QuickBooks requires the SyncToken for updates)
      const voidedInvoice = await this.qboClient.voidInvoice(order.qboDocId, qboInvoice.SyncToken)

      // Update local order status
      await db.update(orders)
        .set({
          status: 'cancelled',
          updatedAt: new Date()
        })
        .where(eq(orders.id, orderId))

      logger.info(`Voided invoice ${order.qboDocId} for order ${orderId}`)

      return {
        success: true,
        message: `Invoice ${qboInvoice.DocNumber} voided successfully`
      }
    } catch (error: any) {
      logger.error(`Failed to void invoice for order ${orderId}:`, error)
      throw new Error(`Failed to void invoice: ${error.message}`)
    }
  }
}
