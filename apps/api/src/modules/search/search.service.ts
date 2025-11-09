import { db } from '../../db'
import { accounts, addresses, contacts } from '../../db/schema/accounts'
import { orders } from '../../db/schema/orders'
import { ilike, or, sql } from 'drizzle-orm'

interface SearchResult {
  type: 'account' | 'order' | 'invoice' | 'contact'
  id: string
  title: string
  subtitle: string
  description?: string
  link: string
}

export const searchService = {
  async globalSearch(query: string): Promise<SearchResult[]> {
    const results: SearchResult[] = []
    const searchPattern = `%${query}%`

    try {
      // Search Accounts
      const accountResults = await db
        .select({
          id: accounts.id,
          name: accounts.name,
          code: accounts.code,
        })
        .from(accounts)
        .where(
          or(
            ilike(accounts.name, searchPattern),
            ilike(accounts.code, searchPattern)
          )
        )
        .limit(10)

      for (const account of accountResults) {
        // Get primary contact for subtitle
        const primaryContact = await db
          .select({
            name: contacts.name,
            email: contacts.email,
          })
          .from(contacts)
          .where(sql`${contacts.accountId} = ${account.id} AND ${contacts.isPrimary} = true`)
          .limit(1)

        results.push({
          type: 'account',
          id: account.id,
          title: account.name,
          subtitle: `Account Code: ${account.code}`,
          description: primaryContact[0]
            ? `Primary contact: ${primaryContact[0].name} (${primaryContact[0].email})`
            : undefined,
          link: `/accounts/${account.id}`,
        })
      }

      // Search Contacts
      const contactResults = await db
        .select({
          id: contacts.id,
          name: contacts.name,
          email: contacts.email,
          phone: contacts.phone,
          accountId: contacts.accountId,
        })
        .from(contacts)
        .where(
          or(
            ilike(contacts.name, searchPattern),
            ilike(contacts.email, searchPattern),
            ilike(contacts.phone, searchPattern)
          )
        )
        .limit(10)

      for (const contact of contactResults) {
        // Get account name
        const account = await db
          .select({ name: accounts.name })
          .from(accounts)
          .where(sql`${accounts.id} = ${contact.accountId}`)
          .limit(1)

        results.push({
          type: 'contact',
          id: contact.id,
          title: contact.name,
          subtitle: account[0]?.name || 'Unknown Account',
          description: `${contact.email}${contact.phone ? ` | ${contact.phone}` : ''}`,
          link: `/accounts/${contact.accountId}`,
        })
      }

      // Search Orders
      const orderResults = await db
        .select({
          id: orders.id,
          orderNo: orders.orderNo,
          status: orders.status,
          totalAmount: orders.totalAmount,
          buyerId: orders.buyerId,
        })
        .from(orders)
        .where(ilike(orders.orderNo, searchPattern))
        .limit(10)

      for (const order of orderResults) {
        // Get buyer account name
        const buyer = await db
          .select({ name: accounts.name })
          .from(accounts)
          .where(sql`${accounts.id} = ${order.buyerId}`)
          .limit(1)

        results.push({
          type: 'order',
          id: order.id,
          title: `Order #${order.orderNo}`,
          subtitle: buyer[0]?.name || 'Unknown Buyer',
          description: `Status: ${order.status} | Total: $${parseFloat(order.totalAmount || '0').toFixed(2)}`,
          link: `/orders/${order.id}`,
        })
      }

      // TODO: Search Invoices when QBO sync is active
      // For now, we'll search orders with 'posted_to_qb' status as invoices
      const invoiceResults = await db
        .select({
          id: orders.id,
          orderNo: orders.orderNo,
          qboDocNumber: orders.qboDocNumber,
          totalAmount: orders.totalAmount,
          buyerId: orders.buyerId,
        })
        .from(orders)
        .where(
          sql`${orders.status} = 'posted_to_qb' AND (${ilike(orders.orderNo, searchPattern)} OR ${ilike(orders.qboDocNumber, searchPattern)})`
        )
        .limit(10)

      for (const invoice of invoiceResults) {
        const buyer = await db
          .select({ name: accounts.name })
          .from(accounts)
          .where(sql`${accounts.id} = ${invoice.buyerId}`)
          .limit(1)

        results.push({
          type: 'invoice',
          id: invoice.id,
          title: `Invoice #${invoice.qboDocNumber || invoice.orderNo}`,
          subtitle: buyer[0]?.name || 'Unknown Buyer',
          description: `Amount: $${parseFloat(invoice.totalAmount || '0').toFixed(2)}`,
          link: `/invoices/${invoice.id}`,
        })
      }

      return results
    } catch (error) {
      console.error('Search service error:', error)
      throw error
    }
  },
}
