# 03 -- Auth & Roles

> **UPDATED with Query 2 corrections.**

## Double Token System

Every API request requires TWO headers:

```
Authorization: Bearer <SUPABASE_ANON_KEY>
X-Access-Token: <USER_JWT>
```

## Roles (CORRECTED: 4 roles)

| Role | Value | Permissions |
|---|---|---|
| Student | `student` | Read content, take quizzes, study flashcards |
| Professor | `professor` | All student perms + create/edit content |
| Admin | `admin` | Scoped admin (see admin_scopes table) |
| Owner | `owner` | Full institution management |

## Platform Roles (separate from institution roles)

| Role | Value | Notes |
|---|---|---|
| User | `user` | Default for all users |
| Platform Admin | `platform_admin` | Super-admin across all institutions |

## Access Control

### Table: `memberships`

```sql
user_id          -> profiles.id
institution_id   -> institutions.id
role             -> 'owner' | 'admin' | 'professor' | 'student'
is_active        -> BOOLEAN (NOT status enum!)
institution_plan_id -> institution_plans.id (nullable)
```

### Table: `admin_scopes` (NEW)

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

## Known Security Issues

- JWT not cryptographically verified
- RLS disabled on flashcards, quiz_questions, quizzes
- CORS: origin "*"

See `bugs/security-audit.md` for full details.
