---
sidebar_position: 1
---

# Managing Accounts

This guide will walk you through all the features of the Accounts module in Kadouri CRM.

## Accessing the Accounts Page

1. Log in to Kadouri CRM
2. Click **Accounts** in the main navigation menu
3. You'll see a list of all accounts (by default, only active accounts)

## Viewing Accounts

### Account List

The accounts list shows:
- Account code and name
- Primary contact information
- Phone and email
- Primary address location
- Assigned sales agent
- Active/Inactive status
- Order count indicator

### Filtering Accounts

By default, only **active accounts** are displayed. To see all accounts:

1. Look for the filter button at the top right of the search bar
2. Click to toggle between "Active Only" and "Show All"
3. The button shows the current filter state with color coding:
   - Blue background = Active Only
   - Gray background = Show All

### Searching for Accounts

Kadouri CRM offers powerful search capabilities:

#### Simple Search
Just type in the search box to search across all fields:
- Account name
- Account code
- Agent name
- Contact names, emails, phones
- Address information

#### Advanced Search (Nested Queries)

Use field-specific prefixes for precise searching:

**Search by Agent:**
```
agent:John
```
Shows only accounts assigned to agents with "John" in their name

**Search by Account Name:**
```
name:ABC
```
Shows only accounts with "ABC" in the account name

**Search by Email:**
```
email:info@example.com
```
Shows accounts with contacts having this email

**Search by Location:**
```
city:NY
```
Shows accounts with addresses in New York

**Combine Multiple Criteria (AND):**
```
agent:John city:NY
```
Shows accounts where agent is John AND city is NY

**Mix General and Specific Search:**
```
agent:Sam produce
```
Shows accounts where agent is Sam AND "produce" appears anywhere

#### Search Field Reference

- `agent:value` - Search agent names
- `name:value` - Search account names
- `code:value` - Search account codes
- `email:value` - Search contact emails
- `contact:value` - Search contact names/emails/phones
- `phone:value` - Search contact phones
- `city:value` or `address:value` - Search addresses
- `state:value` - Search state field
- `zip:value` or `postal:value` - Search postal codes

### Viewing Account Details

**Click any row** to navigate to the account detail page, or:

1. Click the **expand arrow** (>) on the left to show:
   - All contacts for the account
   - All addresses for the account
2. Click the **email icon** next to a contact's email to send them an email
3. Click the **orders icon** to see recent orders and outstanding invoices

## Creating a New Account

### Step-by-Step

1. Click the **+ New Account** button (top right)
2. Fill in the required information:
   - **Account Name**: Company or business name
   - **Account Type**: Select Buyer, Seller, or Both
3. Optional information:
   - **Account Code**: Leave blank for auto-generation
   - **Sales Agent**: Assign a sales representative
   - **Broker Associations**: Link one or more brokers
4. Click **Create Account**

After creation, you'll be taken to the account detail page where you can add contacts and addresses.

## Editing Account Information

### Basic Information

1. Navigate to the account detail page
2. Find the **Account Information** card
3. You can view/edit:
   - Account code (read-only)
   - Account name
   - Created date (read-only)
   - Status toggle (Active/Inactive)
   - Sales agent
   - Account type (radio buttons)
   - Broker information

### Changing Account Status

To activate or deactivate an account:

1. Go to the account detail page
2. Find the **Status** toggle in the Account Information card
3. Click the toggle switch
4. The status changes immediately:
   - Green = Active
   - Red = Inactive

Inactive accounts won't appear in the list by default (use "Show All" filter to see them).

### Setting Account Type

The account type determines whether this is a customer (Buyer), vendor (Seller), or both:

1. Go to the account detail page
2. Find the **Account Type** radio buttons
3. Select one of three options:
   - **Buyer**: You sell to this account
   - **Seller**: You buy from this account
   - **Both**: You both buy from and sell to this account
4. Changes save automatically

## Managing Contacts

### Adding a Contact

1. Navigate to the account detail page
2. Find the **Contacts** section
3. Click **+ Add Contact**
4. Fill in the contact information:
   - Name (required)
   - Email (required)
   - Phone (optional)
   - Check "Primary" to make this the default contact
5. Click **Save**

### Editing a Contact

1. Find the contact in the Contacts section
2. Click the **edit icon** (pencil)
3. Make your changes
4. Click **Save**

### Primary Contact

- Each account should have one primary contact
- When you mark a contact as primary, any previous primary contact is automatically unmarked
- The primary contact appears in the accounts list table
- The primary contact is used for QuickBooks sync

## Managing Addresses

### Adding an Address

1. Navigate to the account detail page
2. Find the **Addresses** section
3. Click **+ Add Address**
4. Fill in the address information:
   - **Type**: billing, shipping, warehouse, or pickup
   - **Address Line 1** (required)
   - **Address Line 2** (optional)
   - **City** (required)
   - **State** (required)
   - **Postal Code** (required)
   - **Country** (defaults to USA)
   - Check "Primary" to make this the default for its type
5. Click **Save**

### Editing an Address

1. Find the address in the Addresses section
2. Click the **edit icon** (pencil)
3. Make your changes
4. Click **Save**

### Primary Addresses

- You can have one primary address per type (e.g., one primary billing, one primary shipping)
- When you mark an address as primary for its type, any previous primary of that type is automatically unmarked
- The primary address appears in the accounts list table

## Best Practices

### When to Use Each Account Type

- **Buyer**: For customers you sell products to
  - Wholesalers
  - Retailers
  - Distributors who buy from you

- **Seller**: For vendors you buy products from
  - Farms
  - Growers
  - Suppliers

- **Both**: For trading partners
  - Other brokers
  - Companies you both buy from and sell to

### Keeping Information Up to Date

1. **Email Addresses**: Keep contact emails current for:
   - Sending invoices and PDFs
   - QuickBooks sync
   - Communication tracking

2. **Phone Numbers**: Maintain for:
   - Direct contact
   - Emergency communication
   - Order verification

3. **Addresses**: Update for:
   - Accurate shipping
   - Billing information
   - QuickBooks sync

### Using Sales Agents

- Assign accounts to sales agents for:
  - Commission tracking on orders
  - Territory management
  - Performance reporting
- Search accounts by agent using `agent:Name` in search

### QuickBooks Sync Tips

- Always add at least one contact before syncing
- Ensure primary address is complete
- Account name should not contain special characters
- Sync happens automatically when creating orders

## Common Tasks

### Finding an Account Quickly

**By Agent:**
```
agent:Smith
```

**By Location:**
```
city:Los Angeles
```

**By Account Code:**
```
code:ABC-1234
```

**Combination:**
```
agent:Jones state:CA
```

### Bulk Actions

To work with multiple accounts:
1. Use the search and filter features to find the accounts
2. Open each in a new tab (Ctrl+Click or Cmd+Click)
3. Make changes to each

### Exporting Account List

Currently, export functionality is in development. For now, you can:
1. Use browser print-to-PDF
2. Copy table data to spreadsheet

## Troubleshooting

### Can't Find an Account

1. Check the "Active Only" filter - toggle to "Show All"
2. Try different search terms or field-specific queries
3. Verify spelling and account code
4. Check if account was created in a different company profile

### Changes Not Saving

1. Ensure you have edit permissions (check with admin)
2. Check your internet connection
3. Look for error messages in red
4. Try refreshing the page and trying again

### Email Button Not Working

1. Verify you have a default email client configured
2. Check that the contact has a valid email address
3. Try copying the email and using your email client directly

## Next Steps

- [Creating Orders](creating-orders.md) - Use accounts to create orders
- [Viewing Reports](viewing-reports.md) - Generate reports by account
- [User Settings](user-settings.md) - Configure your preferences
