# 03 — Auth & Roles

> Authentication and authorization model for Axon.

## Double Token System

Every API request requires TWO headers:

```
Authorization: Bearer <SUPABASE_ANON_KEY>
X-Access-Token: <USER_JWT>
```

- `Authorization` — Supabase anon key (same for all users, identifies the project)
- `X-Access-Token` — User-specific JWT from Supabase Auth (identifies the user)

## Roles

| Role | Value | Permissions |
|---|---|---|
| Student | `student` | Read content, take quizzes, study flashcards |
| Professor | `professor` | All student perms + create/edit content |
| Owner/Admin | `owner` | All perms + manage institution, members, billing |

## Access Control

### Table: `memberships`

```sql
-- Links users to institutions with a role
user_id     → profiles.id
institution_id → institutions.id
role        → 'student' | 'professor' | 'owner'
status      → 'active' | 'pending' | 'suspended'
```

### Table: `plan_access_rules`

Controls which features are available based on the institution's subscription plan.

## Known Security Issues

- ⚠️ **JWT not cryptographically verified** — backend accepts tokens without signature validation
- ⚠️ **RLS disabled** on flashcards, quiz_questions, quizzes tables
- ⚠️ **CORS: origin "*"** — allows requests from any domain

See `bugs/security-audit.md` for full details.
