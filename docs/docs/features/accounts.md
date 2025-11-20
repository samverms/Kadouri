---
sidebar_position: 1
---

# Accounts Management

The Accounts module in Kadouri CRM allows you to manage both sellers (vendors) and buyers (customers) in a unified system. Each account can have multiple contacts, addresses, and associated orders.

## Overview

Accounts are the core entities in Kadouri CRM, representing businesses you buy from (sellers) or sell to (buyers). The system supports:

- **Account Types**: Buyer, Seller, or Both
- **Multiple Contacts**: Track multiple people within each account
- **Multiple Addresses**: Billing, shipping, warehouse, and pickup addresses
- **Sales Agent Assignment**: Assign accounts to specific sales agents
- **Broker Associations**: Link one or more brokers to accounts
- **QuickBooks Integration**: Sync accounts as customers in QuickBooks Online
- **Active/Inactive Status**: Control which accounts are displayed

## Account Fields

### Basic Information
- **Account Code**: Unique identifier (auto-generated or custom)
- **Account Name**: Company or business name
- **Account Type**: Buyer, Seller, or Both
- **Status**: Active or Inactive
- **Sales Agent**: Assigned sales representative
- **Brokers**: One or more associated broker IDs

### Related Data
- **Contacts**: People associated with the account
  - Name, email, phone
  - Primary contact designation
- **Addresses**: Physical locations
  - Types: billing, shipping, warehouse, pickup
  - Primary address designation
- **QuickBooks**: QBO Customer ID (auto-populated when synced)

## Account List Features

### Search Functionality

The accounts page includes powerful nested query search capabilities:

#### Basic Search
Simply type any text to search across all fields:
```
ABC
```
Searches in: account name, code, agent name, contact names, emails, phones, addresses

#### Field-Specific Search
Use field prefixes with colons to search specific fields:

- `agent:John` - Search only in agent names
- `name:ABC` - Search only in account names
- `code:XYZ-123` - Search only in account codes
- `email:test@example.com` - Search only in contact emails
- `contact:Jane` - Search in contact name, email, or phone
- `phone:555-1234` - Search only in contact phones
- `city:NY` or `address:NY` - Search in addresses
- `state:CA` - Search only in state field
- `zip:90210` or `postal:90210` - Search in postal codes

#### Combined Queries (AND Logic)
Combine multiple field-specific searches - ALL must match:

```
agent:John name:ABC
```
Finds accounts where agent is John AND name contains ABC

```
agent:Sam city:NY
```
Finds accounts where agent is Sam AND city is NY

#### Mixed Queries
Combine field-specific (AND) with general search (OR):

```
agent:John office
```
Agent must be John AND "office" can appear in any field

### Filtering

- **Active Only Toggle**: By default, only active accounts are shown
  - Click the filter button to toggle between "Active Only" and "Show All"
  - Button displays current filter state with visual feedback

### Table Columns

The accounts table displays:
- **Expand Button**: Click to show contacts and addresses
- **Code**: Unique account identifier (clickable link)
- **Account Name**: Company name (clickable link)
- **Orders**: Icon button showing recent orders and outstanding invoices
- **Primary Contact**: Name of main contact
- **Phone**: Primary contact's phone number
- **Email**: Primary contact's email with mail button
- **Primary Address**: City and state
- **Agent Name**: Assigned sales agent
- **Status**: Active/Inactive badge

### Row Actions

- **Click Row**: Navigate to account detail page
- **Expand Button**: Show/hide contacts and addresses
- **Email Button**: Opens default email client with contact's email

## Account Detail Page

### Account Information Card

Displays and allows editing of:
- **Account Code**: Auto-generated or custom
- **Account Name**: Editable business name
- **Created Date**: When account was created
- **Status Toggle**: Switch between Active/Inactive
- **Sales Agent**: Assigned representative
- **Account Type**: Radio buttons for Buyer, Seller, or Both
- **Brokers**: Display of associated brokers (count)

### Account Type Selection

The account type uses radio buttons with three mutually exclusive options:
- **Buyer**: Account is a customer you sell to
- **Seller**: Account is a vendor you buy from
- **Both**: Account is both a customer and vendor

Changes are saved immediately using optimistic updates for smooth UX.

### Managing Contacts

Add and edit contacts for each account:
- Name (required)
- Email (required)
- Phone (optional)
- Mark as primary contact

Only one contact can be marked as primary at a time.

### Managing Addresses

Add and edit addresses for each account:
- **Type**: billing, shipping, warehouse, pickup
- **Address Lines**: line1, line2
- **Location**: city, state, postal code, country
- **Primary**: Designation for default address per type

Only one address per type can be marked as primary.

## Creating Accounts

### Via Web Interface

1. Navigate to **Accounts** page
2. Click **+ New Account** button
3. Fill in required fields:
   - Account name
   - Account type (default: Both)
4. Optional fields:
   - Custom account code (auto-generated if blank)
   - Sales agent
   - Broker associations
5. Click **Create Account**

After creation, you can add:
- Contacts
- Addresses
- Additional details

### Via API

```bash
POST /api/accounts
Content-Type: application/json

{
  "name": "ABC Produce Company",
  "accountType": "buyer",
  "salesAgentId": "agent_123",
  "brokerIds": ["broker_456", "broker_789"],
  "active": true
}
```

## QuickBooks Integration

### Syncing Accounts to QuickBooks

Accounts are automatically synced to QuickBooks when:
1. Creating an order for a buyer account
2. Manually triggering sync from account detail page

The system maps accounts to QuickBooks Customers with:
- Name → Customer Display Name
- Primary address → Billing Address
- Primary contact → Primary Contact

### Sync Status

- **Synced**: Account has a QBO Customer ID
- **Not Synced**: No QBO Customer ID yet
- **Sync Failed**: Error occurred during sync (check logs)

## Best Practices

### Account Codes
- Use consistent naming: `ABC-1234` format
- Let system auto-generate for consistency
- Codes are unique and cannot be changed

### Account Types
- Set to **Buyer** for customers only
- Set to **Seller** for vendors only
- Set to **Both** for trading partners (you both buy and sell)

### Contacts
- Always add at least one contact
- Mark primary contact for default communication
- Keep email addresses up to date for QuickBooks sync

### Addresses
- Add billing address for invoicing
- Add shipping address for deliveries
- Mark primary for each type

### Sales Agent Assignment
- Assign accounts to agents for commission tracking
- Search by agent name using `agent:` prefix
- Required for order commission calculations

## Troubleshooting

### Account Not Appearing in List

**Problem**: Created an account but can't find it

**Solutions**:
1. Check if "Active Only" filter is on - toggle to "Show All"
2. Try searching by code instead of name
3. Search using field-specific query: `code:ABC` or `name:Produce`
4. Check if account was actually saved (refresh page)

### QuickBooks Sync Failed

**Problem**: Account won't sync to QuickBooks

**Solutions**:
1. Verify QuickBooks connection is active
2. Check that account name is valid (no special characters)
3. Ensure primary address is complete
4. Check API logs for specific error message

### Cannot Change Account Type

**Problem**: Account type radio buttons not saving

**Solutions**:
1. Ensure you have edit permissions
2. Check browser console for errors
3. Verify account is not locked due to existing orders
4. Try refreshing the page and attempting again

## API Endpoints

See [API Documentation](../api/accounts.md) for detailed endpoint information.

## Related Features

- [Orders](orders.md) - Create orders using accounts as buyers/sellers
- [QuickBooks Sync](quickbooks-sync.md) - Integration details
- [RBAC](rbac.md) - Permission requirements for account management
