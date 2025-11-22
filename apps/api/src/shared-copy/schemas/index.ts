import { z } from 'zod'

// Re-export auth schemas
export * from './auth'

export const userRoleSchema = z.enum(['admin', 'manager', 'agent', 'readonly'])

export const orderStatusSchema = z.enum(['draft', 'confirmed', 'posted_to_qb', 'paid'])

export const addressTypeSchema = z.enum(['billing', 'shipping', 'warehouse', 'pickup'])

export const qboDocTypeSchema = z.enum(['estimate', 'invoice'])

export const pdfTypeSchema = z.enum(['seller', 'buyer'])

// Account schemas
export const createAccountSchema = z.object({
  name: z.string().min(1),
  code: z.string().optional(),
  active: z.boolean().default(true),
  contacts: z.array(z.object({
    name: z.string(),
    email: z.string().email(),
    phone: z.string().optional(),
    isPrimary: z.boolean().default(false),
  })).optional(),
  addresses: z.array(z.object({
    type: addressTypeSchema,
    line1: z.string().min(1),
    line2: z.string().optional(),
    city: z.string().min(1),
    state: z.string().min(2).max(2),
    postalCode: z.string().min(1),
    country: z.string().default('US'),
    isPrimary: z.boolean().default(false),
  })).optional(),
})

export const updateAccountSchema = createAccountSchema.partial()

// Address schemas
export const createAddressSchema = z.object({
  accountId: z.string().uuid(),
  type: addressTypeSchema,
  line1: z.string().min(1),
  line2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(2).max(2),
  postalCode: z.string().min(1),
  country: z.string().default('US'),
  isPrimary: z.boolean().default(false),
})

// Contact schemas
export const createContactSchema = z.object({
  accountId: z.string().uuid(),
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  isPrimary: z.boolean().default(false),
})

// Product schemas
export const createProductSchema = z.object({
  code: z.string().optional(),
  name: z.string().min(1),
  variety: z.string().optional(),
  grade: z.string().optional(),
  category: z.string().optional(),
  defaultUnitSize: z.number().positive().optional(),
  uom: z.string().optional(), // Now optional - use variants instead
  qboItemId: z.string().optional(),
  active: z.boolean().default(true),
})

export const updateProductSchema = z.object({
  code: z.string().optional(),
  name: z.string().min(1).optional(),
  variety: z.string().optional(),
  grade: z.string().optional(),
  category: z.string().optional(),
  defaultUnitSize: z.number().positive().optional(),
  uom: z.string().optional(),
  active: z.boolean().optional(),
})

// Product variant schemas
export const packageTypeSchema = z.enum(['bag', 'box', 'case', 'pallet', 'bulk', 'each'])

export const sizeUnitSchema = z.enum(['lb', 'kg', 'oz', 'g', 'ton'])

export const createVariantSchema = z.object({
  productId: z.string().uuid(),
  sku: z.string().optional(),
  size: z.number().positive(),
  sizeUnit: sizeUnitSchema,
  packageType: packageTypeSchema,
  isDefault: z.boolean().default(false),
  active: z.boolean().default(true),
})

export const updateVariantSchema = z.object({
  sku: z.string().optional(),
  size: z.number().positive().optional(),
  sizeUnit: sizeUnitSchema.optional(),
  packageType: packageTypeSchema.optional(),
  isDefault: z.boolean().optional(),
  active: z.boolean().optional(),
})

// Order line schemas
export const createOrderLineSchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid().optional(), // Optional: if product has variants
  packageType: z.string().optional(), // Optional: bag, box, case, pallet, bulk, each
  sizeGrade: z.string().optional(),
  quantity: z.number().positive(),
  unitSize: z.number().positive(),
  uom: z.string().min(1),
  totalWeight: z.number().positive(),
  unitPrice: z.number().nonnegative(),
  commissionPct: z.number().min(0).max(100).optional(),
  commissionAmt: z.number().nonnegative().optional(),
})

// Order schemas
export const createOrderSchema = z.object({
  sellerId: z.string().uuid(),
  buyerId: z.string().uuid(),
  contractNo: z.string().optional(),
  terms: z.string().optional(),
  notes: z.string().optional(),
  lines: z.array(createOrderLineSchema).min(1),
})

export const updateOrderSchema = z.object({
  sellerId: z.string().uuid().optional(),
  buyerId: z.string().uuid().optional(),
  agentId: z.string().uuid().optional(),
  brokerId: z.string().uuid().optional(),
  contractNo: z.string().optional(),
  poNumber: z.string().optional(),
  terms: z.string().optional(),
  notes: z.string().optional(),
  status: orderStatusSchema.optional(),
  lines: z.array(createOrderLineSchema).optional(),
})

// Report filters
export const commissionReportFilters = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  agentId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
  productId: z.string().uuid().optional(),
})

export const customerHistoryFilters = z.object({
  customerId: z.string().uuid(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  productId: z.string().uuid().optional(),
})
