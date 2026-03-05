# API Routes: Content

> Topics, summaries, chunks, keywords, and keyword connections.
>
> **Verified against:** `routes/content/crud.ts`, `routes/content/content-tree.ts`,
> `routes/content/keyword-connections.ts`, `routes/content/keyword-search.ts`,
> `routes/content/prof-notes.ts`, `routes/content/reorder.ts`
>
> **Last verified:** 2026-03-06

---

## Topics

| Method | Endpoint | Query Params | Response |
|---|---|---|---|
| GET | `/topics` | `section_id` (required) | Paginated |
| GET | `/topics/:id` | | Single |
| POST | `/topics` | | Single |
| PUT | `/topics/:id` | | Single |
| DELETE | `/topics/:id` | | Single (soft-delete) |
| PUT | `/topics/:id/restore` | | Single (restore) |

**Required fields:** `name`, `section_id`

## Summaries

| Method | Endpoint | Query Params | Response |
|---|---|---|---|
| GET | `/summaries` | `topic_id` (required) | Paginated |
| GET | `/summaries/:id` | | Single |
| POST | `/summaries` | | Single |
| PUT | `/summaries/:id` | | Single |
| DELETE | `/summaries/:id` | | Single (soft-delete) |
| PUT | `/summaries/:id/restore` | | Single (restore) |

**Required fields:** `topic_id`

> Note: `summaries` now has denormalized `institution_id` column
> (migration `20260304_06`) and stored `fts` tsvector column
> (migration `20260306_02`).

## Chunks

| Method | Endpoint | Query Params | Response |
|---|---|---|---|
| GET | `/chunks` | `summary_id` (required) | Paginated |
| GET | `/chunks/:id` | | Single |
| POST | `/chunks` | | Single |
| PUT | `/chunks/:id` | | Single |
| DELETE | `/chunks/:id` | | Single (soft-delete) |
| PUT | `/chunks/:id/restore` | | Single (restore) |

**Required fields:** `content`, `summary_id`

> Note: `chunks` has `embedding vector(768)` for RAG and stored `fts`
> tsvector column (migration `20260306_02`).

## Keywords

| Method | Endpoint | Query Params | Response |
|---|---|---|---|
| GET | `/keywords` | `summary_id` (required) | Paginated |
| GET | `/keywords/:id` | | Single |
| POST | `/keywords` | | Single |
| PUT | `/keywords/:id` | | Single |
| DELETE | `/keywords/:id` | | Single (soft-delete) |
| PUT | `/keywords/:id/restore` | | Single (restore) |

**Required fields:** `name`, `summary_id`

## Content Tree (custom)

| Method | Endpoint | Query Params | Response |
|---|---|---|---|
| GET | `/content-tree` | `institution_id` or `course_id` | `{ data: [...] }` (nested tree) |

Returns the full hierarchy in a nested tree structure.

## Search (custom)

| Method | Endpoint | Query Params | Response |
|---|---|---|---|
| GET | `/search` | `q`, `institution_id` | `{ data: [...] }` (array) |

## Reorder (custom)

| Method | Endpoint | Body | Response |
|---|---|---|---|
| PUT | `/reorder` | `{ table, items: [{id, order_index}] }` | `{ data: { updated } }` |

Atomic bulk reorder using `bulk_reorder()` RPC.

## Keyword Connections (custom)

Manages relationships between keywords.

| Method | Endpoint | Query Params/Body | Response |
|---|---|---|---|
| GET | `/keyword-connections` | `keyword_id` (required) | Array |
| POST | `/keyword-connections` | `{ keyword_id_a, keyword_id_b, relationship }` | Single (201) |
| DELETE | `/keyword-connections/:id` | | `{ deleted: id }` |

## Professor Notes (custom)

| Method | Endpoint | Query Params | Response |
|---|---|---|---|
| GET | `/kw-prof-notes` | `keyword_id` (required) | Array |
| POST | `/kw-prof-notes` | | Single (201) |
| PUT | `/kw-prof-notes/:id` | | Single |
| DELETE | `/kw-prof-notes/:id` | | `{ deleted: id }` |
