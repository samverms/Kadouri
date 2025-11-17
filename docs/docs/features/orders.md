---
sidebar_position: 2
---

# Orders

The Orders module is the core of Kadouri CRM, enabling complete order management from creation to invoicing with commission tracking and QuickBooks integration.

## Overview

Orders in Kadouri CRM represent sales transactions between sellers (suppliers) and buyers (customers). Each order contains:

- **Header Information**: Order number, seller, buyer, contract reference, terms, notes
- **Line Items**: Products with quantity, pricing, size/grade, and commission tracking
- **Status Tracking**: Draft → Confirmed → Posted to QB → Paid
- **QuickBooks Integration**: Automatic invoice sync with bidirectional updates
- **Activity Log**: Complete audit trail of all changes and QB actions

## Order Lifecycle

### 1. Draft

**Status**: `draft`

Orders start in draft mode when created. In this state:
- ✅ Can be freely edited
- ✅ Can add/remove line items
- ✅ Can change seller/buyer
- ✅ Can be deleted
- ❌ Not synced to QuickBooks yet

**Actions Available**:
- Edit Order
- Duplicate Order
- Delete Order
- Create Invoice in QB (moves to `posted_to_qb`)

### 2. Posted to QuickBooks

**Status**: `posted_to_qb`

After creating a QuickBooks invoice:
- ✅ Can still be edited
- ✅ Must click "Update QB Invoice" after editing
- ✅ Can void invoice
- ❌ Cannot be deleted (QB invoice exists)

**Actions Available**:
- Edit Order (requires QB update after)
- Update QB Invoice
- Void Invoice
- Duplicate Order

**Business Rule**: Editing a posted order does NOT automatically update QuickBooks. Users must manually click "Update QB Invoice" to push changes.

### 3. Paid

**Status**: `paid`

Set automatically when payment is received in QuickBooks:
- ❌ Completely read-only
- ❌ Cannot edit order
- ❌ Cannot update QB invoice
- ❌ Cannot void invoice
- ❌ Cannot delete order

**Actions Available**:
- View Order
- Duplicate Order
- View Activity Log

**Business Rule**: Paid orders are locked to preserve financial integrity. Any changes must be made in QuickBooks directly.

### 4. Cancelled

**Status**: `cancelled`

When an invoice is voided:
- ❌ Read-only
- ❌ Cannot edit
- ❌ Cannot be reactivated

## Creating Orders

### Manual Creation

1. Navigate to **Orders** → **New Order**
2. **Select Seller**: Search and select the supplier/seller account
3. **Select Buyer**: Search and select the customer/buyer account
4. **Add Line Items**:
   - Click "Add Line"
   - Select Product
   - Enter Size/Grade (memo)
   - Enter Quantity (number of cases/bags/units)
   - Enter Unit Size (lbs per case)
   - Select UOM (CASE, BAG, LBS)
   - Enter Unit Price (price per lb)
   - Enter Commission % (e.g., 5 for 5%)
   - System auto-calculates: Total Weight, Line Total, Commission Amount
5. **Optional Fields**:
   - Contract Number
   - Terms (payment terms, delivery notes)
   - Notes (internal notes)
6. **Save Order**

**Order Number**: Automatically generated in format `YYMM-XXXX` (e.g., `2501-0042` for January 2025, order #42)

### API Creation

```bash
POST /api/orders
Content-Type: application/json

{
  "sellerId": "uuid-of-seller",
  "buyerId": "uuid-of-buyer",
  "contractNo": "C-2025-001",
  "terms": "Net 30",
  "notes": "Rush order - deliver by Friday",
  "lines": [
    {
      "productId": "uuid-of-product",
      "sizeGrade": "Large 25lb",
      "quantity": 100,
      "unitSize": 25,
      "uom": "CASE",
      "totalWeight": 2500,
      "unitPrice": 1.50,
      "commissionPct": 0.05
    }
  ]
}
```

**Response**:
```json
{
  "id": "order-uuid",
  "orderNo": "2501-0042",
  "status": "draft",
  "subtotal": "3750.00",
  "commissionTotal": "187.50",
  "totalAmount": "3750.00",
  "lines": [...]
}
```

## Editing Orders

### Edit Rules by Status

| Field | Draft | Posted to QB | Paid |
|-------|-------|--------------|------|
| Seller/Buyer | ✅ Yes | ✅ Yes* | ❌ No |
| Line Items | ✅ Yes | ✅ Yes* | ❌ No |
| Contract/Terms/Notes | ✅ Yes | ✅ Yes* | ❌ No |
| Status | ✅ Yes | ✅ Yes* | ❌ No |

*Requires clicking "Update QB Invoice" after saving

### Editing a Posted Order

1. Open order detail page
2. Click "Edit" button
3. Make changes to order
4. Click "Save Changes"
5. ⚠️ **Important**: Click "Update QB Invoice" button to sync changes to QuickBooks
6. Check Activity Log to confirm sync

**Warning**: If you don't click "Update QB Invoice", the order and invoice will be out of sync!

### Editing via API

```bash
PATCH /api/orders/:orderId
Content-Type: application/json

{
  "notes": "Updated notes",
  "lines": [
    {
      "productId": "uuid",
      "quantity": 150,  # Updated quantity
      ...
    }
  ]
}
```

## Order Details Page

### Header Section

**Displays**:
- Order number
- Status badge
- QB Invoice number (if synced)
- Seller and Buyer information

**Actions**:
- Edit Order (disabled if paid)
- Duplicate Order
- Delete Order (disabled if posted or paid)

### QuickBooks Integration Panel

Blue panel showing:
- Current QB sync status
- Available QB actions:
  - **Create Invoice in QB** (shows when not yet synced)
  - **Update QB Invoice** (shows when synced and not paid)
  - **Void Invoice** (shows when synced and not paid)

### Tabs

#### 1. Order Details Tab

**Seller/Buyer Cards**:
- Account name and code
- Links to account detail pages

**Additional Details**:
- Contract Number
- Terms
- Notes

**Line Items Table**:
Columns:
- Item (Product name and description)
- Memo (Size/Grade)
- Qty (Quantity)
- Unit Size (lbs per case)
- UOM (CASE, BAG, LBS)
- Price/lb (Unit price)
- Total (Line total)
- Comm % (Commission percentage)
- Comm Amt (Commission amount in dollars)

**Totals**:
- **Total**: Sum of all line totals
- **Commission**: Sum of all commission amounts

#### 2. Activity Log Tab

Chronological log of all actions:
- Order created
- Order updated (with edit details)
- Invoice created in QB
- Invoice updated in QB
- Invoice voided
- Payment received
- QB sync events

**Each Activity Shows**:
- Icon (color-coded by type)
- Description of action
- User who performed action (or "QuickBooks Webhook" for automatic updates)
- Timestamp

## Commission Tracking

### Commission Calculation

**Two Methods**:

1. **Percentage-Based**: `Commission Amt = Line Total × Commission %`
2. **Fixed Amount**: Directly enter commission amount

### Commission Per Line

Each order line can have a different commission:
- Line 1: 5% commission
- Line 2: 7% commission
- Line 3: $50 flat commission

### Commission Total

Displayed at bottom of order:
```
Total: $10,000.00
Commission: $500.00
```

**Note**: Commission is tracked in PACE only, NOT synced to QuickBooks.

## QuickBooks Integration

See [QuickBooks Integration](./quickbooks-sync) for detailed documentation.

**Quick Summary**:

### Creating QB Invoice

1. Click "Create Invoice in QB" on order detail page
2. System creates:
   - QB Customer (if needed)
   - QB Items (if needed)
   - QB Invoice
3. Order status → `posted_to_qb`
4. Activity recorded

### Updating QB Invoice

1. Edit order
2. Save changes
3. Click "Update QB Invoice"
4. QB invoice updated with new line items/totals
5. Activity recorded

### Payment Sync

When payment is received in QuickBooks:
1. QB webhook notifies PACE
2. Order status → `paid`
3. Order becomes read-only
4. Activity: "Payment received in QuickBooks - Invoice marked as PAID"

## Searching and Filtering

### Order List Page

**Search**:
- Order number
- Contract number
- Seller name
- Buyer name

**Filters**:
- Status (Draft, Posted, Paid, Cancelled)
- Date range
- Seller
- Buyer

**Sorting**:
- Order date (newest first)
- Order number
- Total amount
- Status

### Quick Stats

Dashboard shows:
- Total orders this month
- Total revenue
- Outstanding invoices
- Paid invoices

## Duplicating Orders

To create a similar order:

1. Open existing order
2. Click "Duplicate" button
3. Modify seller/buyer/lines as needed
4. Save as new order

**What's Copied**:
- Seller and Buyer
- All line items (products, quantities, prices, commissions)
- Contract number
- Terms and notes

**What's NOT Copied**:
- Order number (new one generated)
- Status (always starts as `draft`)
- QB invoice mapping
- Activity log

## Deleting Orders

**Rules**:
- ✅ Can delete `draft` orders
- ❌ Cannot delete `posted_to_qb` orders
- ❌ Cannot delete `paid` orders
- ❌ Cannot delete `cancelled` orders

**Alternative**: Void the invoice instead of deleting

**API**:
```bash
DELETE /api/orders/:orderId
```

## Reporting

### Order Reports

Available reports:
- Sales by Customer
- Sales by Product
- Commission Report
- Outstanding Invoices
- Payment History

### Exporting Data

Export orders to:
- Excel (.xlsx)
- CSV
- PDF

## Best Practices

1. **Always Fill Terms**: Include payment terms, delivery notes, etc.
2. **Use Contract Numbers**: Link to physical contracts for reference
3. **Review Activity Log**: Before making changes, check what's happened
4. **Update QB After Edits**: Don't forget to sync changes to QuickBooks
5. **Check Commission**: Verify commission % matches sales agreement
6. **Use Size/Grade**: Add product variants (e.g., "Large 25lb") in memo field
7. **Duplicate for Similar Orders**: Save time by duplicating recurring orders

## Common Workflows

### Standard Order → Invoice Flow

1. Create order (status: `draft`)
2. Review and confirm details
3. Create invoice in QB (status: `posted_to_qb`)
4. Wait for payment
5. QB webhook updates status to `paid`
6. Order becomes read-only

### Order Needs Changes After Posting

1. Order is `posted_to_qb`
2. Click "Edit"
3. Make changes
4. Save changes
5. **Click "Update QB Invoice"** ← Critical step
6. Check Activity Log for confirmation

### Customer Cancels Order

1. Order is `posted_to_qb`
2. Click "Void Invoice"
3. Confirm action
4. Status → `cancelled`
5. QB invoice voided
6. Activity: "Invoice voided in QuickBooks"

### Rush Order Entry

1. Create new order
2. Add line items quickly
3. Save as `draft`
4. Review with sales team
5. Edit if needed
6. Create QB invoice when approved

## API Reference

### Endpoints

```bash
# List orders
GET /api/orders?search=&status=&sellerId=&buyerId=&limit=50

# Get single order
GET /api/orders/:orderId

# Create order
POST /api/orders

# Update order
PATCH /api/orders/:orderId

# Delete order
DELETE /api/orders/:orderId

# Get order activities
GET /api/orders/:orderId/activities
```

### Order Schema

```typescript
interface Order {
  id: string
  orderNo: string
  sellerId: string
  buyerId: string
  status: 'draft' | 'posted_to_qb' | 'paid' | 'cancelled'
  contractNo?: string
  terms?: string
  notes?: string
  subtotal: string
  commissionTotal: string
  totalAmount: string
  qboDocId?: string
  qboDocNumber?: string
  qboDocType?: 'invoice' | 'estimate'
  createdBy: string
  createdAt: Date
  updatedAt: Date
  lines: OrderLine[]
}

interface OrderLine {
  id: string
  orderId: string
  lineNo: number
  productId: string
  sizeGrade: string
  quantity: string
  unitSize: string
  uom: string
  totalWeight: string
  unitPrice: string
  commissionPct?: string
  commissionAmt?: string
  lineTotal: string
}
```

## Troubleshooting

### Cannot Edit Order

**Problem**: Edit button is disabled
- **Cause**: Order status is `paid`
- **Solution**: Order is read-only. Make changes in QuickBooks or void invoice and recreate

### Changes Not Showing in QB

**Problem**: Edited order but QB invoice still shows old data
- **Cause**: Forgot to click "Update QB Invoice"
- **Solution**: Click "Update QB Invoice" button on order detail page

### Cannot Delete Order

**Problem**: Delete button is disabled
- **Cause**: Order is `posted_to_qb` or `paid`
- **Solution**: Void invoice first, or keep as `cancelled`

### Order Total Mismatch

**Problem**: Order total doesn't match sum of lines
- **Cause**: Commission calculation error or stale data
- **Solution**: Edit order and save to recalculate, or refresh page

### Activity Log Empty

**Problem**: No activities showing
- **Cause**: Activities added in recent update, old orders have no history
- **Solution**: Normal - activities only recorded from now on

## Future Enhancements

Planned features:
- Batch order import from Excel
- Order templates for recurring customers
- Auto-fill from previous orders
- Pricing rules and discounts
- Inventory allocation
- Shipment tracking integration
- Email notifications on status changes

