export const USER_ROLES = {
  ADMIN: 'admin',
  AGENT: 'agent',
  READONLY: 'readonly',
} as const

export const ORDER_STATUSES = {
  DRAFT: 'draft',
  CONFIRMED: 'confirmed',
  POSTED_TO_QB: 'posted_to_qb',
  PAID: 'paid',
} as const

export const ADDRESS_TYPES = {
  BILLING: 'billing',
  SHIPPING: 'shipping',
  WAREHOUSE: 'warehouse',
  PICKUP: 'pickup',
} as const

export const QBO_DOC_TYPES = {
  ESTIMATE: 'estimate',
  INVOICE: 'invoice',
} as const

export const PDF_TYPES = {
  SELLER: 'seller',
  BUYER: 'buyer',
} as const

export const DEFAULT_PAGE_SIZE = 50
export const MAX_PAGE_SIZE = 100
