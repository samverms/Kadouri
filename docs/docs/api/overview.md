---
sidebar_position: 1
---

# API Overview

PACE CRM provides a RESTful API built with Express and TypeScript.

## Base URL

```
http://localhost:2000/api
```

## Authentication

All API endpoints (except `/health`) require authentication via Clerk.

### Request Headers

```http
Authorization: Bearer <clerk_session_token>
```

The Clerk session token is automatically included when using the frontend apps. For direct API calls, obtain the token from Clerk.

### Authentication Middleware

The API uses `@clerk/express` middleware:

```typescript
import { requireAuth } from '@clerk/express'

router.use(requireAuth())
```

## Response Format

### Success Response

```json
{
  "data": { ... },
  "message": "Success message (optional)"
}
```

### Error Response

```json
{
  "error": "Error message",
  "details": { ... }  // Optional additional details
}
```

## HTTP Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful GET, PUT, PATCH |
| 201 | Created | Successful POST |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Invalid input data |
| 401 | Unauthorized | Missing or invalid auth token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate resource |
| 500 | Internal Server Error | Server error |

## API Modules

The API is organized into domain modules:

### Core Resources

- [Accounts](accounts) - Sellers and buyers with addresses/contacts
- [Orders](orders) - Order management with line items
- [Products](products) - Product catalog management
- [Users](../features/users) - User management and invitations

### Authorization

- [Roles](roles) - RBAC role and permission management

### Integrations

- **QuickBooks** - Sync with QuickBooks Online
- **Email** - Send emails via Outlook

### Utilities

- **Search** - Global search across entities
- **Reports** - Analytics and reporting

## Common Query Parameters

### Pagination

```
GET /api/accounts?page=1&limit=20
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number (1-indexed) |
| `limit` | number | 20 | Items per page |

Response includes pagination metadata:

```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

### Filtering

```
GET /api/orders?status=confirmed&sellerId=abc123
```

Available filters vary by endpoint. See specific resource documentation.

### Sorting

```
GET /api/accounts?sortBy=name&sortOrder=asc
```

| Parameter | Type | Options | Description |
|-----------|------|---------|-------------|
| `sortBy` | string | varies | Field to sort by |
| `sortOrder` | string | `asc`, `desc` | Sort direction |

### Search

```
GET /api/accounts?search=acme
```

Performs text search across relevant fields.

## Rate Limiting

Currently no rate limiting is enforced on the API. This may be added in future versions.

## CORS

CORS is configured to allow requests from:

- `http://localhost:2005` (Web dashboard)
- `http://localhost:2010` (Sales dashboard)

For production, update CORS settings in `apps/api/src/main.ts`.

## Health Check

```http
GET /health
```

Returns server health status (no auth required):

```json
{
  "status": "ok",
  "timestamp": "2024-01-15T12:00:00.000Z"
}
```

## Example Request (cURL)

```bash
curl -X GET \
  http://localhost:2000/api/accounts \
  -H 'Authorization: Bearer <clerk_token>' \
  -H 'Content-Type: application/json'
```

## Example Request (JavaScript)

```javascript
const response = await fetch('http://localhost:2000/api/accounts', {
  headers: {
    'Authorization': `Bearer ${clerkToken}`,
    'Content-Type': 'application/json'
  }
})

const data = await response.json()
```

## Error Handling

The API uses a centralized error handler that provides consistent error responses:

```typescript
import { AppError } from './middleware/error-handler'

// Throw error in service
throw new AppError('Account not found', 404)

// Response:
{
  "error": "Account not found"
}
```

## Logging

All requests are logged using Winston. Logs include:

- Request method and path
- Response status code
- Response time
- User ID (if authenticated)
- Error details (if error occurred)

Logs are stored in `apps/api/logs/app.log`.

## Next Steps

- [Accounts API](accounts) - Account management endpoints
- [Orders API](orders) - Order management endpoints
- [Products API](products) - Product catalog endpoints
- [Roles API](roles) - RBAC management endpoints
