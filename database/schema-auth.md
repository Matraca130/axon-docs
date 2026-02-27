# Schema: Auth & Access Control

> Tables for user profiles, memberships, and plan-based access.

## profiles

Extends Supabase Auth users with app-specific data.

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | UUID | NO | | PK — same as auth.users.id |
| email | TEXT | YES | | Denormalized from auth.users |
| full_name | TEXT | YES | | |
| avatar_url | TEXT | YES | | |
| created_at | TIMESTAMPTZ | NO | now() | |
| updated_at | TIMESTAMPTZ | NO | now() | |

## memberships

Links users to institutions with a role. This is the core access control table.

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | UUID | NO | gen_random_uuid() | PK |
| user_id | UUID | NO | | FK → profiles.id |
| institution_id | UUID | NO | | FK → institutions.id |
| role | TEXT | NO | | `'student'`, `'professor'`, `'owner'` |
| status | TEXT | NO | 'pending' | `'active'`, `'pending'`, `'suspended'` |
| created_at | TIMESTAMPTZ | NO | now() | |
| updated_at | TIMESTAMPTZ | NO | now() | |

**Unique constraint:** One membership per user per institution (`user_id` + `institution_id`).

## plan_access_rules

Controls feature access based on institution's subscription plan.

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | UUID | NO | gen_random_uuid() | PK |
| plan | TEXT | NO | | e.g. 'free', 'pro', 'enterprise' |
| feature | TEXT | NO | | Feature identifier |
| allowed | BOOLEAN | NO | true | |
| max_count | INTEGER | YES | | Limit (e.g. max courses) |
| created_at | TIMESTAMPTZ | NO | now() | |

## Access Control Flow

```
1. User authenticates → gets JWT with user_id
2. Request hits backend → extracts user_id from X-Access-Token
3. Backend queries memberships WHERE user_id = ? AND status = 'active'
4. Gets institution_id + role from membership
5. Scopes ALL subsequent queries by institution_id
6. Checks role for write permissions (student can't create content)
7. Checks plan_access_rules for feature limits
```

## Notes

- A user can belong to MULTIPLE institutions (different memberships)
- Role is per-institution (can be student in one, professor in another)
- The `profiles` table mirrors Supabase Auth — created via trigger on auth.users insert
