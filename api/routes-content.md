# API Routes: Content

> Topics, summaries, chunks, keywords, and videos.

## Topics

| Method | Endpoint | Query Params | Response |
|---|---|---|---|
| GET | `/topics` | `section_id` (required) | Paginated |
| GET | `/topics/:id` | | Single |
| POST | `/topics` | | Single |
| PUT | `/topics/:id` | | Single |
| DELETE | `/topics/:id` | | Single |

**Required fields:** `name`, `section_id`

## Summaries

| Method | Endpoint | Query Params | Response |
|---|---|---|---|
| GET | `/summaries` | `topic_id` (required) | Paginated |
| GET | `/summaries/:id` | | Single |
| POST | `/summaries` | | Single |
| PUT | `/summaries/:id` | | Single |
| DELETE | `/summaries/:id` | | Single |

**Required fields:** `topic_id`

## Chunks

| Method | Endpoint | Query Params | Response |
|---|---|---|---|
| GET | `/chunks` | `summary_id` (required) | Paginated |
| GET | `/chunks/:id` | | Single |
| POST | `/chunks` | | Single |
| PUT | `/chunks/:id` | | Single |
| DELETE | `/chunks/:id` | | Single |

**Required fields:** `content`, `summary_id`

## Keywords

| Method | Endpoint | Query Params | Response |
|---|---|---|---|
| GET | `/keywords` | `summary_id` (required) | Paginated |
| GET | `/keywords/:id` | | Single |
| POST | `/keywords` | | Single |
| PUT | `/keywords/:id` | | Single |
| DELETE | `/keywords/:id` | | Single |

**Required fields:** `name`, `summary_id`

## Videos

| Method | Endpoint | Query Params | Response |
|---|---|---|---|
| GET | `/videos` | `keyword_id` | Paginated |
| GET | `/videos/:id` | | Single |
| POST | `/videos` | | Single |
| PUT | `/videos/:id` | | Single |
| DELETE | `/videos/:id` | | Single |

## Content Tree (custom)

| Method | Endpoint | Query Params | Response |
|---|---|---|---|
| GET | `/content-tree` | `institution_id` or `course_id` | `{ data: [...] }` (array) |

Returns the full hierarchy in a nested tree structure.
⚠️ Filters inactive items in JavaScript, not SQL (BUG-007).

## Search (custom)

| Method | Endpoint | Query Params | Response |
|---|---|---|---|
| GET | `/search` | `q`, `institution_id` | `{ data: [...] }` (array) |

⚠️ Makes ~100 individual queries (BUG-008). Very slow.
