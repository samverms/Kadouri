---
sidebar_position: 2
---

# AI Query Examples

Comprehensive examples of user queries and AI responses for training chat assistants.

## Account Queries

### Advanced Account Search

**User**: "Show me all accounts for agent John in New York"

**AI Response**:
```
I'll search for accounts using the query: agent:John city:NY

Found 5 accounts:

1. Fresh Valley Markets
   Agent: John Smith | Location: New York, NY
   Type: Buyer | Status: Active
   Contact: sarah@freshvalley.com

2. Green Farms Supply Co.
   Agent: John Davis | Location: Buffalo, NY
   Type: Seller | Status: Active
   Contact: mike@greenfarms.com

3. NYC Produce Distributors
   Agent: John Smith | Location: New York, NY
   Type: Both | Status: Active
   Contact: info@nycproduce.com

4. Empire State Foods
   Agent: John Williams | Location: Albany, NY
   Type: Buyer | Status: Active
   Contact: orders@empirestatefoods.com

5. Brooklyn Fresh Market
   Agent: John Smith | Location: Brooklyn, NY
   Type: Buyer | Status: Inactive

💡 Search Tips:
- Use agent:name to search by agent
- Use city:location to filter by city
- Combine multiple criteria with spaces
- Use name:text to search account names only

Would you like to:
- View details for any account?
- See orders for these accounts?
- Export this list?
- Refine the search?
```

### Nested Query Search Examples

**User**: "Find accounts with email containing 'info@'"

**AI Response**:
```
Searching with query: email:info@

Found 12 accounts with contacts having 'info@' in their email:

Recent matches:
1. ABC Produce - info@abcproduce.com
2. Valley Foods - info@valleyfoods.com
3. Fresh Markets Inc - info@freshmarkets.com
4. Organic Harvest LLC - info@organicharvest.com
5. Prime Produce - info@primeproduce.com

Would you like to:
- See all 12 results?
- Search for a specific domain?
- Export contact list?
```

**User**: "Show me inactive accounts in California"

**AI Response**:
```
Using nested query: state:CA with "Show All" filter enabled

Found 8 inactive accounts in California:

1. Sunset Growers (Los Angeles, CA)
   Last Active: 3 months ago
   Agent: Sarah Johnson

2. Golden State Produce (San Diego, CA)
   Last Active: 6 months ago
   Agent: Mike Davis

3. Valley Fresh Markets (Fresno, CA)
   Last Active: 1 month ago
   Agent: Tom Anderson

[... 5 more results ...]

⚠️ These accounts are inactive. Would you like to:
- Reactivate any accounts?
- Contact these accounts?
- See their order history?
- Archive permanently?
```

### Finding a Customer

**User**: "Find ABC Produce"

**AI Response**:
```
I found ABC Produce:

📋 Account Details:
- Type: Buyer (Customer)
- Email: contact@abcproduce.com
- Phone: (555) 123-4567
- Status: Active

📍 Primary Address:
123 Main St, Suite 100
Los Angeles, CA 90001

📊 Quick Stats:
- Total Orders: 45
- Total Revenue: $125,430
- Last Order: 3 days ago
- QuickBooks: Synced ✓

What would you like to do?
- View orders
- Create new order
- Edit account
- See full details
```

### Listing Recent Customers

**User**: "Show me customers added this week"

**AI Response**:
```
I found 3 new customers added this week:

1. Fresh Valley Markets
   Added: 2 days ago | Type: Buyer
   Contact: sarah@freshvalley.com

2. Green Farms Supply Co.
   Added: 4 days ago | Type: Seller
   Contact: john@greenfarms.com

3. Organic Harvest LLC
   Added: 6 days ago | Type: Buyer
   Contact: info@organicharvest.com

Would you like to:
- View details for any customer?
- See their order history?
- Export this list?
```

## Order Queries

### Order Lookup by Number

**User**: "What's the status of order 12345?"

**AI Response**:
```
Order #ORD-12345 Status:

📦 Order Details:
- Status: Posted to QuickBooks ✓
- Date: January 15, 2024
- Seller: Green Valley Farms
- Buyer: ABC Produce
- Total: $8,450.00

💰 Payment:
- QB Invoice: INV-5678
- Status: Unpaid
- Due Date: February 15, 2024

📋 Products (3 items):
1. Grade A Tomatoes - 500 lbs @ $2.50/lb
2. Organic Lettuce - 300 heads @ $1.75/each
3. Bell Peppers - 200 lbs @ $3.00/lb

Would you like to:
- View full order details?
- Generate PDF?
- Check payment status in QuickBooks?
```

### Orders by Date Range

**User**: "Show me all orders from last month"

**AI Response**:
```
Found 28 orders from December 2023:

Summary:
- Total Revenue: $145,320
- Average Order: $5,190
- Top Customer: ABC Produce (8 orders)
- Status Breakdown:
  • Paid: 15 orders
  • Posted to QB: 10 orders
  • Confirmed: 3 orders

Top 5 Orders:
1. ORD-12301 | $15,450 | Paid | Dec 5
2. ORD-12315 | $12,800 | Paid | Dec 12
3. ORD-12328 | $11,200 | Posted to QB | Dec 20
4. ORD-12334 | $9,750 | Paid | Dec 22
5. ORD-12340 | $8,900 | Confirmed | Dec 28

Would you like to:
- See all 28 orders?
- Filter by customer or status?
- Export to Excel?
- Generate sales report?
```

### Orders by Customer

**User**: "Show me ABC Produce's orders"

**AI Response**:
```
ABC Produce - Order History:

Recent Orders (Last 30 days):
1. ORD-12345 | Jan 15 | $8,450 | Posted to QB
2. ORD-12298 | Jan 8 | $5,230 | Paid
3. ORD-12267 | Jan 2 | $6,890 | Paid

📊 30-Day Summary:
- Orders: 3
- Total: $20,570
- Average: $6,857
- Commission Earned: $1,234

📈 All-Time Stats:
- Total Orders: 45
- Total Revenue: $125,430
- Active Since: March 2023
- Payment History: 98% on-time

Would you like to:
- See older orders?
- View specific order details?
- Generate customer report?
- Create new order for ABC Produce?
```

## Custom Report Queries

### Sales Report

**User**: "Create a sales report for January"

**AI Response**:
```
January 2024 Sales Report

📊 Overview:
- Total Revenue: $234,560
- Number of Orders: 48
- Average Order Value: $4,887
- Growth vs Dec: +15.3% ↗️

👥 Top 5 Customers:
1. ABC Produce - $45,230 (19.3%)
2. Fresh Markets Inc - $38,900 (16.6%)
3. Valley Foods - $28,450 (12.1%)
4. City Grocers - $24,780 (10.6%)
5. Prime Produce - $19,890 (8.5%)

📦 Product Performance:
1. Grade A Tomatoes - $52,300 (189 orders)
2. Organic Lettuce - $41,200 (156 orders)
3. Bell Peppers - $35,600 (142 orders)

💰 Commission Summary:
- Total Commissions: $14,073
- Average Rate: 6%
- Top Earner: Sarah Johnson ($3,450)

Report generated on: [Date/Time]

Would you like to:
- Export to Excel/PDF?
- Email this report?
- See daily breakdown?
- Compare with other months?
```

### Commission Report

**User**: "Show me my commission for this quarter"

**AI Response**:
```
Your Commission Report - Q1 2024

💵 Total Commission Earned: $12,450.75

Monthly Breakdown:
- January: $4,230.50 (15 orders)
- February: $3,890.25 (13 orders)
- March: $4,330.00 (16 orders)

📈 Performance:
- Orders Closed: 44
- Total Sales: $207,513
- Average Commission Rate: 6%
- Quarter-over-Quarter Growth: +18% ↗️

Top Contributing Orders:
1. ORD-12456 | ABC Produce | $650 commission
2. ORD-12501 | Fresh Markets | $580 commission
3. ORD-12389 | Valley Foods | $520 commission

Commission Payment Schedule:
- Q1 Commission: $12,450.75
- Payment Date: April 15, 2024
- Status: Pending Approval

Would you like to:
- Export detailed breakdown?
- See order-by-order details?
- Compare with previous quarters?
```

### Custom Filter Report

**User**: "Show me orders over $10,000 that are still unpaid"

**AI Response**:
```
Large Unpaid Orders Report

Found 6 orders over $10,000 that are unpaid:

🔴 High Priority (Over 30 days):
1. ORD-12234 | Dec 10 | $15,450 | ABC Produce
   QB Invoice: INV-5432 | Due: Jan 10 | 34 days overdue

2. ORD-12289 | Dec 20 | $12,800 | Valley Foods
   QB Invoice: INV-5501 | Due: Jan 20 | 24 days overdue

🟡 Medium Priority (15-30 days):
3. ORD-12398 | Jan 5 | $11,200 | Fresh Markets
   QB Invoice: INV-5689 | Due: Feb 5 | 8 days overdue

🟢 Not Yet Due:
4. ORD-12445 | Jan 20 | $14,300 | City Grocers
   QB Invoice: INV-5778 | Due: Feb 20 | Due in 7 days

5. ORD-12456 | Jan 25 | $10,800 | Prime Produce
   QB Invoice: INV-5801 | Due: Feb 25 | Due in 12 days

6. ORD-12467 | Feb 1 | $13,500 | ABC Produce
   QB Invoice: INV-5823 | Due: Mar 1 | Due in 18 days

💰 Total Outstanding: $78,050

Recommended Actions:
- Follow up on overdue orders
- Send payment reminders
- Review credit terms for repeat late payers

Would you like to:
- Export to Excel for follow-up?
- Send automated payment reminders?
- View individual order details?
- Generate aging report?
```

## How-To Questions

### Simple How-To

**User**: "How do I add a new product?"

**AI Response**:
```
Here's how to add a new product to Kadouri CRM:

**Step 1**: Navigate to Products
- Click "Products" in the main navigation menu

**Step 2**: Click "+ New Product"
- Look for the button in the top-right corner

**Step 3**: Fill in Product Details
- Product Name (required)
- Description
- Variety (e.g., "Grade A", "Organic")
- Grade
- Unit (lbs, each, box, etc.)
- Price per unit

**Step 4**: QuickBooks Settings (optional)
- If you want this to sync with QuickBooks, the system will create it automatically on the first order
- Or you can manually sync it from the product page

**Step 5**: Save
- Click "Save" to create the product

💡 **Pro Tip**: After creating the product, it will immediately be available when creating orders!

Would you like me to:
- Walk you through this step-by-step?
- Explain QuickBooks sync in more detail?
- Show you how to import multiple products?
```

### Complex Workflow

**User**: "What's the complete process for a new order from start to QuickBooks?"

**AI Response**:
```
Complete Order-to-QuickBooks Workflow

📝 **Phase 1: Order Creation**

Step 1: Create Order
- Go to Orders → "+ New Order"
- Select Seller (who you're buying from)
- Select Buyer (who you're selling to)
- Status starts as "Draft"

Step 2: Add Products
- Click "+ Add Line"
- Select product, enter quantity and price
- Commission calculates automatically
- Repeat for all products

Step 3: Review & Confirm
- Check all details
- Review commission calculations
- Change status to "Confirmed"
- Click "Save"

📤 **Phase 2: QuickBooks Sync**

Step 4: Prepare for Sync
- System checks if Buyer exists in QuickBooks
  - If not, syncs customer first
- System checks if Products exist in QuickBooks
  - If not, syncs items first

Step 5: Post to QuickBooks
- Click "Post to QuickBooks"
- Choose "Invoice" or "Estimate"
- System creates document in QB
- Status changes to "Posted to QB"
- QB Invoice/Estimate number is saved

📄 **Phase 3: Documentation**

Step 6: Generate PDFs
- Click "Generate PDFs"
- Creates Seller PDF (blue theme)
- Creates Buyer PDF (green theme)
- Both PDFs stored in system
- Can be emailed or downloaded

💵 **Phase 4: Payment**

Step 7: Track Payment
- When payment received in QuickBooks
- Webhook updates order status to "Paid"
- Commission becomes eligible for payout
- Order marked as complete

⏱️ **Timeline:**
- Draft to Confirmed: Same day
- QB Sync: Instant (2-5 seconds)
- Payment: Per customer terms (Net 30, etc.)

Need help with any specific step? Just ask!
```

## Troubleshooting Queries

### Sync Error

**User**: "Order won't sync to QuickBooks, getting an error"

**AI Response**:
```
Let me help troubleshoot the QuickBooks sync issue.

🔍 **Diagnostic Check:**

Checking Order #[XXX]...

✓ QuickBooks Connection: Active
✓ Order Status: Confirmed
✗ **Issue Found**: Customer "ABC Produce" not found in QuickBooks
✓ All products exist in QuickBooks

**Root Cause**: The customer needs to be synced to QuickBooks before the order can be posted.

**Solution (3 steps):**

1. **Sync the Customer**
   - Go to Accounts → ABC Produce
   - Click "Sync to QuickBooks" button
   - Wait for success confirmation (~3 seconds)

2. **Verify Sync**
   - You should see "QB Customer ID" populated
   - Status changes to "Synced"

3. **Retry Order Sync**
   - Return to the order
   - Click "Post to QuickBooks" again
   - Should succeed this time!

**Why This Happens:**
QuickBooks requires the customer to exist before creating an invoice. We sync customers automatically, but sometimes manual sync is needed if:
- Customer was just created
- QB connection was temporarily down
- Customer was modified outside the system

Would you like me to:
- Walk you through the sync process?
- Check for other potential issues?
- Show you how to prevent this in the future?
```

### Missing Data

**User**: "I can't find the customer I just added"

**AI Response**:
```
Let me help you locate the customer.

**Quick Questions:**
1. What's the customer name you're looking for?
2. When did you add them (today, yesterday, etc.)?
3. Did you see a success message after saving?

**While you answer, here are common reasons:**

🔍 **Search Tips:**
- Try searching by just the first few letters
- Check if there's a typo in your search
- Search by email or phone instead of name

📋 **Filter Settings:**
- Make sure "Active Only" filter isn't hiding them
- Check if you're filtering by type (Seller vs Buyer)
- Clear any date range filters

👀 **Check These:**
- Did the save actually complete? (page refresh can interrupt)
- Are you logged into the correct company account?
- Do you have permission to see this type of account?

💡 **Let's Search Together:**
Type the customer name and I'll search for:
- Exact matches
- Partial matches
- Similar names
- Recently added customers

Once you provide the name, I'll do a comprehensive search!
```

## Conversation Flows

### Multi-Turn Dialogue

**Turn 1**
**User**: "Show me January sales"

**AI**: [Shows January sales summary with $234,560 total]

**Turn 2**
**User**: "Who was the top customer?"

**AI**: "The top customer in January was ABC Produce with $45,230 in sales (19.3% of total). They placed 8 orders with an average value of $5,654."

**Turn 3**
**User**: "Show me those orders"

**AI**: [Lists all 8 ABC Produce orders from January with details]

**Turn 4**
**User**: "Export to Excel"

**AI**: "I've prepared an Excel export with:
- All 8 ABC Produce orders from January
- Order details (date, products, amounts)
- Commission breakdown
- Payment status

📥 Download ready: abc_produce_jan_2024.xlsx

Would you also like me to email this to you?"

## Next Steps

- [Custom Reports](custom-reports) - Detailed report generation patterns
- [Troubleshooting](troubleshooting) - Complete issue resolution guide
- [Overview](overview) - AI assistant capabilities and architecture
