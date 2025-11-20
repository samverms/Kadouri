// Re-export auth types
export * from './auth'

export type UserRole = 'admin' | 'manager' | 'agent' | 'readonly'

export type OrderStatus = 'draft' | 'confirmed' | 'posted_to_qb' | 'paid'

export type AddressType = 'billing' | 'shipping' | 'warehouse' | 'pickup'

export type QBODocType = 'estimate' | 'invoice'

export type PDFType = 'seller' | 'buyer'

export interface Account {
  id: string
  code: string
  name: string
  qboCustomerId?: string
  active: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Address {
  id: string
  accountId: string
  type: AddressType
  line1: string
  line2?: string
  city: string
  state: string
  postalCode: string
  country: string
  isPrimary: boolean
}

export interface Contact {
  id: string
  accountId: string
  name: string
  email: string
  phone?: string
  isPrimary: boolean
}

export interface Product {
  id: string
  name: string
  variety?: string
  grade?: string
  defaultUnitSize?: number
  uom: string
  qboItemId?: string
  active: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Order {
  id: string
  orderNo: string
  sellerId: string
  buyerId: string
  status: OrderStatus
  contractNo?: string
  qboDocType?: QBODocType
  qboDocId?: string
  subtotal: number
  commissionTotal: number
  totalAmount: number
  terms?: string
  notes?: string
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

export interface OrderLine {
  id: string
  orderId: string
  lineNo: number
  productId: string
  sizeGrade?: string
  quantity: number
  unitSize: number
  uom: string
  totalWeight: number
  unitPrice: number
  commissionPct?: number
  commissionAmt?: number
  lineTotal: number
}

export interface PDF {
  id: string
  orderId: string
  type: PDFType
  url: string
  version: number
  createdAt: Date
}

export interface Agent {
  id: string
  name: string
  companyName?: string
  email?: string
  phone?: string
  addressLine1?: string
  addressLine2?: string
  city?: string
  state?: string
  postalCode?: string
  country?: string
  active: boolean
  createdBy?: string
  createdAt: Date
  updatedAt: Date
}

export interface Broker {
  id: string
  name: string
  companyName?: string
  email?: string
  phone?: string
  addressLine1?: string
  addressLine2?: string
  city?: string
  state?: string
  postalCode?: string
  country?: string
  active: boolean
  createdBy?: string
  createdAt: Date
  updatedAt: Date
}
