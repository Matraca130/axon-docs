# 03 -- Auth & Roles

> **Updated:** 2026-03-14

## Double Token System

Every API request requires TWO headers:

```
Authorization: Bearer <SUPABASE_ANON_KEY>
X-Access-Token: <USER_JWT>
```

**IMPORTANT:** The user role is NOT in the JWT. It comes from `GET /institutions`.
A user can have different roles across different institutions.

## Roles (4 roles)

| Role | Value | Level | Permissions |
|---|---|---|---|
| Student | `student` | 1 | Read content, take quizzes, study flashcards, personal notes |
| Professor | `professor` | 2 | All student perms + create/edit content |
| Admin | `admin` | 3 | Scoped admin (see admin_scopes table) |
| Owner | `owner` | 4 | Full institution management |

## Role Sets (defined in `auth-helpers.ts`)

| Set | Roles | Used for |
|---|---|---|
| `ALL_ROLES` | owner, admin, professor, student | Any authenticated member |
| `MANAGEMENT_ROLES` | owner, admin | Institution management |
| `CONTENT_WRITE_ROLES` | owner, admin, professor | Content creation/editing |

## Access Control

### Table: `memberships`

```sql
user_id          -> profiles.id
institution_id   -> institutions.id
role             -> 'owner' | 'admin' | 'professor' | 'student'
is_active        -> BOOLEAN (NOT status enum!)
institution_plan_id -> institution_plans.id (nullable)
```

### Table: `admin_scopes`

Limits admin access to specific parts of the content tree:

```sql
membership_id -> memberships.id
scope_type    -> 'full' | 'course' | 'semester' | 'section'
scope_id      -> UUID of the scoped entity (nullable for 'full')
```

### Table: `plan_access_rules`

Controls content access based on subscription plan:

```sql
plan_id    -> institution_plans.id
scope_type -> 'course' | 'semester' | 'section' | 'topic' | 'summary'
scope_id   -> UUID of the accessible entity
```

## Security Status

| Issue | Status | Details |
|---|---|---|
| JWT verification | Mitigated (BUG-002) | PostgREST validates on DB query. Residual risk on non-DB routes |
| RLS disabled | Pending (BUG-003) | Backend enforces scoping via `checkContentScope()` |
| CORS wildcard | **FIXED** (2026-03-06) | Restricted to specific domains |
| Rate limiting | **DONE** (O-8) | 120 req/min sliding window + 20 AI POST/hr distributed |
| Webhook idempotency | **DONE** (O-7) | Event tracking for Stripe and Mux |
| Stripe timing-safe | **DONE** (N-10) | Constant-time signature comparison |

See `KNOWN-BUGS.md` for full details.
