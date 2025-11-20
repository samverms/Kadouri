---
sidebar_position: 1
---

# Products API

Complete API reference for managing products and product variants in Kadouri CRM.

## Base URL

```
http://localhost:2000/api
```

## Authentication

All endpoints require authentication via Clerk. Include credentials in requests:

```javascript
fetch(url, {
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json'
  }
})
```

## Products Endpoints

### List Products

Retrieve a list of products with optional search filtering.

**Endpoint:** `GET /products`

**Query Parameters:**

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `search` | string | Search by code, name, variety, or grade | - |
| `limit` | number | Maximum results to return | 10000 |
| `includeInactive` | boolean | Include archived products | false |

**Request Example:**

```bash
# Search for almonds
curl -X GET "http://localhost:2000/api/products?search=almonds" \
  --cookie "session_token=..." \
  -H "Content-Type: application/json"

# Include inactive products
curl -X GET "http://localhost:2000/api/products?includeInactive=true" \
  --cookie "session_token=..." \
  -H "Content-Type: application/json"
```

**Response:**

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "code": "K1001",
    "name": "Almonds",
    "variety": "Nonpareil",
    "grade": "Premium",
    "category": "Almonds",
    "active": true,
    "source": "manual",
    "qboItemId": null,
    "createdAt": "2025-01-15T10:30:00Z",
    "updatedAt": "2025-01-15T10:30:00Z",
    "updatedBy": "user_123",
    "variants": [
      {
        "id": "660e8400-e29b-41d4-a716-446655440000",
        "productId": "550e8400-e29b-41d4-a716-446655440000",
        "sku": "ALM-NP-PR-10LB",
        "size": "10",
        "sizeUnit": "lb",
        "packageType": "bag",
        "isDefault": true,
        "active": true,
        "createdAt": "2025-01-15T10:35:00Z",
        "updatedAt": "2025-01-15T10:35:00Z"
      }
    ]
  }
]
```

**Status Codes:**
- `200 OK` - Success
- `401 Unauthorized` - Not authenticated
- `500 Internal Server Error` - Server error

---

### Get Product

Retrieve a single product by ID with all variants.

**Endpoint:** `GET /products/:id`

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Product ID |

**Request Example:**

```bash
curl -X GET "http://localhost:2000/api/products/550e8400-e29b-41d4-a716-446655440000" \
  --cookie "session_token=..." \
  -H "Content-Type: application/json"
```

**Response:**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "code": "K1001",
  "name": "Almonds",
  "variety": "Nonpareil",
  "grade": "Premium",
  "category": "Almonds",
  "active": true,
  "source": "manual",
  "qboItemId": null,
  "createdAt": "2025-01-15T10:30:00Z",
  "updatedAt": "2025-01-15T10:30:00Z",
  "updatedBy": "user_123",
  "variants": [
    {
      "id": "660e8400-e29b-41d4-a716-446655440000",
      "productId": "550e8400-e29b-41d4-a716-446655440000",
      "sku": "ALM-NP-PR-10LB",
      "size": "10",
      "sizeUnit": "lb",
      "packageType": "bag",
      "isDefault": true,
      "active": true,
      "createdAt": "2025-01-15T10:35:00Z",
      "updatedAt": "2025-01-15T10:35:00Z"
    }
  ]
}
```

**Status Codes:**
- `200 OK` - Success
- `404 Not Found` - Product not found
- `401 Unauthorized` - Not authenticated
- `500 Internal Server Error` - Server error

---

### Create Product

Create a new product.

**Endpoint:** `POST /products`

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Product name |
| `code` | string | No | Product code/item number |
| `variety` | string | No | Product variety |
| `grade` | string | No | Product grade |
| `category` | string | No | Product category |
| `defaultUnitSize` | number | No | Default unit size (deprecated) |
| `uom` | string | No | Unit of measure (deprecated) |
| `qboItemId` | string | No | QuickBooks item ID |
| `active` | boolean | No | Active status (default: true) |

**Request Example:**

```bash
curl -X POST "http://localhost:2000/api/products" \
  --cookie "session_token=..." \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Almonds",
    "code": "K1001",
    "variety": "Nonpareil",
    "grade": "Premium",
    "category": "Almonds",
    "active": true
  }'
```

**JavaScript Example:**

```javascript
const response = await fetch('http://localhost:2000/api/products', {
  method: 'POST',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'Almonds',
    code: 'K1001',
    variety: 'Nonpareil',
    grade: 'Premium',
    category: 'Almonds',
    active: true,
  }),
})

const product = await response.json()
```

**Response:**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "code": "K1001",
  "name": "Almonds",
  "variety": "Nonpareil",
  "grade": "Premium",
  "category": "Almonds",
  "active": true,
  "source": "manual",
  "qboItemId": null,
  "createdAt": "2025-01-15T10:30:00Z",
  "updatedAt": "2025-01-15T10:30:00Z",
  "updatedBy": null
}
```

**Status Codes:**
- `201 Created` - Product created successfully
- `400 Bad Request` - Invalid request body
- `401 Unauthorized` - Not authenticated
- `500 Internal Server Error` - Server error

---

### Update Product

Update an existing product.

**Endpoint:** `PUT /products/:id`

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Product ID |

**Request Body:**

All fields are optional. Only include fields you want to update.

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Product name |
| `code` | string | Product code/item number |
| `variety` | string | Product variety |
| `grade` | string | Product grade |
| `category` | string | Product category |
| `active` | boolean | Active status |

**Request Example:**

```bash
curl -X PUT "http://localhost:2000/api/products/550e8400-e29b-41d4-a716-446655440000" \
  --cookie "session_token=..." \
  -H "Content-Type: application/json" \
  -d '{
    "grade": "Select",
    "category": "Almonds"
  }'
```

**Response:**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "code": "K1001",
  "name": "Almonds",
  "variety": "Nonpareil",
  "grade": "Select",
  "category": "Almonds",
  "active": true,
  "source": "manual",
  "qboItemId": null,
  "createdAt": "2025-01-15T10:30:00Z",
  "updatedAt": "2025-01-15T14:20:00Z",
  "updatedBy": "user_123"
}
```

**Status Codes:**
- `200 OK` - Product updated successfully
- `400 Bad Request` - Invalid request body
- `404 Not Found` - Product not found
- `401 Unauthorized` - Not authenticated
- `500 Internal Server Error` - Server error

---

### Delete Product (Archive)

Soft delete a product by marking it as inactive.

**Endpoint:** `DELETE /products/:id`

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Product ID |

**Request Example:**

```bash
curl -X DELETE "http://localhost:2000/api/products/550e8400-e29b-41d4-a716-446655440000" \
  --cookie "session_token=..." \
  -H "Content-Type: application/json"
```

**Response:**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "code": "K1001",
  "name": "Almonds",
  "variety": "Nonpareil",
  "grade": "Premium",
  "category": "Almonds",
  "active": false,
  "source": "manual",
  "qboItemId": null,
  "createdAt": "2025-01-15T10:30:00Z",
  "updatedAt": "2025-01-15T15:00:00Z",
  "archivedAt": "2025-01-15T15:00:00Z",
  "archivedBy": "user_123"
}
```

**Status Codes:**
- `200 OK` - Product archived successfully
- `404 Not Found` - Product not found
- `401 Unauthorized` - Not authenticated
- `500 Internal Server Error` - Server error

---

### Link to QuickBooks

Link a product to a QuickBooks item.

**Endpoint:** `POST /products/:id/qbo`

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Product ID |

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `qboItemId` | string | Yes | QuickBooks item ID |

**Request Example:**

```bash
curl -X POST "http://localhost:2000/api/products/550e8400-e29b-41d4-a716-446655440000/qbo" \
  --cookie "session_token=..." \
  -H "Content-Type: application/json" \
  -d '{
    "qboItemId": "123"
  }'
```

**Response:**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "qboItemId": "123",
  "updatedAt": "2025-01-15T15:30:00Z"
}
```

**Status Codes:**
- `200 OK` - Link created successfully
- `404 Not Found` - Product not found
- `401 Unauthorized` - Not authenticated
- `500 Internal Server Error` - Server error

---

## Product Variants Endpoints

### Create Variant

Add a new variant to a product.

**Endpoint:** `POST /products/:productId/variants`

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `productId` | UUID | Product ID |

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `size` | number | Yes | Numeric size value |
| `sizeUnit` | string | Yes | Unit of measure (lb, oz, kg, g) |
| `packageType` | string | Yes | Package type (bag, box, case, pallet) |
| `sku` | string | No | Variant SKU |
| `isDefault` | boolean | No | Set as default variant (default: false) |
| `active` | boolean | No | Active status (default: true) |

**Request Example:**

```bash
curl -X POST "http://localhost:2000/api/products/550e8400-e29b-41d4-a716-446655440000/variants" \
  --cookie "session_token=..." \
  -H "Content-Type: application/json" \
  -d '{
    "size": 25,
    "sizeUnit": "lb",
    "packageType": "bag",
    "sku": "ALM-NP-PR-25LB",
    "isDefault": false,
    "active": true
  }'
```

**JavaScript Example:**

```javascript
const response = await fetch(
  `http://localhost:2000/api/products/${productId}/variants`,
  {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      size: 25,
      sizeUnit: 'lb',
      packageType: 'bag',
      sku: 'ALM-NP-PR-25LB',
      isDefault: false,
      active: true,
    }),
  }
)

const variant = await response.json()
```

**Response:**

```json
{
  "id": "770e8400-e29b-41d4-a716-446655440000",
  "productId": "550e8400-e29b-41d4-a716-446655440000",
  "sku": "ALM-NP-PR-25LB",
  "size": "25",
  "sizeUnit": "lb",
  "packageType": "bag",
  "isDefault": false,
  "active": true,
  "createdAt": "2025-01-15T11:00:00Z",
  "updatedAt": "2025-01-15T11:00:00Z"
}
```

**Status Codes:**
- `201 Created` - Variant created successfully
- `400 Bad Request` - Invalid request body
- `404 Not Found` - Product not found
- `401 Unauthorized` - Not authenticated
- `500 Internal Server Error` - Server error

---

### Update Variant

Update an existing product variant.

**Endpoint:** `PUT /products/:productId/variants/:id`

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `productId` | UUID | Product ID |
| `id` | UUID | Variant ID |

**Request Body:**

All fields are optional. Only include fields you want to update.

| Field | Type | Description |
|-------|------|-------------|
| `size` | number | Numeric size value |
| `sizeUnit` | string | Unit of measure |
| `packageType` | string | Package type |
| `sku` | string | Variant SKU |
| `isDefault` | boolean | Set as default variant |
| `active` | boolean | Active status |

**Request Example:**

```bash
curl -X PUT "http://localhost:2000/api/products/550e8400-e29b-41d4-a716-446655440000/variants/770e8400-e29b-41d4-a716-446655440000" \
  --cookie "session_token=..." \
  -H "Content-Type: application/json" \
  -d '{
    "isDefault": true
  }'
```

**Response:**

```json
{
  "id": "770e8400-e29b-41d4-a716-446655440000",
  "productId": "550e8400-e29b-41d4-a716-446655440000",
  "sku": "ALM-NP-PR-25LB",
  "size": "25",
  "sizeUnit": "lb",
  "packageType": "bag",
  "isDefault": true,
  "active": true,
  "createdAt": "2025-01-15T11:00:00Z",
  "updatedAt": "2025-01-15T11:30:00Z"
}
```

**Status Codes:**
- `200 OK` - Variant updated successfully
- `400 Bad Request` - Invalid request body
- `404 Not Found` - Product or variant not found
- `401 Unauthorized` - Not authenticated
- `500 Internal Server Error` - Server error

---

### Delete Variant (Archive)

Soft delete a variant by marking it as inactive.

**Endpoint:** `DELETE /products/:productId/variants/:id`

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `productId` | UUID | Product ID |
| `id` | UUID | Variant ID |

**Request Example:**

```bash
curl -X DELETE "http://localhost:2000/api/products/550e8400-e29b-41d4-a716-446655440000/variants/770e8400-e29b-41d4-a716-446655440000" \
  --cookie "session_token=..." \
  -H "Content-Type: application/json"
```

**Response:**

```json
{
  "id": "770e8400-e29b-41d4-a716-446655440000",
  "productId": "550e8400-e29b-41d4-a716-446655440000",
  "sku": "ALM-NP-PR-25LB",
  "size": "25",
  "sizeUnit": "lb",
  "packageType": "bag",
  "isDefault": false,
  "active": false,
  "createdAt": "2025-01-15T11:00:00Z",
  "updatedAt": "2025-01-15T12:00:00Z"
}
```

**Status Codes:**
- `200 OK` - Variant archived successfully
- `400 Bad Request` - Cannot delete last active variant
- `404 Not Found` - Product or variant not found
- `401 Unauthorized` - Not authenticated
- `500 Internal Server Error` - Server error

:::caution
You cannot delete the last active variant of a product. The API will return a `400 Bad Request` error if you attempt to do so.
:::

---

## Complete Workflow Example

### Creating a Product with Variants

```javascript
// Step 1: Create the product
const productResponse = await fetch('http://localhost:2000/api/products', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Walnuts',
    variety: 'Light Halves',
    grade: 'Extra Fancy',
    category: 'Walnuts',
    active: true,
  }),
})
const product = await productResponse.json()

// Step 2: Add first variant (10 lb bag - default)
const variant1 = await fetch(
  `http://localhost:2000/api/products/${product.id}/variants`,
  {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      size: 10,
      sizeUnit: 'lb',
      packageType: 'bag',
      sku: 'WAL-LH-EF-10LB',
      isDefault: true,
      active: true,
    }),
  }
)

// Step 3: Add second variant (25 lb box)
const variant2 = await fetch(
  `http://localhost:2000/api/products/${product.id}/variants`,
  {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      size: 25,
      sizeUnit: 'lb',
      packageType: 'box',
      sku: 'WAL-LH-EF-25LB',
      isDefault: false,
      active: true,
    }),
  }
)

// Step 4: Fetch complete product with variants
const fullProduct = await fetch(
  `http://localhost:2000/api/products/${product.id}`,
  { credentials: 'include' }
)
const productData = await fullProduct.json()

console.log(productData)
// Output includes product with both variants
```

## Error Handling

All endpoints return standard HTTP status codes and error messages:

```json
{
  "error": "Error message",
  "message": "Detailed error description",
  "statusCode": 400
}
```

**Common Errors:**

- `400 Bad Request` - Invalid input data
- `401 Unauthorized` - Missing or invalid authentication
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server-side error

**Example Error Handling:**

```javascript
try {
  const response = await fetch('http://localhost:2000/api/products', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Almonds' }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to create product')
  }

  const product = await response.json()
  console.log('Created:', product)
} catch (error) {
  console.error('Error:', error.message)
}
```

## Rate Limiting

Currently, there are no explicit rate limits on the Products API. However, be mindful of:
- QuickBooks integration has its own rate limits (500 req/min sandbox, 1000 req/min production)
- Database connection pool limits
- General server resource constraints

## Related Endpoints

- [Accounts API](/api/accounts) - Customer and vendor management
- [Orders API](/api/orders) - Order management using products
- [Roles API](/api/roles) - Permission management

## Need Help?

For additional support:
- Review the [Developer Guide](/features/products)
- Check the [User Guide](/user-guide/managing-products)
- Contact your system administrator
