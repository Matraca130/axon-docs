# Schema: Core (Organizational)

> Tables that form the organizational backbone of Axon.
> **VERIFIED against Query 2 constraints data.**

## institutions

| Column | Type | Nullable | Notes |
|---|---|---|---|
| id | UUID | NO | PK |
| name | TEXT | NO | |
| slug | TEXT | NO | URL-friendly identifier |
| owner_id | UUID | NO | FK → profiles.id |
| is_active | BOOLEAN | NO | Soft delete |
| settings | JSONB | NO | Institution configuration |
| created_at | TIMESTAMPTZ | NO | |
| updated_at | TIMESTAMPTZ | NO | |

**FKs:** `owner_id` → `profiles.id`

## courses

| Column | Type | Nullable | Notes |
|---|---|---|---|
| id | UUID | NO | PK |
| institution_id | UUID | NO | FK → institutions.id |
| name | TEXT | NO | |
| description | TEXT | YES | |
| order_index | INTEGER | NO | Manual ordering |
| created_by | UUID | NO | FK → profiles.id |
| is_active | BOOLEAN | NO | |
| created_at | TIMESTAMPTZ | NO | |
| updated_at | TIMESTAMPTZ | NO | |

## semesters

| Column | Type | Nullable | Notes |
|---|---|---|---|
| id | UUID | NO | PK |
| course_id | UUID | NO | FK → courses.id |
| name | TEXT | NO | |
| order_index | INTEGER | NO | Manual ordering |
| created_by | UUID | NO | FK → profiles.id |
| is_active | BOOLEAN | NO | |
| created_at | TIMESTAMPTZ | NO | |
| updated_at | TIMESTAMPTZ | NO | |

## sections

| Column | Type | Nullable | Notes |
|---|---|---|---|
| id | UUID | NO | PK |
| semester_id | UUID | NO | FK → semesters.id |
| name | TEXT | NO | |
| order_index | INTEGER | NO | Manual ordering |
| created_by | UUID | NO | FK → profiles.id |
| is_active | BOOLEAN | NO | |
| created_at | TIMESTAMPTZ | NO | |
| updated_at | TIMESTAMPTZ | NO | |

## topics

| Column | Type | Nullable | Notes |
|---|---|---|---|
| id | UUID | NO | PK |
| section_id | UUID | NO | FK → sections.id |
| name | TEXT | NO | |
| order_index | INTEGER | NO | Manual ordering |
| created_by | UUID | NO | FK → profiles.id |
| is_active | BOOLEAN | NO | |
| created_at | TIMESTAMPTZ | NO | |
| updated_at | TIMESTAMPTZ | NO | |

## Key Patterns

- All core tables have `order_index` (INTEGER, NOT NULL) for manual ordering
- All have `created_by` FK → profiles.id (tracks who created it)
- All have `is_active` (BOOLEAN, NOT NULL) for soft-delete
- Multi-tenancy chain: institutions → courses → semesters → sections → topics
