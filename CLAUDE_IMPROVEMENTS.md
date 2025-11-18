# Suggested Improvements to CLAUDE.md

## Critical Additions Needed

### 1. Database Schema Source of Truth Warning
**Insert after line 97 in "Database Schema (Drizzle ORM)" section:**

```markdown
**CRITICAL**: The actual database contains additional tables not present in Drizzle schema files:
- Review `sqlschema.txt` (581 lines) for complete schema before making changes
- Tables like `documents`, `organizations`, `email_queue`, `email_activity_log` exist in DB but not in schema files
- This drift can cause migration conflicts - always reconcile before running `migration:generate`
```

**Rationale**: Prevents migration failures from unknown tables.

---

### 2. Contract Management System
**Add new section after "PDF Generation" (after line 322):**

```markdown
### Contract Management

The system includes a sophisticated contract lifecycle management system:

**Contract Status Flow**: `draft` → `active` → `completed`/`expired`/`cancelled`

**Key Features**:
- Contract draws: Orders can be linked to contracts via `contractId`
- Automatic quantity tracking: `remainingQuantity` decrements when orders are drawn
- Audit trail: `contract_draws` table logs every withdrawal with timestamp
- Document management:
  - `draftDocumentUrl`: Auto-generated PDF via `/api/pdf/contract/:id`
  - `executedDocumentUrl`: Uploaded signed contract (stored in S3)
  - `documentVersions`: JSONB array tracking version history

**Creating a Contract-Linked Order**:
```typescript
// When creating order with contractId
const contract = await db.query.contracts.findFirst({ where: eq(contracts.id, contractId) })
if (contract.remainingQuantity < orderQuantity) {
  throw new Error('Contract has insufficient remaining quantity')
}
// Order creation automatically creates contract_draw record and updates remainingQuantity
```

**Contract Modules**:
- API: `apps/api/src/modules/contracts/`
- Frontend: `apps/web/src/app/(dashboard)/contracts/`
- Schema: `apps/api/src/db/schema/contracts.ts`
```

**Rationale**: This is a major feature not documented in detail.

---

### 3. Commission Calculation Models
**Add to "Important Notes" section (after line 325):**

```markdown
- **Commission Flexibility**: Order lines support TWO commission models:
  - **Percentage-based**: Set `commissionPct` (0-100), system calculates `commissionAmt = lineTotal * (pct / 100)`
  - **Absolute amount**: Set `commissionAmt` directly, bypasses percentage calculation
  - **Mixed mode**: Different order lines can use different models in the same order
  - Total aggregated in `orders.commissionTotal` for reporting
```

**Rationale**: Non-obvious business logic that affects calculations.

---

### 4. Parent Account Hierarchies
**Add to "Database Schema" section (after line 97):**

```markdown
**Account Hierarchies**:
- Accounts support parent-child relationships via `parentAccountId` (self-referencing FK)
- Use cases: Corporate subsidiaries, franchise structures, regional offices
- **Note**: UI does not currently display hierarchy tree view - flat list only
- To query hierarchy: Use recursive CTE or Drizzle's `with` clause for parent chain
```

**Rationale**: Important schema feature with no UI implementation.

---

### 5. QuickBooks Integration Status Alert
**Replace line 100 with:**

```markdown
**Location**: `apps/api/src/services/quickbooks.bak/` **⚠️ CURRENTLY DISABLED**

**IMPORTANT**: QuickBooks integration is in backup state and not active. To re-enable:
1. Obtain QBO developer credentials (sandbox/production)
2. Configure OAuth 2.0 flow with redirect URI
3. Rename `quickbooks.bak/` → `quickbooks/`
4. Uncomment QBO routes in `apps/api/src/routes/index.ts`
5. Test thoroughly in QBO sandbox before production

**Why disabled**: Likely due to OAuth token management complexity or sandbox environment issues during development.
```

**Rationale**: Critical to know main integration is inactive.

---

### 6. Data Seeding Best Practices
**Add after line 225 in "First-Time Setup":**

```markdown
# 3.5. Additional seeding (optional)
# For development/testing, you can use ad-hoc scripts in root directory:
npx tsx create-test-orders.ts          # Generate test orders
npx tsx import-contacts-addresses.ts   # Bulk import from Excel
# Note: These are development scripts, not production seeds
```

**Rationale**: Clarifies purpose of scripts scattered in root.

---

### 7. Email System Architecture
**Add new section after "Email Service" (after line 118):**

```markdown
**Email System Maturity Levels**:
- **Currently Active**: Basic email sending via Outlook with template support
  - Templates in `email_templates` table with variable substitution ({{varName}})
  - OAuth tokens stored in `outlook_tokens` with auto-refresh
  - Sent emails logged in `email_logs` (status, timestamp, entity links)

- **Partially Built (Not Active)**:
  - Email queuing: `email_queue` table exists but BullMQ integration not implemented
  - Email analytics: `email_activity_log` table ready for open/click tracking

**Token Refresh**: Outlook tokens auto-refresh when expired. To manually refresh:
```typescript
import { OutlookClient } from './services/email/outlook-client'
await OutlookClient.refreshAccessToken(refreshToken, clientId, clientSecret)
```
```

**Rationale**: Explains what's implemented vs planned.

---

### 8. Performance Optimization Guidance
**Add new section after "Important Notes" (after line 335):**

```markdown
## Performance Considerations

### Database Indexing
**Current State**: Only primary keys and foreign keys are indexed by default.

**Recommended Indexes** (add via migration):
```sql
-- High-frequency query columns
CREATE INDEX idx_accounts_name ON accounts(name);
CREATE INDEX idx_accounts_active ON accounts(active);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_seller_id ON orders(seller_id);
CREATE INDEX idx_orders_buyer_id ON orders(buyer_id);
CREATE INDEX idx_order_lines_product_id ON order_lines(product_id);
CREATE INDEX idx_contracts_status ON contracts(status);
```

### Frontend Data Fetching
**Issue**: Some pages use manual `useState` + `useEffect` instead of TanStack Query.

**Best Practice**: Always use TanStack Query hooks for server state:
```typescript
// ❌ Avoid
const [data, setData] = useState([])
useEffect(() => { fetch('/api/accounts').then(...) }, [])

// ✅ Preferred
const { data, isLoading } = useQuery({
  queryKey: ['accounts'],
  queryFn: () => apiFetch('/api/accounts')
})
```

Benefits: Automatic caching, deduplication, refetching, error handling.

### N+1 Query Prevention
Use Drizzle relations to fetch related data in one query:
```typescript
// ❌ Avoid (N+1 queries)
const accounts = await db.select().from(accountsTable)
for (const account of accounts) {
  account.addresses = await db.select().from(addresses).where(eq(addresses.accountId, account.id))
}

// ✅ Preferred (single query with join)
const accounts = await db.query.accounts.findMany({
  with: { addresses: true, contacts: true }
})
```
```

**Rationale**: Addresses common performance pitfalls.

---

### 9. Security Notes
**Add to "Important Notes" section:**

```markdown
- **MFA Secret Storage**: MFA secrets stored as plain base32 strings in `users.mfaSecret` column. For production, consider encrypting with AES-256 and storing decryption key in secrets manager.
- **CSRF Protection**: API currently lacks CSRF tokens. If frontend uses cookie-based auth instead of bearer tokens, add `csurf` middleware.
```

**Rationale**: Highlights security gaps for production deployment.

---

### 10. Troubleshooting - Expanded
**Add to "Common Issues" section (after line 360):**

```markdown
- **"Account not found" but exists in database**: Check `active` flag - many queries filter `active = true` by default. Frontend has "Show Active Only" toggle.
- **Migrations fail with "table already exists"**: Database contains manually created tables (see sqlschema.txt). Either drop conflicting tables or manually update migration journal.
- **PDF generation fails**: Verify Puppeteer can run headless Chrome (requires system dependencies on Linux). Check AWS S3 credentials and bucket permissions.
- **Permissions don't update after role change**: Frontend caches permissions - user must log out and log back in, or clear browser localStorage.
- **Winston logs not appearing**: Check `apps/api/logs/` directory exists and is writable. Logs rotate but no max size - monitor disk usage.
```

**Rationale**: Real-world issues discovered during analysis.

---

### 11. Dual Frontend Consolidation Note
**Add to "Two Frontend Versions" section (after line 79):**

```markdown
**Maintenance Note**: Running two identical apps creates code duplication. Consider consolidating into single app with theme switching:
```typescript
// Example approach
const theme = useTheme() // 'admin' | 'sales'
<Button className={theme === 'sales' ? 'bg-gradient-to-r ...' : 'bg-blue-600'}>
```
Benefits: Single codebase, half the maintenance, easier testing, consistent behavior.

Currently deferred to maintain UI independence during rapid iteration.
```

**Rationale**: Documents known technical debt.

---

### 12. Broker Tracking Patterns
**Add to "Database Schema" section:**

```markdown
**Broker Tracking** (Dual Pattern):
- **Account-level**: `accounts.brokerIds` - Array of Clerk user IDs for assigned brokers
- **Contract-level**: Free-text broker information (name, address, phone, email)
- **Note**: No unified `brokers` entity - brokers are either users (Clerk) or contract metadata
```

**Rationale**: Clarifies non-standard pattern.

---

## Summary of Changes

| Priority | Section | Type | Lines |
|----------|---------|------|-------|
| 🔴 Critical | Database Schema | Add warning | After 97 |
| 🔴 Critical | QuickBooks | Update status | Replace 100 |
| 🟡 High | Contract Management | New section | After 322 |
| 🟡 High | Performance | New section | After 335 |
| 🟢 Medium | Commission Models | Add note | After 325 |
| 🟢 Medium | Email Architecture | Expand section | After 118 |
| 🟢 Medium | Security | Add notes | After 325 |
| 🟢 Medium | Troubleshooting | Expand | After 360 |

## Implementation Priority

1. **Immediate**: Add database schema drift warning (prevents migration failures)
2. **Immediate**: Update QuickBooks status (prevents confusion about disabled feature)
3. **High**: Document contract management (complex feature, not obvious)
4. **Medium**: Performance guidance (helps future development)
5. **Low**: Other clarifications (improves understanding but not blocking)
