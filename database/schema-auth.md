# Schema: Auth, Plans & Access Control

> User profiles, memberships, plans, subscriptions.
> **VERIFIED against Query 2 constraints data.**

## profiles

| Column | Type | Nullable | Notes |
|---|---|---|---|
| id | UUID | NO | PK = auth.users.id |
| email | TEXT | NO | |
| full_name | TEXT | NO | |
| avatar_url | TEXT | YES | |
| platform_role | TEXT | NO | CHECK: `platform_admin`, `user` |
| is_active | BOOLEAN | NO | |
| created_at | TIMESTAMPTZ | NO | |
| updated_at | TIMESTAMPTZ | NO | |

## memberships

| Column | Type | Nullable | Notes |
|---|---|---|---|
| id | UUID | NO | PK |
| user_id | UUID | NO | FK → profiles.id |
| institution_id | UUID | NO | FK → institutions.id |
| role | TEXT | NO | CHECK: `owner`, `admin`, `professor`, `student` |
| institution_plan_id | UUID | YES | FK → institution_plans.id |
| is_active | BOOLEAN | NO | ⚠️ BOOLEAN, not text status |
| created_at | TIMESTAMPTZ | NO | |
| updated_at | TIMESTAMPTZ | NO | |

⚠️ **4 roles**, not 3: `owner`, `admin`, `professor`, `student`

## admin_scopes

Granular permissions for admin role.

| Column | Type | Nullable | Notes |
|---|---|---|---|
| id | UUID | NO | PK |
| membership_id | UUID | NO | FK → memberships.id |
| scope_type | TEXT | NO | CHECK: `full`, `course`, `semester`, `section` |
| scope_id | UUID | YES | ID of the scoped entity |
| created_at | TIMESTAMPTZ | NO | |

## platform_plans

| Column | Type | Nullable | Notes |
|---|---|---|---|
| id | UUID | NO | PK |
| name | TEXT | NO | |
| slug | TEXT | NO | |
| description | TEXT | YES | |
| price_cents | INTEGER | NO | |
| billing_cycle | TEXT | NO | CHECK: `monthly`, `yearly` |
| features | JSONB | NO | Feature flags |
| is_active | BOOLEAN | NO | |
| created_at | TIMESTAMPTZ | NO | |
| updated_at | TIMESTAMPTZ | NO | |

## institution_plans

| Column | Type | Nullable | Notes |
|---|---|---|---|
| id | UUID | NO | PK |
| institution_id | UUID | NO | FK → institutions.id |
| name | TEXT | NO | |
| description | TEXT | YES | |
| price_cents | INTEGER | NO | |
| billing_cycle | TEXT | NO | CHECK: `monthly`, `semester`, `yearly` |
| is_default | BOOLEAN | NO | |
| is_active | BOOLEAN | NO | |
| trial_days | INTEGER | NO | |
| is_free | BOOLEAN | NO | |
| sort_order | INTEGER | NO | |
| currency | TEXT | NO | |
| created_at | TIMESTAMPTZ | NO | |
| updated_at | TIMESTAMPTZ | NO | |

## institution_subscriptions

| Column | Type | Nullable | Notes |
|---|---|---|---|
| id | UUID | NO | PK |
| institution_id | UUID | NO | FK → institutions.id |
| plan_id | UUID | NO | FK → platform_plans.id |
| user_id | UUID | NO | FK → profiles.id |
| status | TEXT | NO | CHECK: `active`, `past_due`, `canceled`, `trialing` |
| current_period_start | TIMESTAMPTZ | YES | |
| current_period_end | TIMESTAMPTZ | YES | |
| cancel_at_period_end | BOOLEAN | NO | |
| created_at | TIMESTAMPTZ | NO | |
| updated_at | TIMESTAMPTZ | NO | |

## plan_access_rules

| Column | Type | Nullable | Notes |
|---|---|---|---|
| id | UUID | NO | PK |
| plan_id | UUID | NO | FK → institution_plans.id |
| scope_type | TEXT | NO | CHECK: `course`, `semester`, `section`, `topic`, `summary` |
| scope_id | UUID | NO | ID of the entity being gated |
| created_at | TIMESTAMPTZ | NO | |

## Access Control Flow (corrected)

```
1. User authenticates → gets JWT
2. Backend extracts user_id from X-Access-Token
3. Query: memberships WHERE user_id = ? AND is_active = true
4. Gets institution_id + role (owner/admin/professor/student)
5. If role = 'admin', check admin_scopes for granular perms
6. Scope ALL queries by institution_id
7. Check plan_access_rules for content gating
```
