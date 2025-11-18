---
sidebar_position: 1
---

# Products Module

The Products module manages the product catalog with support for multiple variants (sizes, packaging types) per product. This feature allows for flexible product management in agricultural/produce sales.

## Overview

The products system consists of:
- **Products**: Base product entities (e.g., "Almonds")
- **Product Variants**: Size/packaging combinations (e.g., "10 lb bag", "25 lb box")
- **Categories**: Product categorization (Almonds, Walnuts, Raisins, etc.)

## Database Schema

### Products Table

Located at: `apps/api/src/db/schema/products.ts`

```typescript
export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: varchar('code', { length: 50 }), // Item number like K1001, K1002
  name: varchar('name', { length: 255 }).notNull(),
  variety: varchar('variety', { length: 255 }), // e.g., "Nonpareil", "Organic"
  grade: varchar('grade', { length: 100 }), // e.g., "Premium", "A", "Standard"
  category: varchar('category', { length: 100 }), // Product category
  defaultUnitSize: numeric('default_unit_size', { precision: 10, scale: 2 }),
  uom: varchar('uom', { length: 50 }), // DEPRECATED - use variants instead
  qboItemId: varchar('qbo_item_id', { length: 50 }), // QuickBooks item ID
  active: boolean('active').notNull().default(true),
  source: varchar('source', { length: 50 }).notNull().default('manual'),
  archivedAt: timestamp('archived_at'),
  archivedBy: varchar('archived_by', { length: 100 }), // Clerk user ID
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  updatedBy: varchar('updated_by', { length: 100 }), // Clerk user ID
})
```

### Product Variants Table

Located at: `apps/api/src/db/schema/product-variants.ts`

```typescript
export const productVariants = pgTable('product_variants', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  sku: varchar('sku', { length: 100 }), // Optional SKU for this variant
  size: numeric('size', { precision: 10, scale: 2 }).notNull(), // e.g., 10, 25, 50
  sizeUnit: varchar('size_unit', { length: 20 }).notNull(), // e.g., "lb", "oz", "kg"
  packageType: varchar('package_type', { length: 50 }).notNull(), // e.g., "bag", "box", "case"
  isDefault: boolean('is_default').notNull().default(false), // Default variant for display
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})
```

**Key Relationships:**
- One product can have multiple variants
- Variants are cascade deleted when parent product is deleted
- One variant per product should be marked as `isDefault: true`

## Backend Implementation

### Service Layer

Located at: `apps/api/src/modules/products/products.service.ts`

#### Key Methods

**createProduct()**
```typescript
async createProduct(data: {
  code?: string
  name: string
  variety?: string
  grade?: string
  category?: string
  defaultUnitSize?: number
  uom?: string
  qboItemId?: string
  active?: boolean
})
```
- Creates a new product with basic information
- Sets `source: 'manual'` for user-created products
- Returns the created product object

**getProduct(id: string)**
```typescript
async getProduct(id: string)
```
- Fetches product by ID
- Automatically includes all variants
- Throws `AppError` (404) if not found

**searchProducts()**
```typescript
async searchProducts(search?: string, limit = 10000, includeInactive = false)
```
- Searches products by code, name, variety, or grade
- Filters active products by default (unless `includeInactive = true`)
- Returns products with variants included
- Uses case-insensitive pattern matching (ILIKE)

**updateProduct()**
```typescript
async updateProduct(
  id: string,
  data: { code?, name?, variety?, grade?, category?, active?, ... },
  updatedBy?: string
)
```
- Updates product fields
- Tracks `updatedAt` timestamp and `updatedBy` user ID
- Returns updated product

### Product Variants Service

Located at: `apps/api/src/modules/products/product-variants.service.ts`

**createVariant()**
```typescript
async createVariant(data: {
  productId: string
  sku?: string
  size: number
  sizeUnit: string
  packageType: string
  isDefault?: boolean
  active?: boolean
})
```
- Creates a new variant for a product
- If `isDefault: true`, automatically unsets previous default variant
- Validates that product exists

**updateVariant()**
```typescript
async updateVariant(id: string, data: {...})
```
- Updates variant fields
- Handles default variant switching logic

**deleteVariant()**
```typescript
async deleteVariant(id: string)
```
- Soft delete by setting `active: false`
- Prevents deletion of the last active variant

### API Routes

Located at: `apps/api/src/routes/index.ts`

All routes require authentication via Clerk middleware.

#### Product Endpoints

```
GET    /api/products              # Search/list products
POST   /api/products              # Create product
GET    /api/products/:id          # Get product details (with variants)
PUT    /api/products/:id          # Update product
DELETE /api/products/:id          # Delete (soft) product
POST   /api/products/:id/qbo      # Link to QuickBooks item
```

#### Variant Endpoints

```
POST   /api/products/:productId/variants           # Create variant
PUT    /api/products/:productId/variants/:id       # Update variant
DELETE /api/products/:productId/variants/:id       # Delete variant
```

### Validation Schemas

Located at: `packages/shared/src/schemas/index.ts`

```typescript
export const createProductSchema = z.object({
  code: z.string().optional(),
  name: z.string().min(1),
  variety: z.string().optional(),
  grade: z.string().optional(),
  category: z.string().optional(),
  defaultUnitSize: z.number().positive().optional(),
  uom: z.string().optional(),
  qboItemId: z.string().optional(),
  active: z.boolean().default(true),
})

export const createProductVariantSchema = z.object({
  productId: z.string().uuid(),
  sku: z.string().optional(),
  size: z.number().positive(),
  sizeUnit: z.string().min(1),
  packageType: z.string().min(1),
  isDefault: z.boolean().default(false),
  active: z.boolean().default(true),
})
```

## Frontend Implementation

### Product List Page

**Location:** `apps/web/src/app/(dashboard)/products/page.tsx`

**Features:**
- Search by product code, name, variety, or grade
- Sort by any column (name, variety, grade, category, date)
- Filter by active/inactive status
- Column visibility controls
- Expandable rows showing product variants
- Date range filtering
- Category filtering

**Key UI Elements:**
```typescript
// Default variant display
const getDefaultVariant = (product: Product) => {
  if (!product.variants || product.variants.length === 0) return '-'
  const defaultVariant = product.variants.find(v => v.isDefault)
  if (!defaultVariant) return product.variants[0] ?
    `${product.variants[0].size} ${product.variants[0].sizeUnit} ${product.variants[0].packageType}` : '-'
  return `${defaultVariant.size} ${defaultVariant.sizeUnit} ${defaultVariant.packageType}`
}
```

**Category Options:**
- Almonds, Walnuts, Pecans, Pistachios, Cashews, Hazelnuts
- Macadamias, Brazil Nuts, Pine Nuts
- Raisins, Dates, Figs, Prunes, Apricots, Cranberries, Cherries
- Pumpkin Seeds, Sunflower Seeds, Chia Seeds, Flax Seeds, Sesame Seeds
- Apples, Oranges, Grapes, Berries
- Other

### Product Detail Page

**Location:** `apps/web/src/app/(dashboard)/products/[id]/page.tsx`

Displays read-only product information including:
- Product code, name, variety, grade, category
- Active status badge
- All variants with default indicator
- Metadata (Created, Updated, Updated By)

### Product Edit Page

**Location:** `apps/web/src/app/(dashboard)/products/[id]/edit/page.tsx`

**Features:**
- Edit product basic information (2-column compact layout)
- Category dropdown selection
- Manage variants:
  - Add new variants
  - Edit existing variants
  - Delete variants (with confirmation)
  - Set default variant
- Active/inactive toggle

**Variant Management:**
```typescript
// Add variant
const handleAddVariant = async () => {
  const response = await fetch(
    `http://localhost:2000/api/products/${productId}/variants`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(newVariant),
    }
  )
}

// Update variant
const handleUpdateVariant = async (variantId: string, data: any) => {
  const response = await fetch(
    `http://localhost:2000/api/products/${productId}/variants/${variantId}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    }
  )
}
```

### Product Creation Page

**Location:** `apps/web/src/app/(dashboard)/products/new/page.tsx`

**Features:**
- Clean 2-column form layout matching edit page
- Fields: Product Code (optional), Name (required), Variety, Grade, Category, Active
- Category dropdown with predefined options
- After creation, redirects to edit page for adding variants

**Workflow:**
1. User clicks "New Product" on products list
2. Fills in basic product information
3. Clicks "Create Product"
4. Automatically redirected to `/products/{id}/edit`
5. User can immediately add variants on the edit page

## Important Notes

### UOM Deprecation

The `uom` (Unit of Measure) field at the product level is **deprecated**. With the variants system, each variant has its own `sizeUnit`, making the product-level UOM redundant.

- UOM column is nullable in the database
- UOM is hidden by default in the products list
- No default value is set for new products
- Use variant `sizeUnit` instead

### Default Variant Logic

- Each product should have exactly one variant with `isDefault: true`
- When setting a new default variant, the backend automatically clears the previous default
- Default variant is displayed in the products list for quick reference
- If no default is set, the first variant is used for display purposes

### Soft Delete Pattern

Products use soft delete:
- `DELETE` endpoint sets `active: false` instead of removing the record
- Archived products track `archivedAt` timestamp and `archivedBy` user ID
- By default, searches only return active products
- Use `includeInactive: true` parameter to include archived products

## QuickBooks Integration

Products can be synced to QuickBooks Online as "Service" items:

```typescript
// Link existing product to QBO item
POST /api/products/:id/qbo
{
  "qboItemId": "123"
}

// Sync creates/updates QBO item
const qboSync = new QuickBooksSync()
await qboSync.syncProductToItem(productId)
```

The `qboItemId` field stores the QuickBooks item ID for bidirectional sync.

## Common Patterns

### Fetching Products with Variants

```typescript
// Frontend
const { data: products } = useQuery({
  queryKey: ['products', searchQuery],
  queryFn: async () => {
    const params = new URLSearchParams()
    if (searchQuery) params.append('search', searchQuery)

    const response = await fetch(
      `http://localhost:2000/api/products?${params}`,
      { credentials: 'include' }
    )
    return response.json()
  }
})
```

### Creating Product with Variants

```typescript
// 1. Create product
const productResponse = await fetch('http://localhost:2000/api/products', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    name: 'Almonds',
    variety: 'Nonpareil',
    grade: 'Premium',
    category: 'Almonds',
    active: true,
  }),
})
const product = await productResponse.json()

// 2. Add variants
const variant1 = await fetch(`http://localhost:2000/api/products/${product.id}/variants`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    size: 10,
    sizeUnit: 'lb',
    packageType: 'bag',
    isDefault: true,
  }),
})
```

## Testing

### Manual Testing Checklist

- [ ] Create new product with all fields filled
- [ ] Create product with minimal fields (only name)
- [ ] Add multiple variants to a product
- [ ] Set different variants as default
- [ ] Edit product information
- [ ] Edit variant information
- [ ] Delete variant (ensure last variant cannot be deleted)
- [ ] Search products by name, code, variety
- [ ] Filter by category
- [ ] Toggle active/inactive status
- [ ] Verify default variant displays in list
- [ ] Test navigation: list → detail → edit → list

### Edge Cases

- Creating product without variants (allowed, can add later)
- Setting multiple variants as default (backend ensures only one)
- Deleting the only variant (backend prevents this)
- Editing inactive products (allowed for admin users)
- Searching with special characters
- Very long product names or codes

## Future Enhancements

Potential improvements for the products module:
- Bulk import from CSV/Excel
- Product images/photos
- Inventory tracking by variant
- Price management by variant
- Product history/audit log
- Advanced filtering (multi-category, custom fields)
- Product templates for quick creation
- Barcode/QR code support for variants
