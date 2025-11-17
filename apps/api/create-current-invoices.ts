import { db } from './src/db'
import { orders, accounts } from './src/db/schema'
import { eq } from 'drizzle-orm'
import OAuthClient from 'intuit-oauth'
import fetch from 'node-fetch'

async function createCurrentInvoices() {
  try {
    // Get OAuth tokens
    const { quickbooksTokens } = await import('./src/db/schema')
    const tokens = await db.select().from(quickbooksTokens).limit(1)
    const [tokenRecord] = tokens

    if (!tokenRecord) {
      console.error('No QuickBooks tokens found')
      process.exit(1)
    }

    const oauthClient = new OAuthClient({
      clientId: process.env.QBO_CLIENT_ID!,
      clientSecret: process.env.QBO_CLIENT_SECRET!,
      environment: process.env.QBO_ENVIRONMENT as 'sandbox' | 'production',
      redirectUri: process.env.QBO_REDIRECT_URI!,
    })

    oauthClient.setToken({
      access_token: tokenRecord.accessToken,
      refresh_token: tokenRecord.refreshToken,
      token_type: 'bearer',
      expires_in: 3600,
    })

    const realmId = tokenRecord.realmId

    // Get 3 draft orders to convert to invoices with current date
    const { isNull, or } = await import('drizzle-orm')
    const ordersToInvoice = await db
      .select()
      .from(orders)
      .where(or(eq(orders.qboDocType, 'draft'), isNull(orders.qboDocType)))
      .limit(3)

    console.log(`Found ${ordersToInvoice.length} orders to convert to invoices`)

    for (const order of ordersToInvoice) {
      console.log(`\nProcessing order: ${order.orderNo}`)

      // Get seller and buyer
      const [seller] = await db.select().from(accounts).where(eq(accounts.id, order.sellerId))
      const [buyer] = await db.select().from(accounts).where(eq(accounts.id, order.buyerId))

      if (!seller || !buyer) {
        console.log(`Skipping ${order.orderNo} - missing seller or buyer`)
        continue
      }

      // Find or create customer in QBO for buyer
      let customerId = buyer.qboCustomerId

      if (!customerId) {
        console.log(`Creating QB customer for: ${buyer.name}`)
        const customerResponse = await fetch(
          `https://sandbox-quickbooks.api.intuit.com/v3/company/${realmId}/customer`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${oauthClient.getToken().access_token}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: JSON.stringify({
              DisplayName: buyer.name,
              CompanyName: buyer.name,
            }),
          }
        )

        if (!customerResponse.ok) {
          console.error(`Failed to create customer: ${await customerResponse.text()}`)
          continue
        }

        const customerData = await customerResponse.json()
        customerId = customerData.Customer.Id

        // Update buyer with QBO customer ID
        await db.update(accounts).set({ qboCustomerId: customerId }).where(eq(accounts.id, buyer.id))
        console.log(`Created QB customer with ID: ${customerId}`)
      }

      // Create invoice with TODAY'S DATE
      const today = new Date().toISOString().split('T')[0]

      const invoicePayload = {
        CustomerRef: {
          value: customerId,
        },
        TxnDate: today, // TODAY'S DATE
        Line: [
          {
            Amount: parseFloat(order.totalAmount),
            DetailType: 'SalesItemLineDetail',
            SalesItemLineDetail: {
              ItemRef: {
                value: '1', // Services item
              },
              Qty: 1,
              UnitPrice: parseFloat(order.totalAmount),
            },
            Description: `Order ${order.orderNo} - ${seller.name}`,
          },
        ],
        PrivateNote: `Order: ${order.orderNo} | Seller: ${seller.name} | Buyer: ${buyer.name}`,
      }

      console.log(`Creating invoice for ${buyer.name} with date ${today}...`)

      const invoiceResponse = await fetch(
        `https://sandbox-quickbooks.api.intuit.com/v3/company/${realmId}/invoice`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${oauthClient.getToken().access_token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify(invoicePayload),
        }
      )

      if (!invoiceResponse.ok) {
        const errorText = await invoiceResponse.text()
        console.error(`Failed to create invoice: ${errorText}`)
        continue
      }

      const invoiceData = await invoiceResponse.json()
      const qboInvoice = invoiceData.Invoice

      console.log(`✅ Created QB Invoice #${qboInvoice.DocNumber} with date ${today}`)

      // Update order in database
      await db
        .update(orders)
        .set({
          qboDocType: 'invoice',
          qboDocId: qboInvoice.Id,
          qboDocNumber: qboInvoice.DocNumber,
          status: 'posted_to_qb',
        })
        .where(eq(orders.id, order.id))

      console.log(`Updated order ${order.orderNo} in database`)
    }

    console.log('\n✅ Successfully created current-dated invoices!')
    process.exit(0)
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

createCurrentInvoices()
