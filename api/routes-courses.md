# API Routes: Courses & Semesters & Sections

> CRUD endpoints for the course structure hierarchy.

## Courses

| Method | Endpoint | Query Params | Response |
|---|---|---|---|
| GET | `/courses` | `institution_id` (required) | Paginated |
| GET | `/courses/:id` | | Single |
| POST | `/courses` | | Single |
| PUT | `/courses/:id` | | Single |
| DELETE | `/courses/:id` | | Single |

**Required fields:** `name`, `institution_id`

## Semesters

| Method | Endpoint | Query Params | Response |
|---|---|---|---|
| GET | `/semesters` | `course_id` (required) | Paginated |
| GET | `/semesters/:id` | | Single |
| POST | `/semesters` | | Single |
| PUT | `/semesters/:id` | | Single |
| DELETE | `/semesters/:id` | | Single |

**Required fields:** `name`, `course_id`

## Sections

| Method | Endpoint | Query Params | Response |
|---|---|---|---|
| GET | `/sections` | `semester_id` (required) | Paginated |
| GET | `/sections/:id` | | Single |
| POST | `/sections` | | Single |
| PUT | `/sections/:id` | | Single |
| DELETE | `/sections/:id` | | Single |

**Required fields:** `name`, `semester_id`

## Reorder (all three)

| Method | Endpoint | Body | Notes |
|---|---|---|---|
| PUT | `/semesters/reorder` | `{ items: [{ id, sort_order }] }` | ⚠️ N individual UPDATEs (BUG-009) |
| PUT | `/sections/reorder` | `{ items: [{ id, sort_order }] }` | Same issue |

## Notes

- Always filter by parent: courses by `institution_id`, semesters by `course_id`, sections by `semester_id`
- Flat route style: `/semesters?course_id=xxx`, NOT `/courses/xxx/semesters`
