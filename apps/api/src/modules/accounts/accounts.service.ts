import { AppError } from '../../middleware/error-handler'
import { logger } from '../../utils/logger'
import { db } from '../../db'
import { accounts, addresses, contacts } from '../../db/schema'
import { eq, or, ilike, sql, inArray } from 'drizzle-orm'

export class AccountsService {
  // Generate account code from name
  private generateAccountCode(name: string): string {
    const prefix = name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 4)
    const timestamp = Date.now().toString().slice(-4)
    return `${prefix}-${timestamp}`
  }

  // Create account
  async createAccount(data: any) {
    const code = data.code || this.generateAccountCode(data.name)

    // Check if code already exists
    const existing = await db.select().from(accounts).where(eq(accounts.code, code)).limit(1)
    if (existing.length > 0) {
      throw new AppError('Account code already exists', 400)
    }

    const [newAccount] = await db.insert(accounts).values({
      name: data.name,
      code,
      active: data.active ?? true,
    }).returning()

    logger.info(`Created account: ${newAccount.id} (${newAccount.code})`)
    return newAccount
  }

  // Get account by ID with addresses and contacts
  async getAccount(id: string) {
    const [account] = await db.select().from(accounts).where(eq(accounts.id, id)).limit(1)

    if (!account) {
      throw new AppError('Account not found', 404)
    }

    // Get addresses and contacts
    const accountAddresses = await db.select().from(addresses).where(eq(addresses.accountId, id))
    const accountContacts = await db.select().from(contacts).where(eq(contacts.accountId, id))

    return {
      ...account,
      addresses: accountAddresses,
      contacts: accountContacts,
    }
  }

  // Search accounts - optimized with single query
  async searchAccounts(search?: string, limit = 50, offset = 0) {
    let query = db
      .select({
        id: accounts.id,
        code: accounts.code,
        name: accounts.name,
        qboCustomerId: accounts.qboCustomerId,
        active: accounts.active,
        createdAt: accounts.createdAt,
        updatedAt: accounts.updatedAt,
      })
      .from(accounts)
      .orderBy(accounts.name)

    if (search) {
      const searchPattern = `%${search}%`
      query = query.where(
        or(
          ilike(accounts.name, searchPattern),
          ilike(accounts.code, searchPattern)
        )
      ) as any
    }

    const results = await query.limit(limit).offset(offset)

    if (results.length === 0) {
      return []
    }

    // Get all IDs for this batch
    const accountIds = results.map(a => a.id)

    // Fetch ALL addresses and contacts in 2 queries instead of N queries
    const [allAddresses, allContacts] = await Promise.all([
      db.select().from(addresses).where(inArray(addresses.accountId, accountIds)),
      db.select().from(contacts).where(inArray(contacts.accountId, accountIds))
    ])

    // Group by account ID
    const addressesByAccount = new Map<string, typeof allAddresses>()
    const contactsByAccount = new Map<string, typeof allContacts>()

    allAddresses.forEach(addr => {
      if (!addressesByAccount.has(addr.accountId)) {
        addressesByAccount.set(addr.accountId, [])
      }
      addressesByAccount.get(addr.accountId)!.push(addr)
    })

    allContacts.forEach(contact => {
      if (!contactsByAccount.has(contact.accountId)) {
        contactsByAccount.set(contact.accountId, [])
      }
      contactsByAccount.get(contact.accountId)!.push(contact)
    })

    // Combine results
    return results.map(account => ({
      ...account,
      addresses: addressesByAccount.get(account.id) || [],
      contacts: contactsByAccount.get(account.id) || [],
    }))
  }

  // Update account
  async updateAccount(
    id: string,
    data: {
      name?: string
      active?: boolean
    }
  ) {
    const [account] = await db.select().from(accounts).where(eq(accounts.id, id)).limit(1)

    if (!account) {
      throw new AppError('Account not found', 404)
    }

    const [updatedAccount] = await db
      .update(accounts)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(accounts.id, id))
      .returning()

    logger.info(`Updated account: ${id}`)
    return updatedAccount
  }

  // Link account to QBO customer
  async linkQboCustomer(id: string, qboCustomerId: string) {
    const [account] = await db.select().from(accounts).where(eq(accounts.id, id)).limit(1)

    if (!account) {
      throw new AppError('Account not found', 404)
    }

    const [updatedAccount] = await db
      .update(accounts)
      .set({
        qboCustomerId,
        updatedAt: new Date(),
      })
      .where(eq(accounts.id, id))
      .returning()

    logger.info(`Linked account ${id} to QBO customer ${qboCustomerId}`)
    return updatedAccount
  }

  // Add address to account
  async addAddress(accountId: string, data: any) {
    const [account] = await db.select().from(accounts).where(eq(accounts.id, accountId)).limit(1)

    if (!account) {
      throw new AppError('Account not found', 404)
    }

    // If this is marked as primary, unset other primary addresses of the same type
    if (data.isPrimary) {
      await db
        .update(addresses)
        .set({ isPrimary: false })
        .where(
          sql`${addresses.accountId} = ${accountId} AND ${addresses.type} = ${data.type}`
        )
    }

    const [newAddress] = await db.insert(addresses).values({
      accountId,
      type: data.type,
      line1: data.line1,
      line2: data.line2,
      city: data.city,
      state: data.state,
      postalCode: data.postalCode,
      country: data.country || 'USA',
      isPrimary: data.isPrimary ?? false,
    }).returning()

    logger.info(`Added address to account ${accountId}`)
    return newAddress
  }

  // Add contact to account
  async addContact(accountId: string, data: any) {
    const [account] = await db.select().from(accounts).where(eq(accounts.id, accountId)).limit(1)

    if (!account) {
      throw new AppError('Account not found', 404)
    }

    // If this is marked as primary, unset other primary contacts
    if (data.isPrimary) {
      await db
        .update(contacts)
        .set({ isPrimary: false })
        .where(eq(contacts.accountId, accountId))
    }

    const [newContact] = await db.insert(contacts).values({
      accountId,
      name: data.name,
      email: data.email,
      phone: data.phone,
      isPrimary: data.isPrimary ?? false,
    }).returning()

    logger.info(`Added contact to account ${accountId}`)
    return newContact
  }

  // Get account addresses
  async getAddresses(accountId: string) {
    const [account] = await db.select().from(accounts).where(eq(accounts.id, accountId)).limit(1)
    if (!account) {
      throw new AppError('Account not found', 404)
    }
    return await db.select().from(addresses).where(eq(addresses.accountId, accountId))
  }

  // Get account contacts
  async getContacts(accountId: string) {
    const [account] = await db.select().from(accounts).where(eq(accounts.id, accountId)).limit(1)
    if (!account) {
      throw new AppError('Account not found', 404)
    }
    return await db.select().from(contacts).where(eq(contacts.accountId, accountId))
  }

  // Update address
  async updateAddress(addressId: string, data: any) {
    const [address] = await db.select().from(addresses).where(eq(addresses.id, addressId)).limit(1)
    if (!address) {
      throw new AppError('Address not found', 404)
    }

    // If setting as primary, unset other primary addresses of the same type
    if (data.isPrimary) {
      await db
        .update(addresses)
        .set({ isPrimary: false })
        .where(
          sql`${addresses.accountId} = ${address.accountId} AND ${addresses.type} = ${data.type || address.type} AND ${addresses.id} != ${addressId}`
        )
    }

    const [updatedAddress] = await db
      .update(addresses)
      .set({
        type: data.type,
        line1: data.line1,
        line2: data.line2,
        city: data.city,
        state: data.state,
        postalCode: data.postalCode,
        country: data.country,
        isPrimary: data.isPrimary,
      })
      .where(eq(addresses.id, addressId))
      .returning()

    logger.info(`Updated address ${addressId}`)
    return updatedAddress
  }

  // Delete address
  async deleteAddress(addressId: string) {
    const [address] = await db.select().from(addresses).where(eq(addresses.id, addressId)).limit(1)
    if (!address) {
      throw new AppError('Address not found', 404)
    }

    await db.delete(addresses).where(eq(addresses.id, addressId))
    logger.info(`Deleted address ${addressId}`)
    return { success: true }
  }

  // Update contact
  async updateContact(contactId: string, data: any) {
    const [contact] = await db.select().from(contacts).where(eq(contacts.id, contactId)).limit(1)
    if (!contact) {
      throw new AppError('Contact not found', 404)
    }

    // If setting as primary, unset other primary contacts
    if (data.isPrimary) {
      await db
        .update(contacts)
        .set({ isPrimary: false })
        .where(
          sql`${contacts.accountId} = ${contact.accountId} AND ${contacts.id} != ${contactId}`
        )
    }

    const [updatedContact] = await db
      .update(contacts)
      .set({
        name: data.name,
        email: data.email,
        phone: data.phone,
        isPrimary: data.isPrimary,
      })
      .where(eq(contacts.id, contactId))
      .returning()

    logger.info(`Updated contact ${contactId}`)
    return updatedContact
  }

  // Delete contact
  async deleteContact(contactId: string) {
    const [contact] = await db.select().from(contacts).where(eq(contacts.id, contactId)).limit(1)
    if (!contact) {
      throw new AppError('Contact not found', 404)
    }

    await db.delete(contacts).where(eq(contacts.id, contactId))
    logger.info(`Deleted contact ${contactId}`)
    return { success: true }
  }
}

