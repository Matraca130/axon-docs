# Schema: Core (Organizational)

> Tables that form the organizational backbone of Axon.
> **VERIFIED** against Query 2 constraint output.

## institutions

The root entity. All data is scoped by institution (multi-tenancy).

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | UUID | NO | gen_random_uuid() | PK |
| name | TEXT | NO | | Institution name |
| slug | TEXT | NO | | URL-friendly identifier |
| owner_id | UUID | NO | | FK -> profiles.id |
| is_active | BOOLEAN | NO | true | Soft delete |
| settings | JSONB | NO | '{}' | Institution settings |
| created_at | TIMESTAMPTZ | NO | now() | |
| updated_at | TIMESTAMPTZ | NO | now() | |

> Note: `logo_url` may exist but is nullable (no NOT NULL constraint found).

## courses

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | UUID | NO | gen_random_uuid() | PK |
| institution_id | UUID | NO | | FK -> institutions.id |
| name | TEXT | NO | | |
| order_index | INTEGER | NO | 0 | **Not `sort_order`!** |
| created_by | UUID | NO | | FK -> profiles.id |
| is_active | BOOLEAN | NO | true | |
| created_at | TIMESTAMPTZ | NO | now() | |
| updated_at | TIMESTAMPTZ | NO | now() | |

> Note: `description`, `code` may exist but are nullable.

## semesters

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | UUID | NO | gen_random_uuid() | PK |
| course_id | UUID | NO | | FK -> courses.id |
| name | TEXT | NO | | e.g. "Fall 2025" |
| order_index | INTEGER | NO | 0 | **Not `sort_order`!** |
| created_by | UUID | NO | | FK -> profiles.id |
| is_active | BOOLEAN | NO | true | |
| created_at | TIMESTAMPTZ | NO | now() | |
| updated_at | TIMESTAMPTZ | NO | now() | |

## sections

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | UUID | NO | gen_random_uuid() | PK |
| semester_id | UUID | NO | | FK -> semesters.id |
| name | TEXT | NO | | |
| order_index | INTEGER | NO | 0 | **Not `sort_order`!** |
| created_by | UUID | NO | | FK -> profiles.id |
| is_active | BOOLEAN | NO | true | |
| created_at | TIMESTAMPTZ | NO | now() | |
| updated_at | TIMESTAMPTZ | NO | now() | |

## Critical Corrections vs Initial Docs

- All ordering columns are `order_index` NOT `sort_order`
- All entities have `created_by` FK -> profiles.id (NOT NULL)
- `institutions.owner_id` is NOT NULL (was incorrectly marked nullable)
- `institutions.settings` JSONB is NOT NULL
