# Schema: Core (Organizational)

> Tables that form the organizational backbone of Axon.
> Source: Query 1 output cross-referenced with backend code.

## institutions

The root entity. All data is scoped by institution (multi-tenancy).

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | UUID | NO | gen_random_uuid() | PK |
| name | TEXT | NO | | Institution name |
| slug | TEXT | NO | | URL-friendly identifier |
| logo_url | TEXT | YES | | |
| plan | TEXT | YES | 'free' | Subscription plan |
| owner_id | UUID | YES | | FK → profiles.id |
| is_active | BOOLEAN | NO | true | Soft delete |
| created_at | TIMESTAMPTZ | NO | now() | |
| updated_at | TIMESTAMPTZ | NO | now() | |

## courses

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | UUID | NO | gen_random_uuid() | PK |
| institution_id | UUID | NO | | FK → institutions.id |
| name | TEXT | NO | | |
| description | TEXT | YES | | |
| code | TEXT | YES | | e.g. "CS101" |
| is_active | BOOLEAN | NO | true | |
| created_at | TIMESTAMPTZ | NO | now() | |
| updated_at | TIMESTAMPTZ | NO | now() | |

## semesters

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | UUID | NO | gen_random_uuid() | PK |
| course_id | UUID | NO | | FK → courses.id |
| name | TEXT | NO | | e.g. "Fall 2025" |
| start_date | DATE | YES | | |
| end_date | DATE | YES | | |
| is_active | BOOLEAN | NO | true | |
| sort_order | INTEGER | YES | 0 | Manual ordering |
| created_at | TIMESTAMPTZ | NO | now() | |
| updated_at | TIMESTAMPTZ | NO | now() | |

## sections

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | UUID | NO | gen_random_uuid() | PK |
| semester_id | UUID | NO | | FK → semesters.id |
| name | TEXT | NO | | |
| description | TEXT | YES | | |
| is_active | BOOLEAN | NO | true | |
| sort_order | INTEGER | YES | 0 | Manual ordering |
| created_at | TIMESTAMPTZ | NO | now() | |
| updated_at | TIMESTAMPTZ | NO | now() | |

## Notes

- All tables use UUID primary keys
- All have `created_at` / `updated_at` timestamps
- `is_active` is used for soft-delete across all core tables
- `sort_order` exists on semesters and sections for manual reordering
- Multi-tenancy chain: `institution_id` on courses → joins down through semesters → sections
