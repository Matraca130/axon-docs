# API Routes: Courses & Semesters & Sections

> CRUD endpoints for the course structure hierarchy.
> **Updated:** 2026-03-14

## Courses

| Method | Endpoint | Query Params | Response |
|---|---|---|---|
| GET | `/courses` | `institution_id` (required) | Paginated |
| GET | `/courses/:id` | | Single |
| POST | `/courses` | | Single |
| PUT | `/courses/:id` | | Single |
| DELETE | `/courses/:id` | | Single (soft-delete) |
| PUT | `/courses/:id/restore` | | Single (restore) |

**Required fields:** `name`, `institution_id`

## Semesters

| Method | Endpoint | Query Params | Response |
|---|---|---|---|
| GET | `/semesters` | `course_id` (required) | Paginated |
| GET | `/semesters/:id` | | Single |
| POST | `/semesters` | | Single |
| PUT | `/semesters/:id` | | Single |
| DELETE | `/semesters/:id` | | Single (soft-delete) |
| PUT | `/semesters/:id/restore` | | Single (restore) |

**Required fields:** `name`, `course_id`

## Sections

| Method | Endpoint | Query Params | Response |
|---|---|---|---|
| GET | `/sections` | `semester_id` (required) | Paginated |
| GET | `/sections/:id` | | Single |
| POST | `/sections` | | Single |
| PUT | `/sections/:id` | | Single |
| DELETE | `/sections/:id` | | Single (soft-delete) |
| PUT | `/sections/:id/restore` | | Single (restore) |

**Required fields:** `name`, `semester_id`

## Reorder

All use the unified `PUT /reorder` endpoint:

```json
{ "table": "semesters", "items": [{ "id": "uuid", "order_index": 0 }, ...] }
```

> Uses `bulk_reorder()` RPC (atomic). Field is `order_index` (INTEGER).

## Notes

- Always filter by parent: courses by `institution_id`, semesters by `course_id`, sections by `semester_id`
- Flat route style: `/semesters?course_id=xxx`, NOT `/courses/xxx/semesters`
- All support soft-delete + restore
