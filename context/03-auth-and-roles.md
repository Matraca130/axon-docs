# 03 — Auth & Roles

> Authentication and authorization model. Updated with Query 2 real data.

## Double Token System

Every API request requires TWO headers:

```
Authorization: Bearer <SUPABASE_ANON_KEY>
X-Access-Token: <USER_JWT>
```

## Roles (CORRECTED — 4 roles, not 3)

| Role | Value | Permissions |
|---|---|---|
| Student | `student` | Read content, study flashcards, take quizzes |
| Professor | `professor` | All student perms + create/edit content |
| Admin | `admin` | Scoped admin — permissions defined by `admin_scopes` |
| Owner | `owner` | Full institution access + manage billing |

### Admin Scopes

The `admin` role gets granular permissions via the `admin_scopes` table:

| scope_type | Meaning |
|---|---|
| `full` | Same as owner (all permissions) |
| `course` | Admin access to a specific course |
| `semester` | Admin access to a specific semester |
| `section` | Admin access to a specific section |

## Platform Role (separate from membership role)

`profiles.platform_role`:
- `user` — normal user
- `platform_admin` — super admin across all institutions

## Access Control Tables

### memberships

```sql
user_id          → profiles.id
institution_id   → institutions.id
role             → 'owner' | 'admin' | 'professor' | 'student'
is_active        → BOOLEAN (not text status!)
institution_plan_id → institution_plans.id (nullable)
```

### plan_access_rules

Content gating based on subscription plan. Links `institution_plans.id` to a scoped entity:

```sql
plan_id      → institution_plans.id
scope_type   → 'course' | 'semester' | 'section' | 'topic' | 'summary'
scope_id     → UUID of the gated entity
```

## Known Security Issues

- ⚠️ **JWT not cryptographically verified**
- ⚠️ **RLS disabled** on flashcards, quiz_questions, quizzes
- ⚠️ **CORS: origin "*"**

See `bugs/security-audit.md` for details.
