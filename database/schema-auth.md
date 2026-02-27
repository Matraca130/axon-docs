# Schema: Auth & Access Control

> **VERIFIED** against Query 2 constraint output.

## profiles

Extends Supabase Auth users.

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | UUID | NO | | PK = auth.users.id |
| email | TEXT | NO | | **NOT NULL** |
| full_name | TEXT | NO | | **NOT NULL** |
| avatar_url | TEXT | YES | | |
| platform_role | TEXT | NO | 'user' | CHECK: `platform_admin`, `user` |
| is_active | BOOLEAN | NO | true | |
| created_at | TIMESTAMPTZ | NO | now() | |
| updated_at | TIMESTAMPTZ | NO | now() | |

## memberships

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | UUID | NO | gen_random_uuid() | PK |
| user_id | UUID | NO | | FK -> profiles.id |
| institution_id | UUID | NO | | FK -> institutions.id |
| role | TEXT | NO | | CHECK: `owner`, `admin`, `professor`, `student` |
| is_active | BOOLEAN | NO | true | **NOT `status`!** Boolean, not enum |
| institution_plan_id | UUID | YES | | FK -> institution_plans.id |
| created_at | TIMESTAMPTZ | NO | now() | |
| updated_at | TIMESTAMPTZ | NO | now() | |

> **4 ROLES** not 3! `admin` exists between owner and professor.
> Uses `is_active` BOOLEAN, not `status` enum.

## admin_scopes

**NEW TABLE** - limits admin access to specific course/semester/section.

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | UUID | NO | gen_random_uuid() | PK |
| membership_id | UUID | NO | | FK -> memberships.id |
| scope_type | TEXT | NO | | CHECK: `full`, `course`, `semester`, `section` |
| scope_id | UUID | YES | | ID of the scoped entity |
| created_at | TIMESTAMPTZ | NO | now() | |

## platform_plans

**NEW TABLE** - global platform subscription plans.

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | UUID | NO | gen_random_uuid() | PK |
| name | TEXT | NO | | e.g. "Pro", "Enterprise" |
| slug | TEXT | NO | | URL-friendly |
| description | TEXT | YES | | |
| price_cents | INTEGER | NO | | Price in cents |
| billing_cycle | TEXT | NO | | CHECK: `monthly`, `yearly` |
| features | JSONB | NO | '{}' | Feature flags |
| is_active | BOOLEAN | NO | true | |
| created_at | TIMESTAMPTZ | NO | now() | |
| updated_at | TIMESTAMPTZ | NO | now() | |

## institution_plans

**NEW TABLE** - per-institution plans (customizable).

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | UUID | NO | gen_random_uuid() | PK |
| institution_id | UUID | NO | | FK -> institutions.id |
| name | TEXT | NO | | |
| description | TEXT | YES | | |
| price_cents | INTEGER | NO | | |
| billing_cycle | TEXT | NO | | CHECK: `monthly`, `semester`, `yearly` |
| is_default | BOOLEAN | NO | false | |
| is_active | BOOLEAN | NO | true | |
| trial_days | INTEGER | NO | 0 | |
| is_free | BOOLEAN | NO | false | |
| sort_order | INTEGER | NO | 0 | |
| currency | TEXT | NO | 'USD' | |
| created_at | TIMESTAMPTZ | NO | now() | |
| updated_at | TIMESTAMPTZ | NO | now() | |

## institution_subscriptions

**NEW TABLE** - actual subscriptions.

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | UUID | NO | gen_random_uuid() | PK |
| institution_id | UUID | NO | | FK -> institutions.id |
| plan_id | UUID | NO | | FK -> platform_plans.id |
| user_id | UUID | NO | | FK -> profiles.id (subscriber) |
| status | TEXT | NO | | CHECK: `active`, `past_due`, `canceled`, `trialing` |
| cancel_at_period_end | BOOLEAN | NO | false | |
| current_period_start | TIMESTAMPTZ | YES | | |
| current_period_end | TIMESTAMPTZ | YES | | |
| created_at | TIMESTAMPTZ | NO | now() | |
| updated_at | TIMESTAMPTZ | NO | now() | |

## plan_access_rules

Controls which content is accessible per plan.

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | UUID | NO | gen_random_uuid() | PK |
| plan_id | UUID | NO | | FK -> institution_plans.id |
| scope_type | TEXT | NO | | CHECK: `course`, `semester`, `section`, `topic`, `summary` |
| scope_id | UUID | NO | | ID of the accessible entity |
| created_at | TIMESTAMPTZ | NO | now() | |

## ai_generations

**NEW TABLE** - tracks AI content generation usage.

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | UUID | NO | gen_random_uuid() | PK |
| institution_id | UUID | NO | | FK -> institutions.id |
| requested_by | UUID | NO | | FK -> profiles.id |
| generation_type | TEXT | NO | | CHECK: `flashcards`, `quiz`, `keywords`, `chat`, `summary_diagnostic` |
| source_summary_id | UUID | YES | | FK -> summaries.id |
| source_keyword_id | UUID | YES | | FK -> keywords.id |
| items_generated | INTEGER | NO | 0 | |
| created_at | TIMESTAMPTZ | NO | now() | |

## Access Control Flow (corrected)

```
1. User authenticates -> gets JWT with user_id
2. Request hits backend -> extracts user_id from X-Access-Token
3. Backend queries memberships WHERE user_id = ? AND is_active = true
4. Gets institution_id + role from membership
5. If role = 'admin', checks admin_scopes for scope limits
6. Scopes ALL subsequent queries by institution_id
7. Checks role for write permissions
8. Checks plan_access_rules for content access
```
