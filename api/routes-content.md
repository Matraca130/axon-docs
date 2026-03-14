# API Routes: Content

> Topics, summaries, chunks, keywords, and keyword connections.
>
> **Verified against:** `routes/content/crud.ts`, `routes/content/content-tree.ts`,
> `routes/content/keyword-connections.ts`, `routes/content/keyword-search.ts`,
> `routes/content/prof-notes.ts`, `routes/content/reorder.ts`,
> `routes/content/flashcards-by-topic.ts`
>
> **Last verified:** 2026-03-14

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

> Has denormalized `institution_id` (migration `20260304_06`), stored `fts` tsvector,
> `embedding vector(768)` for coarse-to-fine RAG, `chunk_strategy`, `last_chunked_at`.

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

> Has `embedding vector(768)` for RAG and stored `fts` tsvector.

## Summary Blocks

| Method | Endpoint | Query Params | Response |
|---|---|---|---|
| GET | `/summary-blocks` | `summary_id` (required) | Paginated |
| GET | `/summary-blocks/:id` | | Single |
| POST | `/summary-blocks` | | Single |
| PUT | `/summary-blocks/:id` | | Single |
| DELETE | `/summary-blocks/:id` | | Single |

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
**Optional fields:** `definition` (TEXT, nullable)

## Subtopics

| Method | Endpoint | Query Params | Response |
|---|---|---|---|
| GET | `/subtopics` | `keyword_id` (required) | Paginated |
| GET | `/subtopics/:id` | | Single |
| POST | `/subtopics` | | Single |
| PUT | `/subtopics/:id` | | Single |
| DELETE | `/subtopics/:id` | | Single (soft-delete) |

**Required fields:** `name`, `keyword_id`
**Max 6 subtopics per keyword.**

## Content Tree (custom)

| Method | Endpoint | Query Params | Response |
|---|---|---|---|
| GET | `/content-tree` | `institution_id` or `course_id` | `{ data: [...] }` (nested tree) |

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

| Method | Endpoint | Query Params/Body | Response |
|---|---|---|---|
| GET | `/keyword-connections` | `keyword_id` (required) | Array |
| GET | `/keyword-connections/:id` | | Single |
| POST | `/keyword-connections` | `{ keyword_a_id, keyword_b_id, relationship }` | Single (201) |
| DELETE | `/keyword-connections/:id` | | `{ deleted: id }` |
| GET | `/keyword-connections-batch` | `keyword_ids=uuid1,uuid2,...` (max 50) | Array with keyword names + summary info |

> `keyword-connections-batch` is a **PERF endpoint** (EC-02) that eliminates N+1 pattern.
> Returns connections for multiple keywords in 1 request with F1/F2-A joins.

## Keyword Search (custom, FLAT route)

| Method | Endpoint | Query Params | Response |
|---|---|---|---|
| GET | `/keyword-search` | `q`, `exclude_summary_id`, `course_id`, `limit` (default 15) | Array of `{ id, name, summary_id, definition, summary_title }` |

> Cross-summary keyword search (institution-scoped via RPC `search_keywords_by_institution`).
> Route is `/keyword-search` NOT `/keywords/search` (avoids CRUD factory collision).

## Professor Notes (custom)

| Method | Endpoint | Query Params | Response |
|---|---|---|---|
| GET | `/kw-prof-notes` | `keyword_id` (required) | Array |
| GET | `/kw-prof-notes/:id` | | Single |
| POST | `/kw-prof-notes` | `{ keyword_id, note }` | Single (201, upsert) |
| DELETE | `/kw-prof-notes/:id` | | `{ deleted: id }` |

## Flashcards by Topic (PERF)

| Method | Endpoint | Query Params | Response |
|---|---|---|---|
| GET | `/flashcards-by-topic` | `topic_id` (required) | Array |

> Batch loads all flashcards for all summaries in a topic (PERF C1).
