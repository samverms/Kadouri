import { AppError } from '../../middleware/error-handler'
import { logger } from '../../utils/logger'

// Mock data store
const mockAccounts: any[] = [
  {
    id: '1',
    code: 'ANC001',
    name: 'ANC001',
    active: true,
    createdAt: '2025-01-15',
    addresses: [
      {
        id: '1',
        type: 'mailing',
        line1: 'P.O. Box 1117',
        city: 'Hollister',
        state: 'CA',
        postalCode: '95024',
        isPrimary: false,
        accountId: '1',
      },
    ],
    contacts: [
      {
        id: '1',
        name: 'Michel Steen',
        email: 'petite@unemail.com',
        isPrimary: false,
        accountId: '1',
      },
      {
        id: '2',
        name: 'Another Contact',
        email: 'contact@email.com',
        isPrimary: false,
        accountId: '1',
      },
    ],
  },
  {
    id: '2',
    code: 'CEN001',
    name: 'C&G ENTERPRISES',
    active: true,
    createdAt: '2025-01-18',
    addresses: [
      {
        id: '3',
        type: 'mailing',
        line1: '123 Business St',
        city: 'Sacramento',
        state: 'CA',
        postalCode: '95814',
        isPrimary: true,
        accountId: '2',
      },
    ],
    contacts: [
      {
        id: '3',
        name: 'Steve',
        email: 'Steve@clovernominal.com',
        isPrimary: true,
        accountId: '2',
      },
    ],
  },
  {
    id: '3',
    code: 'FAM001',
    name: 'FAMOSO NUT COMPANY',
    active: true,
    createdAt: '2025-01-20',
    addresses: [],
    contacts: [
      {
        id: '4',
        name: 'Wendi Haggard',
        email: 'wendi@famoso.com',
        isPrimary: true,
        accountId: '3',
      },
    ],
  },
  {
    id: '4',
    code: 'GNC001',
    name: 'Guerra Nut Shelling',
    active: true,
    createdAt: '2025-01-21',
    addresses: [
      {
        id: '4',
        type: 'Mailing',
        line1: 'P.O. Box 1117',
        city: 'Hollister',
        state: 'CA',
        postalCode: '95024',
        isPrimary: false,
        accountId: '4',
      },
      {
        id: '5',
        type: 'Physical',
        line1: '190 Hillcrest Rd.',
        city: 'Hollister',
        state: 'CA',
        postalCode: '95024',
        isPrimary: false,
        accountId: '4',
      },
    ],
    contacts: [
      {
        id: '5',
        name: 'Jeff Guerra',
        email: 'Jeff@guerranut.com',
        phone: '831-637-4471',
        isPrimary: true,
        accountId: '4',
      },
    ],
  },
]

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
    const existing = mockAccounts.find((acc) => acc.code === code)
    if (existing) {
      throw new AppError('Account code already exists', 400)
    }

    const newAccount = {
      id: (mockAccounts.length + 1).toString(),
      name: data.name,
      code,
      active: data.active ?? true,
      createdAt: new Date().toISOString(),
      addresses: data.addresses || [],
      contacts: data.contacts || [],
    }

    mockAccounts.push(newAccount)
    logger.info(`Created account: ${newAccount.id} (${newAccount.code})`)
    return newAccount
  }

  // Get account by ID with addresses and contacts
  async getAccount(id: string) {
    const account = mockAccounts.find((acc) => acc.id === id)

    if (!account) {
      throw new AppError('Account not found', 404)
    }

    return account
  }

  // Search accounts
  async searchAccounts(search?: string, limit = 50) {
    let results = mockAccounts

    if (search) {
      const searchLower = search.toLowerCase()
      results = mockAccounts.filter(
        (acc) =>
          acc.name.toLowerCase().includes(searchLower) ||
          acc.code.toLowerCase().includes(searchLower)
      )
    }

    return results.slice(0, limit)
  }

  // Update account
  async updateAccount(
    id: string,
    data: {
      name?: string
      active?: boolean
    }
  ) {
    const accountIndex = mockAccounts.findIndex((acc) => acc.id === id)

    if (accountIndex === -1) {
      throw new AppError('Account not found', 404)
    }

    mockAccounts[accountIndex] = {
      ...mockAccounts[accountIndex],
      ...data,
      updatedAt: new Date().toISOString(),
    }

    logger.info(`Updated account: ${id}`)
    return mockAccounts[accountIndex]
  }

  // Link account to QBO customer
  async linkQboCustomer(id: string, qboCustomerId: string) {
    const accountIndex = mockAccounts.findIndex((acc) => acc.id === id)

    if (accountIndex === -1) {
      throw new AppError('Account not found', 404)
    }

    mockAccounts[accountIndex] = {
      ...mockAccounts[accountIndex],
      qboCustomerId,
      updatedAt: new Date().toISOString(),
    }

    logger.info(`Linked account ${id} to QBO customer ${qboCustomerId}`)
    return mockAccounts[accountIndex]
  }

  // Add address to account
  async addAddress(accountId: string, data: any) {
    const account = mockAccounts.find((acc) => acc.id === accountId)

    if (!account) {
      throw new AppError('Account not found', 404)
    }

    // If this is marked as primary, unset other primary addresses of the same type
    if (data.isPrimary) {
      account.addresses.forEach((addr: any) => {
        if (addr.type === data.type) {
          addr.isPrimary = false
        }
      })
    }

    const newAddress = {
      id: Date.now().toString(),
      accountId,
      ...data,
    }

    account.addresses.push(newAddress)
    logger.info(`Added address to account ${accountId}`)
    return newAddress
  }

  // Add contact to account
  async addContact(accountId: string, data: any) {
    const account = mockAccounts.find((acc) => acc.id === accountId)

    if (!account) {
      throw new AppError('Account not found', 404)
    }

    // If this is marked as primary, unset other primary contacts
    if (data.isPrimary) {
      account.contacts.forEach((contact: any) => {
        contact.isPrimary = false
      })
    }

    const newContact = {
      id: Date.now().toString(),
      accountId,
      ...data,
    }

    account.contacts.push(newContact)
    logger.info(`Added contact to account ${accountId}`)
    return newContact
  }

  // Get account addresses
  async getAddresses(accountId: string) {
    const account = mockAccounts.find((acc) => acc.id === accountId)
    if (!account) {
      throw new AppError('Account not found', 404)
    }
    return account.addresses || []
  }

  // Get account contacts
  async getContacts(accountId: string) {
    const account = mockAccounts.find((acc) => acc.id === accountId)
    if (!account) {
      throw new AppError('Account not found', 404)
    }
    return account.contacts || []
  }
}
