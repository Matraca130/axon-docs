# Frontend → Backend API Map

> Maps frontend function calls to backend endpoints.
> Used to identify what's connected and what's missing.

## Status Legend

- ✅ Connected — function exists in `platformApi.ts` and backend has the endpoint
- ❌ Missing — frontend calls it but function doesn't exist in `platformApi.ts`
- ❓ Unknown — needs verification against backend code

## Known Missing Functions (Build Blockers)

These functions are CALLED by frontend components but do NOT exist in `platformApi.ts`:

| Function | Called By | Expected Endpoint | Status |
|---|---|---|---|
| `createStudySession` | Study components | `POST /study-sessions` | ❌ Missing |
| `updateStudySession` | Study components | `PUT /study-sessions/:id` | ❌ Missing |
| `submitReview` | Review components | `POST /reviews` | ❌ Missing |

## Action Required

To complete this map, run in the `axon-backend` repo:

```bash
# List all registered endpoints
grep -rn "\.(get\|post\|put\|delete\|patch)(" src/ --include="*.ts" | grep -v node_modules
```

And in the `numero1` frontend repo:

```bash
# List all API calls
grep -rn "platformApi\.\|fetch\|/api/" src/ --include="*.ts" --include="*.tsx" | grep -v node_modules
```

Cross-reference both outputs to complete this document.

## CRUD Factory Endpoints (Auto-Generated)

Every entity that goes through `crud-factory.ts` gets these 5 endpoints:

```
GET    /{entity}           → list (paginated)
GET    /{entity}/:id       → get one
POST   /{entity}           → create
PUT    /{entity}/:id       → update
DELETE /{entity}/:id       → delete
```

Response format for list: `{ data: { items: [...], total, limit, offset } }`
Response format for single: `{ data: { ... } }`
